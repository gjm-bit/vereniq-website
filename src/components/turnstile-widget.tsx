"use client";

// PROEFABONNEMENT FASE 3 — laadt het officiële Cloudflare Turnstile-script
// eenmalig en rendert de widget. Het token dat de widget levert bewijst
// niets op zichzelf - de server (app/api/proefabonnement/aanvraag/route.ts)
// verifieert het altijd opnieuw met het geheime sleutel. Geen dependency
// nodig: het script is een simpele <script>-tag, exact zoals Cloudflare
// het documenteert.

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile_script_failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileWidget({ siteKey, onToken, onExpire }: { siteKey: string; onToken: (token: string) => void; onExpire: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const domId = useId();

  useEffect(() => {
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          "expired-callback": () => onExpire(),
          "error-callback": () => setFailed(true),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (failed) {
    return <p className="field-error" id={domId}>Verificatie kon niet worden geladen. Herlaad de pagina en probeer het opnieuw.</p>;
  }
  return <div className="turnstile-slot" ref={containerRef} aria-live="polite" />;
}
