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

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SESSION_FLAG_KEY = "mv_stats_session_seen";
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

    const payload = JSON.stringify({
      path: pathname,
      referrerHost: resolveReferrerHost(),
      deviceType: resolveDeviceType(),
      newSession: resolveIsNewSession(),
      utmSource: resolveUtmSource(),
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
