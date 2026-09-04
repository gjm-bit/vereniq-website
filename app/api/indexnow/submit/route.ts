// INDEXNOW — publieke trigger-route, ALLEEN aanroepbaar met het juiste
// gedeelde secret (server-only env var INDEXNOW_TRIGGER_SECRET). Zie
// docs/indexnow.md voor de volledige architectuur en het aansluitpunt dat
// in het (hier off-limits) Websitebeheer-apprepo nog nodig is om dit
// automatisch aan te roepen na een publicatie.
//
// Deze route is zelf ALTIJD onder /api/ - dus al gedekt door de bestaande
// `Disallow: /api/` in robots.txt (zie app/robots.ts /
// src/config/crawl-policy.ts). Er is niets aan deze route zelf dat
// geïndexeerd zou moeten worden.
//
// Bewust GEEN "submit on every request"/"submit on every pageview": de
// aanroeper moet expliciet een lijst URL's meesturen die daadwerkelijk
// gepubliceerd/gewijzigd zijn. Alleen met `?mode=full` (handmatig, voor
// eerste inrichting of een volledige resync) wordt de complete actuele
// sitemap ingediend - nooit het automatische pad.

import { sha256Hex } from "@/src/lib/server/webcrypto";
import { assertServerOnly } from "@/src/lib/server/server-only";
import { submitToIndexNow } from "@/src/lib/server/indexnow";
import { createIndexNowTracer } from "@/src/lib/server/indexnow-trace";
import { readJsonBodyWithTimeout } from "@/src/lib/server/indexnow-body-read";
import sitemap from "@/app/sitemap";

export const runtime = "nodejs";

/**
 * Bewezen live productiemeting (indexnow_trace, 3/3 requests): `await
 * request.json()` kan in deze runtime blijven hangen tot Vercel's harde
 * 300s-platformlimiet - ruim voorbij Websitebeheer se eigen 8000ms-
 * round-trip-budget. Deze waarde ligt ruim onder dat budget: een geldige,
 * kleine JSON-body (een handvol URL's) parseert normaliter in enkele
 * milliseconden, dus 2000ms is ~750x zoveel marge boven het normale geval
 * - deze grens wordt alleen ooit geraakt in exact het pathologische
 * hang-scenario dat live is bewezen, nooit tijdens gewone werking.
 */
const BODY_READ_TIMEOUT_MS = 2000;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

/**
 * Vergelijkt twee strings via hun SHA-256-hash i.p.v. direct met `===`, om
 * te voorkomen dat een aanvaller het secret via responstiming (vroegtijdig
 * stoppen bij het eerste afwijkende teken) kan raden. Geen ingebouwde
 * timing-safe-compare beschikbaar op zowel de Vercel Node-runtime als
 * Cloudflare Workers zonder `node:crypto` (zie webcrypto.ts) - dit is het
 * lichtgewicht alternatief dat op beide werkt.
 */
async function secretsMatch(a: string, b: string): Promise<boolean> {
  const [hashA, hashB] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  return hashA === hashB;
}

export async function POST(request: Request) {
  assertServerOnly();
  // Tijdelijke diagnose-instrumentatie (zie indexnow-trace.ts) - logt
  // uitsluitend een willekeurige correlation-id + eventnaam + elapsed ms,
  // nooit het secret/headers/body/query.
  const { trace } = createIndexNowTracer();
  trace("route_start");

  const configuredSecret = process.env.INDEXNOW_TRIGGER_SECRET;
  if (!configuredSecret) {
    trace("response_return", { status: 503, code: "not_configured" });
    return json({ success: false, code: "not_configured", message: "IndexNow-trigger is niet geconfigureerd." }, 503);
  }

  const providedSecret = request.headers.get("x-indexnow-trigger-secret") ?? "";
  if (!providedSecret || !(await secretsMatch(providedSecret, configuredSecret))) {
    trace("response_return", { status: 401, code: "unauthorized" });
    return json({ success: false, code: "unauthorized", message: "Ongeldig of ontbrekend secret." }, 401);
  }
  trace("auth_complete");

  const url = new URL(request.url);
  const fullResync = url.searchParams.get("mode") === "full";
  // Sluit de (synchrone) URL-/querystringparsing zelf apart uit als
  // mogelijk blokkeerpunt - tussen dit event en `body_read_start` staat
  // geen enkele andere statement.
  trace("url_parsed", { fullResync });

  let requestedUrls: string[] = [];
  if (fullResync) {
    const entries = await sitemap();
    requestedUrls = entries.map((entry) => entry.url);
    trace("sitemap_loaded", { entryCount: entries.length });
  } else {
    trace("body_read_start");
    const bodyResult = await readJsonBodyWithTimeout(request, BODY_READ_TIMEOUT_MS);
    if (!bodyResult.ok) {
      if (bodyResult.reason === "timeout") {
        // Het bewezen live scenario: de body kwam niet op tijd binnen.
        // Antwoord DIRECT, gecontroleerd - laat de Lambda niet doorlopen
        // tot Vercel's eigen 300s-platformlimiet.
        trace("body_read_timeout");
        trace("response_return", { status: 408, code: "request_body_timeout" });
        return json({ success: false, code: "request_body_timeout", message: "De aanvraag kon niet op tijd worden gelezen. Probeer het later opnieuw." }, 408);
      }
      trace("body_read_error", { errorCategory: "invalid_json" });
      trace("response_return", { status: 400, code: "invalid_request" });
      return json({ success: false, code: "invalid_request", message: "Ongeldige aanvraag: verwacht JSON met een 'urls'-array." }, 400);
    }
    trace("body_read_complete");
    const body = bodyResult.body;
    const urls = body && typeof body === "object" && "urls" in body ? (body as { urls: unknown }).urls : null;
    if (!Array.isArray(urls) || urls.length === 0) {
      trace("response_return", { status: 400, code: "invalid_request" });
      return json({ success: false, code: "invalid_request", message: "Verwacht een niet-lege 'urls'-array in de request body." }, 400);
    }
    requestedUrls = urls.filter((entry): entry is string => typeof entry === "string");
  }

  if (requestedUrls.length === 0) {
    trace("response_return", { status: 400, code: "invalid_request" });
    return json({ success: false, code: "invalid_request", message: "Geen bruikbare URL's in de aanvraag." }, 400);
  }
  trace("validation_complete", { urlCount: requestedUrls.length });

  const result = await submitToIndexNow(requestedUrls, { trace });
  trace("response_return", { status: 200, requested: result.requested, submitted: result.submitted });
  return json({ success: result.submitted > 0, ...result });
}
