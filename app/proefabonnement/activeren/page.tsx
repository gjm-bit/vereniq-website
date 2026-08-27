import type { Metadata } from "next";

import { PublicShell } from "@/src/components/site-shell";
import { TrialActivationStatus } from "@/src/components/trial-activation-status";

export const metadata: Metadata = {
  title: "Activeer je proefabonnement",
  robots: { index: false, follow: false },
};

export default function ProefabonnementActiverenPage() {
  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <p className="eyebrow">Proefabonnement</p>
          <h1>Activeren</h1>
          <div style={{ marginTop: 24 }}>
            <TrialActivationStatus />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
