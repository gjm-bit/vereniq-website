import CommercialPage, { generateMetadata as generateCommercialMetadata } from "../[...slug]/page";

/**
 * Canonical combined destination. The existing founders page remains the
 * safe public fallback until the composed CMS page is explicitly published.
 * The existing /contact route and its form stay available during that review.
 *
 * SEO Vindbaarheid 2.0: dit bestand rendert het [...slug]-component direct
 * (niet via Next.js-routing), dus Next.js riep generateMetadata van die
 * andere route nooit vanzelf aan - deze pagina viel daardoor terug op de
 * generieke sitebrede titel. Expliciet dezelfde functie hergebruiken lost
 * dat op zonder de metadata-logica te dupliceren.
 */
const OVER_ONS_PARAMS = Promise.resolve({ slug: ["over-ons"] });

export async function generateMetadata() {
  const meta = await generateCommercialMetadata({ params: OVER_ONS_PARAMS });
  return { ...meta, alternates: { canonical: "/over-ons-contact" } };
}

export default function AboutAndContactPage() {
  return <CommercialPage params={OVER_ONS_PARAMS} />;
}
