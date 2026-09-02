import Platform from "../platform/page";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { getPublishedCmsPage } from "@/src/lib/public-cms";
import { pageMetadata } from "@/src/lib/seo";

/**
 * Canonical public app destination. Until its CMS concept is page-scoped
 * published, it safely retains the proven platform fallback rather than
 * exposing a draft or creating a broken navigation destination.
 *
 * Zolang er geen eigen CMS-pagina voor /mogelijkheden bestaat, toont deze
 * route exact dezelfde inhoud als /platform. Om duplicate content te
 * voorkomen wijst de canonical dan naar /platform in plaats van naar
 * zichzelf; zodra een eigen CMS-pagina bestaat, canonicaliseert de route
 * naar zichzelf met de eigen SEO-titel/omschrijving.
 */
export async function generateMetadata() {
  const cmsPage = await getPublishedCmsPage("/mogelijkheden");
  if (cmsPage) return pageMetadata({ title: cmsPage.seoTitle ?? cmsPage.title, description: cmsPage.seoDescription ?? "", path: "/app", noindex: cmsPage.noindex });
  return pageMetadata({ title: "De app", description: "Meer Vereniging werkt gewoon in je browser, op laptop, tablet en telefoon. Geen installatie nodig.", path: "/platform" });
}

export default async function AppPage() {
  const cmsPage = await getPublishedCmsPage("/mogelijkheden");
  return cmsPage ? <CmsPublicPageView page={cmsPage} /> : <Platform />;
}
