// INDEXNOW DIAGNOSE (tijdelijk) — server-side faseinstrumentatie voor
// POST /api/indexnow/submit, toegevoegd om exact te bewijzen waar de tijd
// wordt verbruikt vóórdat een functionele fix wordt gekozen voor de
// geconstateerde race met het 8000ms-round-trip-budget van Websitebeheer
// (zie website-indexnow.ts daar, off-limits repo).
//
// Verboden om ooit te loggen: het secret zelf, request headers,
// authorization, de volledige request body, querystring-waarden, of
// persoonsgegevens. Deze module logt uitsluitend: een willekeurige
// correlation-id (bevat geen gebruikersinformatie), een vaste eventnaam, en
// elapsed milliseconds sinds route-entry - plus een klein aantal niet-
// gevoelige getallen/statuscodes/foutcategorieën die de aanroeper expliciet
// meegeeft.

import { randomHex } from "./webcrypto";

export type IndexNowTraceEvent = (event: string, extra?: Readonly<Record<string, string | number | boolean>>) => void;

export function createIndexNowTracer(): { correlationId: string; trace: IndexNowTraceEvent } {
  const correlationId = randomHex(8);
  const routeStartedAt = Date.now();
  const trace: IndexNowTraceEvent = (event, extra) => {
    console.info(JSON.stringify({ scope: "indexnow_trace", correlationId, event, elapsedMs: Date.now() - routeStartedAt, ...extra }));
  };
  return { correlationId, trace };
}
