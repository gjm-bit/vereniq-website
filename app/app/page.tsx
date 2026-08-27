import Platform from "../platform/page";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { getPublishedCmsPage } from "@/src/lib/public-cms";

/**
 * Canonical public app destination. Until its CMS concept is page-scoped
 * published, it safely retains the proven platform fallback rather than
 * exposing a draft or creating a broken navigation destination.
 */
export default async function AppPage() {
  const cmsPage = await getPublishedCmsPage("/mogelijkheden");
  return cmsPage ? <CmsPublicPageView page={cmsPage} /> : <Platform />;
}
