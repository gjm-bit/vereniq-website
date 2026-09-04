// INDEXNOW — begrensde bodylees-helper voor POST /api/indexnow/submit.
//
// Bewezen productie-oorzaak (zie de tijdelijke indexnow_trace-instrumentatie
// in route.ts): `await request.json()` kan in deze Vercel Node-runtime
// blijven hangen totdat het platform de Lambda na 300 seconden hard
// afbreekt (HTTP 504) - 3/3 live metingen kwamen nooit voorbij
// `body_read_start`. De vermoedelijke oorzaak zit in hoe de binnenkomende
// body als streaming `ReadableStream` wordt aangeboden (`Readable.toWeb(req)`
// in het door vinext gegenereerde `api/handler.mjs`), niet in de JSON-
// parsing zelf.
//
// BELANGRIJKE ONTWERPKEUZE (empirisch bewezen, niet aangenomen): een simpele
// `Promise.race([request.json(), timeoutPromise])` lost het probleem NIET
// echt op. `request.json()` verkrijgt intern zelf een reader-lock op
// `request.body`; zolang die belofte hangt, faalt een `request.body.cancel()`
// van buitenaf altijd met "Invalid state: ReadableStream is locked" (lokaal
// geverifieerd) - de onderliggende stream/verbinding blijft dus gewoon
// hangen, ook al lijkt de route zelf snel te antwoorden. Deze helper leest
// de body daarom zelf, met een eigen `reader = request.body.getReader()`
// - omdat WIJ dan de lock vasthouden, kan `reader.cancel()` bij een timeout
// daadwerkelijk de onderliggende bron aanspreken en een hangende `read()`
// laten settlen (lokaal geverifieerd: de onderliggende `cancel()` van de
// bron wordt aantoonbaar aangeroepen en de hangende `read()`-belofte
// resolveert binnen enkele honderden ms, in plaats van nooit).
//
// `request.text()` + `JSON.parse` was hier bewust GEEN oplossing: die
// verkrijgt intern dezelfde soort lock op dezelfde stream en zou aan
// exact hetzelfde "locked"-probleem lijden - vandaar deze eigen,
// reader-gebaseerde implementatie i.p.v. een van beide ingebouwde helpers.

import { assertServerOnly } from "./server-only";

export type ReadJsonBodyResult =
  | Readonly<{ ok: true; body: unknown }>
  | Readonly<{ ok: false; reason: "invalid_json" }>
  | Readonly<{ ok: false; reason: "timeout" }>;

/**
 * Leest en parsed de JSON-body van `request`, begrensd door `timeoutMs`.
 *
 * - Geldige JSON binnen de tijdslimiet: `{ ok: true, body }`.
 * - Ongeldige JSON (maar wel op tijd gelezen): `{ ok: false, reason: "invalid_json" }`.
 * - Geen volledige body binnen `timeoutMs`: `{ ok: false, reason: "timeout" }` -
 *   de aanroeper kan dan DIRECT een gecontroleerde response teruggeven i.p.v.
 *   te wachten tot de Lambda op een platformlimiet stuit.
 *
 * Veiligheidsgaranties:
 * - Wij houden de reader-lock zelf vast (zie boven) - `reader.cancel()` bij
 *   een timeout geeft de onderliggende bron dus daadwerkelijk het signaal
 *   dat niemand meer luistert, in plaats van stil te falen.
 * - De `finally`-tak ruimt zowel de timer als de reader-lock altijd op, wat
 *   er ook gebeurt (geldige body, ongeldige body, timeout, onverwachte fout).
 * - Na een timeout wordt nooit meer op een later alsnog aankomend chunk
 *   gereageerd: de leeslus checkt `timedOut` direct na iedere `read()` en
 *   retourneert dan meteen, vóórdat er nog geparsed/gebruikt wordt.
 * - Geen enkele `catch`/`finally` hier laat een fout ongevangen naar buiten
 *   lekken (geen unhandled rejection mogelijk).
 */
export async function readJsonBodyWithTimeout(request: Request, timeoutMs: number): Promise<ReadJsonBodyResult> {
  assertServerOnly();

  if (!request.body) {
    // Geen body om te lezen (lege POST) - functioneel gelijk aan ongeldige
    // JSON, geen aparte foutcategorie nodig.
    return { ok: false, reason: "invalid_json" };
  }

  const reader = request.body.getReader();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel("body_read_timeout").catch(() => undefined);
  }, timeoutMs);

  const decoder = new TextDecoder();
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (timedOut) return { ok: false, reason: "timeout" };
      if (done) break;
      if (value) text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return timedOut ? { ok: false, reason: "timeout" } : { ok: false, reason: "invalid_json" };
  } finally {
    clearTimeout(timer);
    try {
      reader.releaseLock();
    } catch {
      // Kan al ontgrendeld zijn na cancel() - nooit fataal.
    }
  }

  if (text.length === 0) {
    return { ok: false, reason: "invalid_json" };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
