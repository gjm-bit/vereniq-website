import type { Metadata } from "next";
import { getOrganizationFooterData, getWebsiteSocialLinks } from "@/src/lib/public-cms";
import { absoluteUrl } from "@/src/lib/seo";
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
import "./header-footer-branding.css";
import "./waarom-meer-vereniging.css";
import "./de-app-mogelijkheden-fix.css";

export const metadata: Metadata = {
  title: { default: "Meer Vereniging — Minder regelen. Meer verenigen.", template: "%s | Meer Vereniging" },
  description: "Het complete platform voor verenigingen die minder willen regelen en meer willen verenigen.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://meervereniging.nl"),
  // /site-icon is een dynamische Route Handler (app/site-icon/route.ts) die
  // doorverwijst naar het in Website → Instellingen ingestelde website-
  // icoon, met een veilige fallback naar exact deze huidige standaard-
  // afbeelding zolang er geen eigen icoon is ingesteld.
  icons: { icon: "/site-icon", shortcut: "/site-icon" },
  openGraph: { siteName: "Meer Vereniging", type: "website", locale: "nl_NL" },
  twitter: { card: "summary_large_image" },
};

/**
 * sameAs komt uit dezelfde, al bestaande, CMS-gestuurde socialkanalenbron als
 * de footer (getWebsiteSocialLinks / getOrganizationFooterData.social) - geen
 * verzonnen profielen, en automatisch in sync met wat er echt is ingesteld.
 */
async function organizationSameAs(): Promise<string[]> {
  const genericLinks = await getWebsiteSocialLinks();
  if (genericLinks !== null) return genericLinks.map((link) => link.url);
  const footer = await getOrganizationFooterData();
  if (!footer) return [];
  return Object.values(footer.social).filter((url): url is string => Boolean(url));
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://meervereniging.nl";
  const sameAs = await organizationSameAs();
  const structuredData = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", name: "Meer Vereniging", url, logo: absoluteUrl("/brand/meer-vereniging-brand-lockup.png"), description: "Verenigingssoftware voor leden, agenda, communicatie en beheer.", ...(sameAs.length > 0 ? { sameAs } : {}) },
    { "@type": "WebSite", name: "Meer Vereniging", url },
    { "@type": "SoftwareApplication", name: "Meer Vereniging", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Eén compleet platform voor verenigingen met leden, teams, vrijwilligers en commissies." },
  ] };
  return <html lang="nl"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>;
}
