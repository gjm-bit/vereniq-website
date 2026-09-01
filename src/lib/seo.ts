import type { Metadata } from "next";
import { site } from "@/src/config/site";

/**
 * Bestaand, echt merkasset (geen gegenereerde/AI-afbeelding): het logo met
 * tagline op een lichte achtergrond. Niet 1200x630 (het ideale OG-formaat),
 * maar wel herkenbaar en centraal gepositioneerd, dus bruikbare fallback
 * zolang er geen speciaal gemaakte 1200x630-afbeelding bestaat.
 */
const DEFAULT_OG_IMAGE = "/brand/meer-vereniging-brand-lockup.png";

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

/**
 * Consistente canonical + Open Graph + Twitter-metadata voor één publieke
 * pagina. `path` is de canonieke, publieke route (zonder trailing slash),
 * bijvoorbeeld "/platform" of "/modules/agenda".
 */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogImage?: string;
  /**
   * Zet op true voor de ene pagina waarvan de titel al identiek is aan de
   * root-default (de homepage-fallback): voorkomt dat layout.tsx's
   * titel-template ("%s | Meer Vereniging") een tweede keer "| Meer
   * Vereniging" achter een titel plakt die dat al bevat.
   */
  titleIsAbsolute?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);
  const image = absoluteUrl(input.ogImage ?? DEFAULT_OG_IMAGE);
  return {
    title: input.titleIsAbsolute ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: site.name,
      type: "website",
      locale: "nl_NL",
      images: [{ url: image, width: 588, height: 516, alt: `${site.name} logo` }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

/**
 * BreadcrumbList JSON-LD voor een detailpagina (bv. modules/[slug],
 * voor-wie/[slug], kennisbank/[slug]). `trail` is de reeks {name, path} van
 * home tot en met de huidige pagina.
 */
export function breadcrumbJsonLd(trail: readonly { name: string; path: string }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
}
