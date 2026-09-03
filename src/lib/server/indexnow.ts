// INDEXNOW — server-only client voor de IndexNow-specificatie
// (https://www.indexnow.org/documentation), gebruikt door Bing, Yandex en
// andere deelnemende zoekmachines (niet door Google, dat heeft geen
// IndexNow-ondersteuning). Doel: wanneer een publieke pagina van
// meervereniging.nl daadwerkelijk gepubliceerd wordt of van URL verandert,
// kan deze module dat direct doorgeven i.p.v. te wachten tot de volgende
// crawl.
//
// Alleen dít stuk (validatie + submission + de sleutel-verificatieroute)
// hoort in de website-repo. De trigger zelf - "een redacteur publiceerde
// zojuist een pagina in Websitebeheer" - gebeurt in het aparte, hier
// off-limits app-repo. Zie docs/indexnow.md voor het exacte aansluitpunt dat
// daar nog nodig is (een uitgaande webhookaanroep naar
// POST /api/indexnow/submit met het gedeelde secret).

import { assertServerOnly } from "./server-only";
import { site } from "../../config/site";
import { isDisallowedPath } from "../../config/crawl-policy";

/**
 * Standaard IndexNow-sleutel, gecommit als `public/<KEY>.txt` (zie dat
 * bestand). Dit is GEEN geheim - de IndexNow-spec vereist juist dat de
 * sleutel publiek ophaalbaar is op exact dat pad, dat is hoe een
 * zoekmachine bevestigt dat de indiener ook echt de sitebeheerder is.
 * `INDEXNOW_KEY` (server-only env var, geen `NEXT_PUBLIC_`) kan deze
 * overschrijven om te roteren zonder codewijziging - in dat geval moet ook
 * een nieuw `public/<nieuwe-sleutel>.txt`-bestand worden toegevoegd vóór de
 * rotatie live gaat, anders faalt de sleutelverificatie bij de zoekmachine.
 */
export const DEFAULT_INDEXNOW_KEY = "1f34f0e5c1d3b6ebbfc1c09ab79cca80";

export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY?.trim() || DEFAULT_INDEXNOW_KEY;
}

export function getIndexNowKeyLocation(): string {
  return new URL(`/${getIndexNowKey()}.txt`, site.url).toString();
}

/** Padextensies die nooit een indexeerbare pagina zijn (statische assets, geen HTML-document). */
const NON_PAGE_EXTENSIONS = [".xml", ".txt", ".json", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".css", ".js", ".ico", ".map"];

/**
 * True als `url` een geldige, publieke, canonieke meervereniging.nl-pagina
 * is die naar IndexNow gestuurd mag worden. Weigert bewust: andere hosts,
 * niet-http(s), private/CMS/beheer/API-routes (zelfde lijst als robots.txt,
 * zie `src/config/crawl-policy.ts`), en statische bestanden/assets.
 */
export function isSubmittableUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  let siteOrigin: URL;
  try {
    siteOrigin = new URL(site.url);
  } catch {
    return false;
  }
  if (parsed.host !== siteOrigin.host) return false;
  if (parsed.pathname === "/_next" || parsed.pathname.startsWith("/_next/")) return false;
  if (isDisallowedPath(parsed.pathname)) return false;
  if (NON_PAGE_EXTENSIONS.some((extension) => parsed.pathname.toLowerCase().endsWith(extension))) return false;
  return true;
}

/**
 * Filtert en dedupliceert een lijst kandidaat-URL's naar alleen wat
 * daadwerkelijk naar IndexNow gestuurd mag worden. Retourneert ook de
 * geweigerde URL's apart (voor logging/rapportage aan de aanroeper), zonder
 * ooit te throwen op een ongeldige invoer.
 */
export function partitionSubmittableUrls(candidates: readonly string[]): { accepted: string[]; rejected: string[] } {
  const accepted = new Set<string>();
  const rejected: string[] = [];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate) {
      rejected.push(String(candidate));
      continue;
    }
    if (isSubmittableUrl(candidate)) accepted.add(candidate);
    else rejected.push(candidate);
  }
  return { accepted: [...accepted], rejected };
}

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow staat tot 10.000 URL's per submission toe; hier ruim onder gebleven uit voorzichtigheid. */
const MAX_URLS_PER_BATCH = 2000;
const REQUEST_TIMEOUT_MS = 8000;

export type IndexNowBatchResult = { batchSize: number; ok: boolean; status?: number; error?: string };
export type IndexNowSubmissionResult = { requested: number; submitted: number; rejected: number; batches: IndexNowBatchResult[] };

function chunk<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

/**
 * Dient URL's in bij IndexNow. Valideert/dedupliceert eerst zelf nogmaals
 * (verdedigend - een aanroeper kan `partitionSubmittableUrls` ook los
 * gebruikt hebben, maar deze functie moet nooit een ongeldige/private URL
 * doorsturen, ook niet als een aanroeper dat vergeet). Faalt nooit hard:
 * een IndexNow-storing mag de normale sitewerking nooit breken, dus elke
 * fout (netwerk, timeout, non-2xx) wordt hier opgevangen en als resultaat
 * teruggegeven, niet als exception.
 */
export async function submitToIndexNow(candidateUrls: readonly string[]): Promise<IndexNowSubmissionResult> {
  assertServerOnly();
  const { accepted, rejected } = partitionSubmittableUrls(candidateUrls);

  const result: IndexNowSubmissionResult = { requested: candidateUrls.length, submitted: 0, rejected: rejected.length, batches: [] };
  if (accepted.length === 0) return result;

  let siteHost: string;
  try {
    siteHost = new URL(site.url).host;
  } catch {
    result.batches.push({ batchSize: accepted.length, ok: false, error: "invalid_site_url" });
    return result;
  }

  const key = getIndexNowKey();
  const keyLocation = getIndexNowKeyLocation();

  for (const batch of chunk(accepted, MAX_URLS_PER_BATCH)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: siteHost, key, keyLocation, urlList: batch }),
        signal: controller.signal,
      });
      // IndexNow retourneert 200 (verwerkt) of 202 (geaccepteerd, nog te verwerken) bij succes.
      const ok = response.status === 200 || response.status === 202;
      result.batches.push({ batchSize: batch.length, ok, status: response.status });
      if (ok) result.submitted += batch.length;
      // Geen response-body loggen: IndexNow's foutrespons bevat geen
      // gevoelige data, maar er is ook geen enkele reden om hem te bewaren.
      if (!ok) console.error(JSON.stringify({ scope: "indexnow-submit", status: response.status, batchSize: batch.length }));
    } catch (error) {
      const message = error instanceof Error ? error.name : "unknown_error";
      result.batches.push({ batchSize: batch.length, ok: false, error: message });
      console.error(JSON.stringify({ scope: "indexnow-submit", error: message, batchSize: batch.length }));
    } finally {
      clearTimeout(timeout);
    }
  }

  return result;
}
