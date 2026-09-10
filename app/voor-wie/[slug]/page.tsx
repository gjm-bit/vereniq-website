import { SiteLink as Link } from "@/src/components/site-link"; import { PublicShell } from "@/src/components/site-shell"; import { notFound } from "next/navigation"; import { site } from "@/src/config/site";

// SEO Vindbaarheid 2.0: BreadcrumbList JSON-LD, zelfde patroon/motivatie als
// app/modules/[slug]/page.tsx.
function breadcrumbJsonLd(title: string, slug: string) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Meer Vereniging", item: site.url },
    { "@type": "ListItem", position: 2, name: "Voor wie", item: `${site.url}/voor-wie` },
    { "@type": "ListItem", position: 3, name: title, item: `${site.url}/voor-wie/${slug}` },
  ] };
}

// SEO Vindbaarheid 2.0 (voorstel, nog niet live/goedgekeurd - zie eindrapport):
// 1) TECHNISCHE FIX (ongewijzigd feitelijk correct, geen contentkeuze): een
//    onbekende slug toonde voorheen stilzwijgend generieke inhoud met status
//    200 in plaats van een 404 - dat is een crawl-trap (oneindig veel
//    "geldige" URL's met dezelfde dunne inhoud). Nu: 404 voor onbekende
//    doelgroepen, zoals elke andere pagina op de site al doet.
// 2) CONTENT (wél een inhoudelijke keuze - voorstel, niet zelfstandig
//    gepubliceerd): elke doelgroep had vrijwel identieke "processes"/
//    "modules"-tekst (alleen het label wisselde) - precies het
//    sjabloonpatroon dat vermeden moest worden. Herschreven met herkenbare,
//    per doelgroep verschillende situaties, gebaseerd op de bestaande,
//    echte modules (geen verzonnen functionaliteit). Senioren/buurt/hobby/
//    cultureel zijn bewust samengevoegd tot één nieuwe pagina
//    (kleine-verenigingen) i.p.v. vier dunne, onderling nauwelijks
//    verschillende pagina's.
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const slug=(await params).slug;if(!(slug in audiences))return{};return {title:`Verenigingssoftware voor ${audiences[slug].title}`,description:audiences[slug].intro,alternates:{canonical:`/voor-wie/${slug}`}}}

type Audience = { title: string; intro: string; processes: readonly string[]; modules: readonly string[] };

const audiences: Record<string, Audience> = {
  "muziekverenigingen": {
    title: "muziekverenigingen",
    intro: "Een repetitieschema dat verandert, een optreden dat dichterbij komt, secties die ieder hun eigen informatie nodig hebben: bij een muziekvereniging loopt veel tegelijk.",
    processes: [
      "Repetities en optredens plannen, zodat dirigent, bestuur en leden dezelfde agenda zien",
      "Weten wie er bij een repetitie of optreden aanwezig is - zonder losse appjes na te bellen",
      "Secties, commissies en vrijwilligers gericht informeren in plaats van iedereen alles sturen",
    ],
    modules: ["Agenda", "Ledenadministratie", "Communicatie", "Fortissimo"],
  },
  "sportverenigingen": {
    title: "sportverenigingen",
    intro: "Trainingen, wedstrijden, kantinediensten en een ledenbestand dat ieder seizoen verandert - een sportvereniging draait op mensen die weten wat er van hen verwacht wordt.",
    processes: [
      "Trainingen en wedstrijden delen, inclusief wie er speelt en wie er nog moet reageren",
      "Vrijwilligers en kantinediensten inplannen zonder een apart schema bij te houden",
      "Ledencontact per team of leeftijdsgroep, in plaats van één mail aan de hele club",
    ],
    modules: ["Agenda", "Ledenadministratie", "Communicatie"],
  },
  "carnavalsverenigingen": {
    title: "carnavalsverenigingen",
    intro: "Een paar weken per jaar gebeurt alles tegelijk: commissies, activiteiten en afspraken die snel moeten landen bij de juiste mensen.",
    processes: [
      "Commissies en bestuur op één lijn houden in de aanloop naar het seizoen",
      "Activiteiten en afspraken coördineren zonder dat iets tussen wal en schip valt",
      "Sponsoren, locaties en andere relaties overzichtelijk bijhouden",
    ],
    modules: ["Communicatie", "Agenda", "CRM"],
  },
  "stichtingen": {
    title: "stichtingen",
    intro: "Een klein bestuur, vaak met wisselende bezetting, heeft vooral baat bij overzicht dat blijft bestaan als er iemand vertrekt.",
    processes: [
      "Bestuursinformatie op één centrale plek houden - niet verspreid over losse mailboxen",
      "Vrijwilligers en betrokkenen informeren zonder daar telkens opnieuw tijd in te steken",
      "Activiteiten voorbereiden en afspraken terugvindbaar houden",
    ],
    modules: ["Agenda", "Communicatie", "CRM"],
  },
  "kleine-verenigingen": {
    title: "kleine en informele verenigingen",
    intro: "Senioren-, buurt-, hobby- en culturele verenigingen delen vaak hetzelfde: een klein bestuur, leden die niet allemaal even digitaal-vaardig zijn, en behoefte aan iets dat direct te snappen is.",
    processes: [
      "Je snel af- en aanmelden voor een activiteit, ook als je niet dagelijks een app gebruikt",
      "Op tijd weten dat een activiteit vervalt of verplaatst - één duidelijk bericht in plaats van rondbellen",
      "Een bediening die geen uitleg vooraf nodig heeft",
    ],
    modules: ["Agenda", "Communicatie", "Ledenadministratie"],
  },
  "andere-verenigingen": {
    title: "andere verenigingen",
    intro: "Niet elke vereniging past in een vaste categorie. Eén overzichtelijke basis voor leden, activiteiten en vrijwilligers helpt vrijwel overal.",
    processes: [
      "Informatie op één centrale plek houden, ook als de vereniging groeit of verandert",
      "Taken en afspraken duidelijk verdelen tussen bestuur en vrijwilligers",
      "Leden betrokken houden zonder daar veel extra tijd in te steken",
    ],
    modules: ["Agenda", "Ledenadministratie", "Communicatie"],
  },
};

export default async function Audience({params}:{params:Promise<{slug:string}>}){
  const slug = (await params).slug;
  const a = audiences[slug];
  if (!a) notFound();
  return <PublicShell><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbJsonLd(a.title,slug))}} /><section className="hero"><div className="container"><p className="eyebrow">Voor wie</p><h1>Voor {a.title}.</h1><p className="lede">{a.intro}</p></div></section><section className="section"><div className="container grid cards-3"><div><p className="eyebrow">Herkenbare processen</p><h2>Wat er dagelijks speelt.</h2></div>{a.processes.map(x=><article className="card" key={x}><h3>{x}</h3></article>)}</div></section><section className="section section-mist"><div className="container"><p className="eyebrow">Passende onderdelen</p><h2>Ondersteuning voor jullie dagelijkse werk.</h2><div className="module-list">{a.modules.map((m,i)=><div className="module-row" key={m}><span className="module-index">0{i+1}</span><h3>{m}</h3><Link className="btn-quiet" href="/modules">Bekijk alle onderdelen</Link></div>)}</div></div></section></PublicShell>;
}
