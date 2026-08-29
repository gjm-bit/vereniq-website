import type { Metadata } from "next";
import "./globals.css";
import "./dark-brand-canvas.css";
import "./dark-premium-v2.css";
import "./reference-visual-match-v1.css";
import "./reference-visual-match-detail.css";
import "./mobile-menu.css";
import "./development-home.css";
import "./cms-typography.css";
import "./cms-video.css";
import "./development-contact.css";
import "./brand-direction.css";
import "./homepage-creative.css";
import "./navigation-consolidation.css";
import "./cms-product-explorer.css";
import "./de-app-polish.css";
import "./de-app-sections.css";
import "./de-app-reference-layout.css";
import "./trial-signup.css";

export const metadata: Metadata = {
  title: { default: "Meer Vereniging — Minder regelen. Meer verenigen.", template: "%s | Meer Vereniging" },
  description: "Het complete platform voor verenigingen die minder willen regelen en meer willen verenigen.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://meervereniging.nl"),
  icons: { icon: "/brand/meer-vereniging-brand-lockup.png", shortcut: "/brand/meer-vereniging-brand-lockup.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://meervereniging.nl";
  const structuredData = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", name: "Meer Vereniging", url, description: "Verenigingssoftware voor leden, agenda, communicatie en beheer." },
    { "@type": "WebSite", name: "Meer Vereniging", url },
    { "@type": "SoftwareApplication", name: "Meer Vereniging", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Eén compleet platform voor verenigingen met leden, teams, vrijwilligers en commissies." },
  ] };
  return <html lang="nl"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>;
}
