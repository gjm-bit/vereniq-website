import Platform from "../platform/page";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { getPublishedCmsPage } from "@/src/lib/public-cms";

/**
 * Canonical public app destination. Until its CMS concept is page-scoped
 * published, it safely retains the proven platform fallback rather than
 * exposing a draft or creating a broken navigation destination.
 *
 * SEO Vindbaarheid 2.0: had voorheen geen generateMetadata (gevonden tijdens
 * de technische audit) - viel daardoor terug op de generieke sitebrede
 * titel, ondanks dat dit een hoofdnavigatie-item is ("De app").
 */
export async function generateMetadata() {
  const cmsPage = await getPublishedCmsPage("/mogelijkheden");
  if (cmsPage) return { title: cmsPage.seoTitle ?? cmsPage.title, description: cmsPage.seoDescription ?? undefined, robots: cmsPage.noindex ? { index: false, follow: false } : undefined, alternates: { canonical: "/app" } };
  return { title: "De app", description: "Eén centrale omgeving voor leden, agenda, aanwezigheid, communicatie en beheer.", alternates: { canonical: "/app" } };
}

export default async function AppPage() {
  const cmsPage = await getPublishedCmsPage("/mogelijkheden");
  return cmsPage ? <CmsPublicPageView page={cmsPage} /> : <Platform />;
}
