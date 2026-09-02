import { PublicShell } from "@/src/components/site-shell";
import { TrialActivationStatus } from "@/src/components/trial-activation-status";
import { pageMetadata } from "@/src/lib/seo";

export const metadata = pageMetadata({
  title: "Activeer je proefabonnement",
  description: "Rond de activatie van je gratis proefabonnement af.",
  path: "/proefabonnement/activeren",
  noindex: true,
});

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
