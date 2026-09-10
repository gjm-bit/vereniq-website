import { SiteLink as Link } from "@/src/components/site-link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/src/components/site-shell";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { getPublishedCmsPage } from "@/src/lib/public-cms";
import { localModules } from "@/src/repositories/local";
import { site } from "@/src/config/site";

// P0 MODULEPAGINA'S — ÉÉN BRON VAN WAARHEID (vervolg op SEO Vindbaarheid 2.0):
// deze route gebruikte tot nu toe uitsluitend localModules, waardoor
// gepubliceerde website_pages-content voor dezelfde 6 paden (/modules/*)
// nooit kon worden getoond - de code-route ving het pad altijd af vóór de
// generieke CMS-catch-all (app/[...slug]/page.tsx) werd bereikt. Dit
// bestand volgt nu exact hetzelfde CMS-first/fallback-patroon als
// app/platform/page.tsx en app/app/page.tsx (getPublishedCmsPage), zodat
// een redacteur deze pagina's straks net als elke andere Websitebeheer-
// pagina kan publiceren. localModules blijft de ENIGE bron voor welke
// slugs geldige modules zijn (dat bepaalt de 404, ongeacht CMS-status) en
// blijft de veilige fallback zolang een pagina niet (opnieuw) gepubliceerd
// is - geen enkele bestaande URL of gedrag verandert zolang er geen CMS-
// pagina gepubliceerd is (production-check: alle 6 staan vandaag op
// status "archived", dus dit verandert nu nog niets zichtbaars).

// SEO Vindbaarheid 2.0: BreadcrumbList JSON-LD (structured-data-plan §9) -
// geen zichtbare breadcrumb-UI (die bestaat nog nergens op de site, zie
// eindrapport), maar dit is valide, eerlijke schema-markup die exact de
// echte paginahiërarchie beschrijft. Geldt voor zowel de CMS- als de
// fallback-weergave - de URL/hiërarchie is in beide gevallen hetzelfde.
function breadcrumbJsonLd(moduleName: string, slug: string) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Meer Vereniging", item: site.url },
    { "@type": "ListItem", position: 2, name: "Modules", item: `${site.url}/modules` },
    { "@type": "ListItem", position: 3, name: moduleName, item: `${site.url}/modules/${slug}` },
  ] };
}

// Metadataprioriteit (P0 §4): 1) CMS-SEO-velden als de pagina gepubliceerd
// èn gevuld is, 2) anders de bestaande modulemetadata (ongewijzigd t.o.v.
// SEO Vindbaarheid 2.0), nooit een lege/generieke fallback terwijl een
// goede bestaat. Canonical wijst in beide gevallen naar dezelfde
// module-URL - nooit naar een CMS-interne of andere locatie.
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const slug = (await params).slug;
  const m = await localModules.getPublished(slug);
  if (!m) return {};

  const canonical = `/modules/${slug}`;
  const cmsPage = await getPublishedCmsPage(canonical);
  if (cmsPage) {
    return {
      title: cmsPage.seoTitle ?? cmsPage.title,
      description: cmsPage.seoDescription ?? m.seoDescription ?? m.shortDescription,
      alternates: { canonical },
      robots: cmsPage.noindex ? { index: false, follow: false } : undefined,
    };
  }

  return {
    title: `${m.seoTitle ?? m.name} voor verenigingen`,
    description: m.seoDescription ?? m.shortDescription,
    alternates: { canonical },
  };
}

export default async function ModuleDetail({params}:{params:Promise<{slug:string}>}){
  const slug = (await params).slug;
  // localModules blijft de enige bron voor "is dit een geldige module" -
  // onbekende slug is altijd 404, ongeacht of er toevallig een CMS-rij
  // met die slug bestaat.
  const m = await localModules.getPublished(slug);
  if (!m) return notFound();

  const breadcrumb = <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbJsonLd(m.name,slug))}} />;

  // getPublishedCmsPage geeft uitsluitend gepubliceerde content terug (de
  // publieke RPC website_public_page kent geen draft-concept) en faalt
  // nooit hard (netwerkfout/RPC-storing -> null, zelfde "faalt nooit
  // hard"-conventie als elke andere aanroeper van deze functie in de repo)
  // - dus zowel "geen CMS-pagina", "CMS-pagina is nog draft/archived" als
  // "CMS tijdelijk onbereikbaar" landen hier allemaal op dezelfde, veilige
  // localModules-fallback. Een gepubliceerde maar lege pagina (0 blocks)
  // telt bewust ook als "geen override" - nooit een lege pagina tonen als
  // er een werkende fallback bestaat.
  const cmsPage = await getPublishedCmsPage(`/modules/${slug}`);
  if (cmsPage && cmsPage.blocks.length > 0) {
    return <>{breadcrumb}<CmsPublicPageView page={cmsPage} /></>;
  }

  return <PublicShell>{breadcrumb}<section className="hero"><div className="container"><p className="eyebrow">Onderdeel van het platform</p><h1>{m.name}</h1><p className="lede">{m.shortDescription} {m.longDescription}</p><Link href="/contact" className="btn btn-primary">Meer weten</Link></div></section><section className="section"><div className="container grid cards-3"><article className="card"><p className="eyebrow">Wat lost dit op?</p><h2>Meer overzicht in het dagelijkse werk.</h2><p className="muted">{m.name} helpt informatie bij elkaar te houden, zodat betrokkenen minder hoeven te zoeken of over te typen.</p></article><article className="card"><p className="eyebrow">Wat kun je ermee?</p><h2>Rustig en duidelijk werken.</h2><p className="muted">De huidige productscope richt zich op {m.features.join(', ').toLowerCase()}. We beschrijven alleen wat al onderdeel is van het platform.</p></article><article className="card"><p className="eyebrow">Voor wie?</p><h2>Voor mensen die samen organiseren.</h2><p className="muted">Handig voor bestuur, commissies, leden en vrijwilligers die vanuit hun rol informatie nodig hebben.</p></article></div></section><section className="section section-mist"><div className="container"><p className="eyebrow">Samenwerking met andere onderdelen</p><h2>Geen losse add-on.</h2><p className="lede">{m.name} is onderdeel van Meer Vereniging en sluit aan op de andere bestaande onderdelen, zoals agenda, ledenadministratie en communicatie. Welke inrichting past, bekijken we samen.</p><Link href="/platform" className="btn btn-secondary">Bekijk het platform</Link></div></section></PublicShell>;
}
