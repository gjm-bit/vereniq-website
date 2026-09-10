import { SiteLink as Link } from "@/src/components/site-link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/src/components/site-shell";
import { localModules } from "@/src/repositories/local";
import { site } from "@/src/config/site";

// SEO Vindbaarheid 2.0: BreadcrumbList JSON-LD (structured-data-plan §9) -
// geen zichtbare breadcrumb-UI (die bestaat nog nergens op de site, zie
// eindrapport), maar dit is valide, eerlijke schema-markup die exact de
// echte paginahiërarchie beschrijft.
function breadcrumbJsonLd(moduleName: string, slug: string) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Meer Vereniging", item: site.url },
    { "@type": "ListItem", position: 2, name: "Modules", item: `${site.url}/modules` },
    { "@type": "ListItem", position: 3, name: moduleName, item: `${site.url}/modules/${slug}` },
  ] };
}

// SEO Vindbaarheid 2.0: deze route had voorheen GEEN generateMetadata, dus
// alle 6 modulepagina's vielen terug op de generieke sitebrede titel/
// beschrijving uit app/layout.tsx (gevonden tijdens de technische audit).
// De titel krijgt hetzelfde "... voor verenigingen"-patroon als /platform
// en /modules zelf - geen nieuwe claim, alleen consistente, specifiekere
// context i.p.v. de kale modulenaam.
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const m=await localModules.getPublished((await params).slug);
  if(!m) return {};
  return {
    title:`${m.seoTitle??m.name} voor verenigingen`,
    description:m.seoDescription??m.shortDescription,
    alternates:{canonical:`/modules/${m.slug}`},
  };
}

export default async function ModuleDetail({params}:{params:Promise<{slug:string}>}){const m=await localModules.getPublished((await params).slug);if(!m)return notFound();return <PublicShell><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbJsonLd(m.name,m.slug))}} /><section className="hero"><div className="container"><p className="eyebrow">Onderdeel van het platform</p><h1>{m.name}</h1><p className="lede">{m.shortDescription} {m.longDescription}</p><Link href="/contact" className="btn btn-primary">Meer weten</Link></div></section><section className="section"><div className="container grid cards-3"><article className="card"><p className="eyebrow">Wat lost dit op?</p><h2>Meer overzicht in het dagelijkse werk.</h2><p className="muted">{m.name} helpt informatie bij elkaar te houden, zodat betrokkenen minder hoeven te zoeken of over te typen.</p></article><article className="card"><p className="eyebrow">Wat kun je ermee?</p><h2>Rustig en duidelijk werken.</h2><p className="muted">De huidige productscope richt zich op {m.features.join(', ').toLowerCase()}. We beschrijven alleen wat al onderdeel is van het platform.</p></article><article className="card"><p className="eyebrow">Voor wie?</p><h2>Voor mensen die samen organiseren.</h2><p className="muted">Handig voor bestuur, commissies, leden en vrijwilligers die vanuit hun rol informatie nodig hebben.</p></article></div></section><section className="section section-mist"><div className="container"><p className="eyebrow">Samenwerking met andere onderdelen</p><h2>Geen losse add-on.</h2><p className="lede">{m.name} is onderdeel van Meer Vereniging en sluit aan op de andere bestaande onderdelen, zoals agenda, ledenadministratie en communicatie. Welke inrichting past, bekijken we samen.</p><Link href="/platform" className="btn btn-secondary">Bekijk het platform</Link></div></section></PublicShell>}
