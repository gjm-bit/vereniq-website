"use client";

// WEBSITE STATISTIEKEN 1.4 (AI-bezoeken productmatig afronden) — de
// "eenvoudige bestaande instellingenroute" om eerder gegeven toestemming in
// te trekken (of, andersom, alsnog te geven), rechtstreeks op /cookies. Geen
// nieuw consent-managementplatform: gewoon de huidige status + één knop.

import { useEffect, useState } from "react";
import { resolveConsentState, grantConsent, revokeConsent, type ConsentState } from "@/src/lib/ai-visit-consent";

export function ConsentRevokeControl() {
  const [state, setState] = useState<ConsentState | null>(null);

  useEffect(() => {
    // Zie consent-banner.tsx - localStorage is client-only, dus de echte
    // staat kan pas na mount gelezen worden (voorkomt een hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolveConsentState());
  }, []);

  if (state === null) return null;

  if (state === "granted") {
    return (
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <p className="muted" style={{ marginBottom: 10 }}>Je hebt toestemming gegeven om dit apparaat te herkennen als eerder bezocht.</p>
        <button
          type="button"
          className="btn"
          // .btn-secondary botst tussen globals.css en dark-premium-v2.css -
          // zie consent-banner.tsx voor dezelfde, bewuste omzeiling.
          style={{ border: "1px solid var(--brand-navy)", background: "var(--brand-white)", color: "var(--brand-navy)" }}
          onClick={() => {
            revokeConsent();
            setState("undecided");
          }}
        >
          Toestemming intrekken
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <p className="muted" style={{ marginBottom: 10 }}>Je hebt nog geen toestemming gegeven om dit apparaat te herkennen als eerder bezocht.</p>
      <button
        type="button"
        className="btn"
        style={{ border: "1px solid var(--brand-navy)", background: "var(--brand-white)", color: "var(--brand-navy)" }}
        onClick={() => {
          grantConsent();
          setState("granted");
        }}
      >
        Toestemming geven
      </button>
    </div>
  );
}
