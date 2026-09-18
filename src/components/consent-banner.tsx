"use client";

// WEBSITE STATISTIEKEN 1.4 (AI-bezoeken productmatig afronden) — de kleine,
// Oma Nel-proof toestemmingsmelding waarmee bezoekers kunnen toestaan dat
// dit apparaat wordt herkend als het de website al eerder bezocht (nodig om
// nieuwe versus terugkerende AI-bezoeken te kunnen tonen, zie
// src/lib/ai-visit-consent.ts). Verschijnt alleen zolang er nog geen keuze
// is vastgelegd; weigeren beperkt de website op geen enkele manier - de
// bestaande, cookieloze/sessiegebonden statistieken (1.1/1.2/1.3) blijven
// hoe dan ook gewoon werken. Geen extern consent-managementplatform, geen
// juridisch jargon: gewoon twee knoppen en een link naar /cookies.

import { useEffect, useState } from "react";
import { SiteLink as Link } from "@/src/components/site-link";
import { resolveConsentState, grantConsent, denyConsent } from "@/src/lib/ai-visit-consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // localStorage bestaat niet server-side - de server rendert dus altijd
    // "verborgen" en pas na mount lezen we de echte, client-only staat. Dat
    // voorkomt een hydration mismatch (server kan onmogelijk weten of dit
    // apparaat al eerder koos), ten koste van één onvermijdelijke
    // her-render na mount - vandaar bewust hier, niet in een lazy
    // useState-initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(resolveConsentState() === "undecided");
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Toestemming voor herkenning van dit apparaat"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 40,
        maxWidth: 640,
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 14,
        padding: "18px 20px",
        borderRadius: "var(--mv-radius)",
        border: "1px solid var(--brand-border)",
        background: "var(--brand-white)",
        boxShadow: "var(--mv-shadow)",
      }}
    >
      <p style={{ margin: 0, flex: "1 1 320px", color: "var(--brand-text)", fontSize: ".92rem", lineHeight: 1.55 }}>
        Meer Vereniging gebruikt alleen eigen statistieken om te zien hoe onze website wordt gevonden. Mogen we op dit apparaat onthouden of je de website eerder hebt bezocht?{" "}
        <Link href="/cookies" className="btn-quiet" style={{ fontSize: ".85rem" }}>
          Meer over cookies
        </Link>
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            grantConsent();
            setVisible(false);
          }}
        >
          Ja, dat is goed
        </button>
        <button
          type="button"
          className="btn"
          // .btn-secondary botst tussen globals.css en dark-premium-v2.css
          // (twee verschillende, allebei geldige kleurdefinities voor
          // dezelfde classnaam) - hier expliciet vastgezet zodat deze knop
          // altijd leesbaar navy-op-wit rendert, ongeacht die botsing.
          style={{ border: "1px solid var(--brand-navy)", background: "var(--brand-white)", color: "var(--brand-navy)" }}
          onClick={() => {
            denyConsent();
            setVisible(false);
          }}
        >
          Nee, liever niet
        </button>
      </div>
    </div>
  );
}
