// TIJDELIJKE, GEÏSOLEERDE diagnose-endpoint — bewust GEEN onderdeel van de
// vinext/App Router-pijplijn, GEEN import uit src/lib/**, GEEN gebruik van
// `Readable.toWeb`/`Request`. Doel: bewijzen of een POST-body van
// Websitebeheer op Vercel's Node 24.x-runtime volledig aankomt als kale
// `http.IncomingMessage`, geheel los van vinext's geconsolideerde
// `api/handler.mjs`-adapter en de catch-all rewrite (`/(.*)` →
// `/api/handler?path=...`) waar de bestaande IndexNow-route wél doorheen
// loopt. Dit bestand raakt de bestaande route (`app/api/indexnow/submit`)
// op geen enkele manier aan.
//
// Veiligheidsgrenzen (nooit overschrijden):
// - Body-inhoud wordt nooit opgeslagen, geparsed, gelogd of teruggegeven -
//   alleen het AANTAL ontvangen bytes wordt geteld.
// - Het secret wordt uitsluitend constant-time vergeleken (via een hash),
//   nooit gelogd of teruggegeven.
// - De respons bevat uitsluitend niet-gevoelige transportmetadata (zie
//   `DiagResponse`) - geen URL's, geen headers-dump, geen secret, geen body.
// - Begrensd door een eigen, korte veiligheidstimeout (12s, ruim onder de
//   geconfigureerde 15s `maxDuration` van deze function) zodat een eventuele
//   hang - precies het fenomeen dat we willen meten - deze tijdelijke
//   function nooit tot een platformlimiet laat doorlopen.

import { timingSafeEqual, createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export const config = { runtime: "nodejs", maxDuration: 15 };

const SAFETY_TIMEOUT_MS = 12_000;

type DiagResponse = Readonly<{
  success: boolean;
  code?: string;
  declaredContentLength: string | null;
  transferEncodingPresent: boolean;
  contentEncodingPresent: boolean;
  receivedBytes: number;
  endSeen: boolean;
  abortedSeen: boolean;
  closeSeen: boolean;
  timedOut: boolean;
  complete: boolean;
  readableEnded: boolean;
  destroyed: boolean;
  elapsedMs: number;
}>;

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

/**
 * Constant-time stringvergelijking (via SHA-256-hash i.p.v. directe
 * lengte-afhankelijke `===`) - zelfde motivatie als de bestaande
 * `secretsMatch` in `app/api/indexnow/submit/route.ts`, hier lokaal
 * gedupliceerd om dit bestand bewust volledig los te houden van
 * `src/lib/server/**`.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const startedAt = Date.now();

  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, code: "method_not_allowed" });
    return;
  }

  const configuredSecret = process.env.INDEXNOW_TRIGGER_SECRET;
  const rawProvided = req.headers["x-indexnow-trigger-secret"];
  const providedSecret = Array.isArray(rawProvided) ? rawProvided[0] : rawProvided;
  if (!configuredSecret || !providedSecret || !timingSafeStringEqual(providedSecret, configuredSecret)) {
    sendJson(res, 401, { success: false, code: "unauthorized" });
    return;
  }

  const declaredContentLength = (req.headers["content-length"] as string | undefined) ?? null;
  const transferEncodingPresent = req.headers["transfer-encoding"] !== undefined;
  const contentEncodingPresent = req.headers["content-encoding"] !== undefined;

  let receivedBytes = 0;
  let endSeen = false;
  let abortedSeen = false;
  let closeSeen = false;
  let responded = false;

  const finish = (timedOut: boolean) => {
    if (responded) return;
    responded = true;
    clearTimeout(safetyTimer);
    const body: DiagResponse = {
      success: endSeen,
      declaredContentLength,
      transferEncodingPresent,
      contentEncodingPresent,
      receivedBytes,
      endSeen,
      abortedSeen,
      closeSeen,
      timedOut,
      complete: Boolean(req.complete),
      readableEnded: Boolean(req.readableEnded),
      destroyed: Boolean(req.destroyed),
      elapsedMs: Date.now() - startedAt,
    };
    sendJson(res, 200, body);
  };

  const safetyTimer = setTimeout(() => finish(true), SAFETY_TIMEOUT_MS);

  // Uitsluitend tellen/observeren - nooit de body-inhoud gebruiken/opslaan.
  req.on("data", (chunk: Buffer) => {
    receivedBytes += chunk.length;
  });
  req.on("end", () => {
    endSeen = true;
    finish(false);
  });
  req.on("aborted", () => {
    abortedSeen = true;
  });
  req.on("close", () => {
    closeSeen = true;
    // Sluit de verbinding zonder ooit 'end' te hebben gezien: dat is zelf
    // precies het te meten fenomeen. Probeer dan alsnog af te ronden (de
    // client kan al weg zijn, maar dit voorkomt dat de function nodeloos
    // tot de safety-timeout blijft hangen).
    finish(false);
  });
}
