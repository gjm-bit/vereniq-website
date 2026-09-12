"use client";

// WEBSITE STATISTIEKEN 1.1 (nightshift 2026-09-09/10) — cookieloze,
// first-party paginaweergave-teller. Geen cookies, geen fingerprinting,
// geen cross-site tracking: de enige clientstate is een sessionStorage-vlag
// die puur lokaal bepaalt of dit tabblad al eerder een pagina van deze site
// bezocht ("nieuwe sessie"), en die vlag verlaat de browser nooit als
// waarde - alleen als boolean meegestuurd, nooit als identificerende
// sleutel. sessionStorage wordt gewist zodra het tabblad sluit; er wordt
// niets bewaard over een sessie heen. Zie app/api/website-stats/pageview/
// route.ts voor wat er wél/nooit wordt opgeslagen, en /cookies voor de
// bijbehorende toelichting aan bezoekers.
//
// WEBSITE STATISTIEKEN 1.2 (AI-vindbaarheid): resolveUtmSource() leest
// bewust rechtstreeks `window.location.search` (net als resolveReferrerHost/
// resolveDeviceType hierboven al `document`/`window` lezen), in plaats van
// Next.js' `useSearchParams()`-hook - dat voorkomt elke kans dat deze
// sitewide, in de rootlayout gerenderde component de statische prerendering
// van de rest van de site zou beïnvloeden. Er wordt uitsluitend de ENE
// `utm_source`-parameter gelezen, nooit de rest van de querystring.
//
// WEBSITE STATISTIEKEN 1.3 (AI-bezoeken): een AI-sessie mag maximaal ÉÉN
// AI-bezoek registreren, ook als de bezoeker binnen die sessie nog meerdere
// interne pagina's bekijkt (of zelfs een ANDER AI-platform detecteert - zie
// AI_SESSION_SOURCE_KEY hieronder, "first-touch", sticky voor de rest van de
// sessie). Dit is dezelfde sessionStorage-mechaniek als SESSION_FLAG_KEY
// hierboven (1.1): niet-persistent, gewist zodra het tabblad sluit, nooit
// een identificerende waarde - alleen een van de 5 vaste AI-bronsleutels of
// niets. Cross-sessie nieuw/terugkerend (die een PERSISTENTE clientwaarde
// zou vereisen, bv. localStorage) wordt hier bewust NIET geïmplementeerd:
// daarvoor bestaat op dit moment geen consent-/privacybasis op deze site
// (de gepubliceerde /cookies-pagina committeert zich expliciet aan "geen
// analytics zonder voorafgaande toestemming"). De server (route.ts) stuurt
// hiervoor dus altijd een vaste, niet-classificerende waarde mee - zie daar.

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { resolveAiSource } from "@/src/lib/ai-referral-source";

const SESSION_FLAG_KEY = "mv_stats_session_seen";
const AI_SESSION_SOURCE_KEY = "mv_ai_session_source";
const ENDPOINT = "/api/website-stats/pageview";

function resolveDeviceType(): "mobile" | "desktop" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  try {
    return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
  } catch {
    return "unknown";
  }
}

function resolveReferrerHost(): string | null {
  if (typeof document === "undefined" || !document.referrer) return null;
  try {
    const referrer = new URL(document.referrer);
    if (typeof window !== "undefined" && referrer.hostname === window.location.hostname) return null;
    return referrer.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function resolveUtmSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get("utm_source");
  } catch {
    return null;
  }
}

/**
 * Leest de AI-bron waaraan DEZE browsersessie eerder al is toegeschreven
 * (indien aanwezig) - "first-touch", nooit overschreven door een latere,
 * andere detectie binnen dezelfde sessie (voorkomt een dubbel AI-bezoek als
 * een bezoeker binnen één sessie via twee verschillende AI-platforms
 * doorklikt). Retourneert null als deze sessie nog geen AI-bron heeft.
 */
function resolvePriorAiSessionSource(): string | null {
  try {
    return sessionStorage.getItem(AI_SESSION_SOURCE_KEY);
  } catch {
    return null;
  }
}

function persistAiSessionSourceIfNew(directAiSource: string | null, priorAiSource: string | null): void {
  if (priorAiSource || !directAiSource) return;
  try {
    sessionStorage.setItem(AI_SESSION_SOURCE_KEY, directAiSource);
  } catch {
    // sessionStorage onbeschikbaar - de paginaweergave/het AI-bezoek van
    // déze pageview telt nog gewoon mee, alleen de sessie-brede sticky
    // toeschrijving voor latere pagina's in dezelfde sessie lukt dan niet.
  }
}

function resolveIsNewSession(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_FLAG_KEY)) return false;
    sessionStorage.setItem(SESSION_FLAG_KEY, "1");
    return true;
  } catch {
    // sessionStorage onbeschikbaar (bv. privénavigatie) - de
    // paginaweergave telt gewoon mee, alleen "nieuwe sessie" wordt dan
    // niet herkend. Nooit de teller hierdoor laten falen.
    return false;
  }
}

export function WebsiteStatsBeacon() {
  const pathname = usePathname();
  const sentForPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || sentForPathname.current === pathname) return;
    sentForPathname.current = pathname;

    const referrerHost = resolveReferrerHost();
    const utmSource = resolveUtmSource();
    const directAiSource = resolveAiSource({ referrerHost, utmSource });
    const priorAiSessionSource = resolvePriorAiSessionSource();
    persistAiSessionSourceIfNew(directAiSource, priorAiSessionSource);

    const payload = JSON.stringify({
      path: pathname,
      referrerHost,
      deviceType: resolveDeviceType(),
      newSession: resolveIsNewSession(),
      utmSource,
      // WEBSITE STATISTIEKEN 1.3: rapporteert uitsluitend de AI-bron waaraan
      // déze sessie VÓÓR deze paginaweergave al was toegeschreven (of null) -
      // nooit een vrije waarde, altijd een van de 5 vaste sleutels. De
      // server bepaalt hiermee of dit de EERSTE AI-paginaweergave van de
      // sessie is (een nieuw AI-bezoek) of een vervolgpagina binnen een
      // reeds lopend AI-bezoek.
      aiSessionSource: priorAiSessionSource,
    });

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
      } else {
        void fetch(ENDPOINT, { method: "POST", body: payload, headers: { "content-type": "application/json" }, keepalive: true });
      }
    } catch {
      // Een mislukte telling mag de paginaweergave zelf nooit beïnvloeden.
    }
  }, [pathname]);

  return null;
}
