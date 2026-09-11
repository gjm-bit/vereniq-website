import type { MetadataRoute } from "next"; import { site } from "@/src/config/site"; import { localModules, localPages } from "@/src/repositories/local";

// SEO Vindbaarheid 2.0 (technische audit-fixes):
// - Elke entry deelde voorheen dezelfde hardcoded `lastModified` (de "now"-
//   constante in src/repositories/local.ts) - dat is geen echte wijzigings-
//   datum en dus een misleidend versheidssignaal voor zoekmachines. `lastModified`
//   nu weggelaten i.p.v. een verzonnen datum te tonen (Next.js's sitemap-type
//   staat dat toe - een ontbrekend veld is eerlijker dan een onjuist veld).
// - /waarom-meer-vereniging en /app stonden niet in de sitemap ondanks dat
//   ze in de hoofdnavigatie staan (gevonden tijdens de audit) - toegevoegd.
// - /kennisbank is tijdelijk noindex (zie app/kennisbank/page.tsx, 0 artikelen)
//   - daarom hier niet meer opgenomen totdat dat weer index toestaat.
//
// SEO Vindbaarheid 2.0 vervolgaudit (URL-audit /over-ons vs /over-ons-contact):
// - /over-ons is een bewezen duplicate/orphan (app/[...slug]/page.tsx canonicaliseert
//   hem nu naar /over-ons-contact) - niet meer los in de sitemap opnemen.
// - /over-ons-contact is de daadwerkelijke, in de hoofdnavigatie gelinkte
//   bestemming (src/config/site.ts) maar stond nog niet in de sitemap - toegevoegd.
// - De zes bestaande, al herschreven /voor-wie/[slug]-doelgroeppagina's stonden
//   alleen via interne links vindbaar, niet in de sitemap - toegevoegd (elk
//   vooraf geverifieerd op 200/indexeerbaar/self-canonical/unieke metadata).
const STATIC_ROUTES = [
  "/waarom-meer-vereniging",
  "/app",
  "/over-ons-contact",
  "/voor-wie/muziekverenigingen",
  "/voor-wie/sportverenigingen",
  "/voor-wie/carnavalsverenigingen",
  "/voor-wie/stichtingen",
  "/voor-wie/kleine-verenigingen",
  "/voor-wie/andere-verenigingen",
] as const;

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const [pages,modules] = await Promise.all([localPages.listPublished(),localModules.listPublished()]);
  return [
    ...pages.filter(p=>p.slug!=="kennisbank"&&p.slug!=="over-ons").map(p=>({url:`${site.url}/${p.slug==="home"?"":p.slug}`})),
    ...modules.map(m=>({url:`${site.url}/modules/${m.slug}`})),
    ...STATIC_ROUTES.map(path=>({url:`${site.url}${path}`})),
  ];
}
