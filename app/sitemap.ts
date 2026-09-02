import type { MetadataRoute } from "next";
import { site } from "@/src/config/site";
import { localArticles, localModules, localPages } from "@/src/repositories/local";

/**
 * Routes die een eigen, vaste page.tsx hebben (dus altijd bestaan, ongeacht
 * of er toevallig ook een CMS `Page`-rij met diezelfde slug bestaat).
 * Zonder deze lijst zou de sitemap voor deze routes volledig afhankelijk
 * zijn van een toevallige match in de CMS-paginatabel, wat voor deze
 * specifieke routes niet de werkelijke bron van waarheid is.
 * Geen lastModified: we hebben geen betrouwbare wijzigingsdatum voor
 * code-gedreven pagina's, dus verzinnen we er geen.
 */
const STATIC_ROUTES = ["/platform", "/waarom-meer-vereniging", "/modules", "/voor-wie", "/app", "/over-ons-contact", "/proefabonnement"];

/** Doelgroeppagina's onder /voor-wie/[slug] - zie app/voor-wie/[slug]/page.tsx. */
const VOOR_WIE_SLUGS = ["muziekverenigingen", "sportverenigingen", "carnavalsverenigingen", "stichtingen", "andere-verenigingen"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, modules, articles] = await Promise.all([localPages.listPublished(), localModules.listPublished(), localArticles.listPublished()]);

  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  const add = (url: string, lastModified?: string) => {
    if (!entries.has(url)) entries.set(url, lastModified ? { url, lastModified } : { url });
  };

  for (const p of pages) add(`${site.url}/${p.slug === "home" ? "" : p.slug}`, p.updatedAt);
  for (const m of modules) add(`${site.url}/modules/${m.slug}`, m.updatedAt);
  for (const a of articles) add(`${site.url}/kennisbank/${a.slug}`, a.updatedAt);

  for (const route of STATIC_ROUTES) add(`${site.url}${route}`);
  for (const slug of VOOR_WIE_SLUGS) add(`${site.url}/voor-wie/${slug}`);
  // Alleen indexeerbaar zodra er echte artikelen zijn - zie app/kennisbank/page.tsx.
  if (articles.length > 0) add(`${site.url}/kennisbank`);

  return [...entries.values()];
}
