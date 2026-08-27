import type { Metadata } from "next";

import { PublicShell } from "@/src/components/site-shell";
import { TrialSignupForm } from "@/src/components/trial-signup-form";
import { getPublicTrialColorPresets, getPublicTrialPeriodDays } from "@/src/lib/public-trial";

export const metadata: Metadata = {
  title: "Probeer gratis",
  description: "Start een gratis proefabonnement voor je vereniging - geen creditcard nodig.",
};

export default async function ProefabonnementPage() {
  const [trialDays, presets] = await Promise.all([getPublicTrialPeriodDays(), getPublicTrialColorPresets()]);
  const heroLabel = trialDays ? `Probeer ${trialDays} dagen gratis` : "Probeer gratis";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;

  return (
    <PublicShell>
      <section className="hero">
        <div className="container hero-layout">
          <div>
            <p className="eyebrow">Proefabonnement</p>
            <h1>{heroLabel}<br /><em>Geen creditcard nodig.</em></h1>
            <p className="lede">Vul je gegevens in, bevestig je e-mailadres en je omgeving staat voor je klaar. Je kunt op elk moment stoppen.</p>
          </div>
          <p className="home-hero-aside">Eigen kleurstijl.<br />Direct starten.<br /><strong>Geen verplichtingen.</strong></p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <TrialSignupForm initialTrialDays={trialDays} presets={presets} turnstileSiteKey={turnstileSiteKey} />
        </div>
      </section>
    </PublicShell>
  );
}
