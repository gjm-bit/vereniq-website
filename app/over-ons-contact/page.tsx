import CommercialPage from "../[...slug]/page";
import { getPublishedCmsPage } from "@/src/lib/public-cms";
import { pageMetadata } from "@/src/lib/seo";

/**
 * Canonical combined destination. The existing founders page remains the
 * safe public fallback until the composed CMS page is explicitly published.
 * The existing /contact route and its form stay available during that review.
 *
 * generateMetadata is route-segment-scoped in Next.js: importing and
 * rendering CommercialPage as a component does NOT pick up its own
 * generateMetadata export, so this route needs its own, mirroring the same
 * CMS-first-then-static-fallback logic for the "over-ons" content it renders.
 */
export async function generateMetadata() {
  const cmsPage = await getPublishedCmsPage("/over-ons");
  if (cmsPage) return pageMetadata({ title: cmsPage.seoTitle ?? cmsPage.title, description: cmsPage.seoDescription ?? "", path: "/over-ons-contact", noindex: cmsPage.noindex });
  return pageMetadata({
    title: "Over ons & contact",
    description: "Meer Vereniging komt voort uit de dagelijkse praktijk van verenigingen. Lees wie erachter zit en neem contact op.",
    path: "/over-ons-contact",
  });
}

export default function AboutAndContactPage() {
  return <CommercialPage params={Promise.resolve({ slug: ["over-ons"] })} />;
}
