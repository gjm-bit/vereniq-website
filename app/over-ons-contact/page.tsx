import CommercialPage from "../[...slug]/page";

/**
 * Canonical combined destination. The existing founders page remains the
 * safe public fallback until the composed CMS page is explicitly published.
 * The existing /contact route and its form stay available during that review.
 */
export default function AboutAndContactPage() {
  return <CommercialPage params={Promise.resolve({ slug: ["over-ons"] })} />;
}
