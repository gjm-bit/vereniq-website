import { notFound } from "next/navigation";
import { SiteLink as Link } from "@/src/components/site-link";
import { PublicShell } from "@/src/components/site-shell";
import { localPages } from "@/src/repositories/local";
import { commercialFaq } from "@/src/config/pricing.mjs";
import { site } from "@/src/config/site";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { commercialCmsPathCandidates } from "@/src/lib/commercial-cms-paths.mjs";
import { getPublishedCmsPage } from "@/src/lib/public-cms";

type Content = { title: string; intro: string; sections: { heading: string; body: string }[] };

const legal: Record<string, Content> = {
  privacy: { title: "Privacy", intro: "Meer Vereniging wordt ontwikkeld met privacy by design en de toepasselijke AVG-verplichtingen als uitgangspunt.", sections: [{ heading: "Zorgvuldig met gegevens", body: "We verwerken alleen gegevens die nodig zijn voor het doel waarvoor ze worden gebruikt. Rollen en rechten helpen om informatie bij de juiste mensen te houden." }, { heading: "Juridische status", body: "De definitieve privacyverklaring wordt vóór commerciële ingebruikname juridisch gecontroleerd, versiegestuurd vastgesteld en hier gepubliceerd." }] },
  cookies: { title: "Cookies", intro: "We houden het gebruik van cookies beperkt en helder.", sections: [{ heading: "Wat we nu gebruiken", body: "De website gebruikt alleen noodzakelijke technische middelen om pagina’s veilig en bruikbaar te laten werken. We publiceren geen trackingtools als die niet actief zijn." }, { heading: "Als dit verandert", body: "Wanneer niet-noodzakelijke cookies of analytics worden ingezet, informeren we je vooraf en vragen we toestemming waar dat nodig is." }] },
  "algemene-voorwaarden": { title: "Algemene voorwaarden", intro: "De definitieve voorwaarden komen beschikbaar vóór commerciële ingebruikname van Meer Vereniging.", sections: [{ heading: "Nog onder juridische review", body: "We tonen geen verzonnen juridische overeenkomst. De voorwaarden worden zorgvuldig vastgesteld en daarna centraal gepubliceerd." }, { heading: "Vragen", body: "Wil je vooraf iets weten over de beoogde samenwerking? Neem gerust contact met ons op." }] },
  beveiliging: { title: "Beveiliging", intro: "Je ledengegevens zijn geen bijzaak. Daarom bouwen we beveiliging en privacy mee in de basis.", sections: [{ heading: "Privacy by design", body: "Dataminimalisatie, rollen en rechten, tenantisolatie en server-side autorisatie zijn uitgangspunten voor de inrichting." }, { heading: "Praktisch en controleerbaar", body: "We werken met least privilege, inputvalidatie, logging van beheeracties en veilige ontwikkelprincipes. We gebruiken relevante principes uit ISO 27001 waar die praktisch bijdragen aan informatiebeveiliging; Meer Vereniging is niet ISO 27001-gecertificeerd." }, { heading: "Meer weten", body: "Lees ook onze privacy- en data-opslagpagina’s. Voor commerciële productie leggen we verwerkers en operationele afspraken transparant vast." }] },
  "data-opslag": { title: "Data-opslag", intro: "Opslaglocatie, verwerkers en subverwerkers worden vóór commerciële productie transparant vastgelegd.", sections: [{ heading: "Zorgvuldige keuze", body: "We doen geen harde provider- of regioclaims zolang de productie-inrichting niet definitief is. Bij de keuze wegen we privacy, beveiliging en toepasselijke verplichtingen mee." }, { heading: "Transparantie vooraf", body: "De definitieve infrastructuur, relevante verwerkers en afspraken over opslag en herstel worden vóór commerciële ingebruikname vastgelegd." }] },
  verwerkers: { title: "Verwerkers", intro: "Een definitief overzicht van verwerkers en subverwerkers volgt vóór commerciële productie.", sections: [{ heading: "Geen lijst om te gokken", body: "We publiceren alleen een overzicht wanneer doeleinden, locaties en afspraken zijn vastgesteld. Zo blijft deze informatie controleerbaar en bruikbaar." }] },
};

const pageMeta: Record<string, [string, string]> = {
  prijzen: ["Onze prijsstelling komt binnenkort.", "We houden het graag eenvoudig en transparant. De definitieve prijsstelling van Meer Vereniging wordt momenteel afgerond en verschijnt binnenkort op deze pagina."],
  contact: ["Laten we kennismaken.", "Vertel kort waar je vereniging tijd verliest. Dan kijken we praktisch mee."],
  demo: ["Vraag een demo aan", "Vertel ons kort over je vereniging. We reageren binnen 1 werkdag met een voorstel voor een persoonlijke demo, afgestemd op jullie situatie — geen verplichtingen."],
  "over-ons": ["Gebouwd vanuit een vereniging. Niet vanuit een vergaderkamer.", "Meer Vereniging komt voort uit de dagelijkse praktijk: een bestuur dat overzicht zoekt en vrijwilligers die tijd willen houden voor hun vereniging."],
};

const memberCountOptions = ["Minder dan 50", "50 – 150", "150 – 300", "300 – 750", "Meer dan 750"];
const roleOptions = ["Voorzitter", "Secretaris", "Penningmeester", "Bestuurslid", "Vrijwilliger / commissielid", "Anders"];
const interestOptions = ["Ledenadministratie", "Agenda en communicatie", "Financiën en contributie", "Vrijwilligers en teams", "Website en aanmeldingen", "Alles-in-één overzicht"];

async function getCmsPage(segments: readonly string[]) {
  for (const path of commercialCmsPathCandidates(segments)) {
    const page = await getPublishedCmsPage(path);
    if (page) return page;
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const segments = (await params).slug;
  const cmsPage = await getCmsPage(segments);
  if (cmsPage) return { title: cmsPage.seoTitle ?? cmsPage.title, description: cmsPage.seoDescription ?? undefined, robots: cmsPage.noindex ? { index: false, follow: false } : undefined };
  if (segments.length !== 1) return { title: "Pagina niet gevonden | Meer Vereniging" };
  const slug = segments[0];
  const content = legal[slug];
  const meta = pageMeta[slug];
  return { title: content?.title ?? meta?.[0] ?? "Meer Vereniging", description: content?.intro ?? meta?.[1] };
}

function Form({ demo }: { demo: boolean }) { return <section className="section"><div className="container">
  {demo ? <p className="lede form-lede">Vul het formulier in en we nemen binnen 1 werkdag contact op om een persoonlijke demo in te plannen — telefonisch of via een videogesprek, wat jou het beste uitkomt.</p> : null}
  <form className="form" action={`mailto:${site.email}`} method="post" encType="text/plain">
    <label className="field">Naam<input required name="name" /></label>
    <label className="field">Vereniging<input required name="organization" /></label>
    {demo && <label className="field">Type vereniging<select required name="associationType" defaultValue=""><option value="" disabled>Kies een type</option><option>Muziekvereniging</option><option>Sportvereniging</option><option>Carnavalsvereniging</option><option>Stichting</option><option>Andere vereniging</option></select></label>}
    {demo && <label className="field">Jouw rol binnen de vereniging<select required name="role" defaultValue=""><option value="" disabled>Kies een rol</option>{roleOptions.map((option) => <option key={option}>{option}</option>)}</select></label>}
    <label className="field">E-mail<input required type="email" name="email" /></label>
    {demo && <label className="field">Telefoon (optioneel)<input type="tel" name="phone" /></label>}
    {demo && <label className="field">Indicatie aantal leden<select required name="memberCount" defaultValue=""><option value="" disabled>Kies een grootte</option>{memberCountOptions.map((option) => <option key={option}>{option}</option>)}</select></label>}
    {demo && <fieldset className="field field-checkboxes"><legend>Waar wil je Meer Vereniging vooral voor gebruiken?</legend>{interestOptions.map((option) => <label key={option} className="checkbox-option"><input type="checkbox" name="interest" value={option} />{option}</label>)}</fieldset>}
    <label className="field">{demo ? "Vrije toelichting (optioneel)" : "Waar kunnen we mee helpen?"}<textarea {...(demo ? {} : { required: true })} name="message" /></label>
    <p>Direct contact? <a href={`mailto:${site.email}`}>{site.email}</a></p>
    <p className="muted">Je gegevens worden alleen gebruikt om contact met je op te nemen over je aanvraag. Lees onze <Link href="/privacy">privacyinformatie</Link>.</p>
    <button className="btn btn-primary">{demo ? "Demo aanvragen" : "Verstuur bericht"}</button>
  </form>
</div></section>; }
function Pricing() { return <><section className="section"><div className="container"><p className="eyebrow">Prijsstelling</p><h2>Onze prijsstelling komt binnenkort.</h2><p className="lede">We houden het graag eenvoudig en transparant. De definitieve prijsstelling van Meer Vereniging wordt momenteel afgerond en verschijnt binnenkort op deze pagina.</p><Link className="btn btn-primary" href="/contact">Neem contact op</Link></div></section><section className="section section-mist"><div className="container"><p className="eyebrow">Veelgestelde vragen</p><h2>Helder voordat je begint.</h2><div className="faq">{commercialFaq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div></section></>; }
function About() { return <><section className="section"><div className="container home-practice"><div><p className="eyebrow">Achter Meer Vereniging</p><h2>Gebouwd vanuit een vereniging. Niet vanuit een vergaderkamer.</h2></div><div className="practice-list"><article className="practice-item"><span>01</span><div><h3>Techniek en product</h3><p>Gert-Jan vertaalt herkenbare verenigingsvragen naar een rustige, bruikbare digitale basis. Van gegevens en rechten tot de dagelijkse flows die het werk lichter maken.</p></div></article><article className="practice-item"><span>02</span><div><h3>Praktijk en verbinding</h3><p>Alain houdt contact met verenigingen en brengt vragen uit het verenigingsleven terug naar wat echt helpt — niet naar nog een lijst met features.</p></div></article><article className="practice-item"><span>03</span><div><h3>Midden in het ritme</h3><p>We kennen verenigingen niet alleen als leverancier. We zitten er zelf middenin en bouwen stap voor stap aan iets dat in een druk seizoen ook prettig blijft.</p><Link className="btn-quiet" href="/contact">Neem contact op</Link></div></article></div></div></section></>; }
function LegalPage({ content }: { content: Content }) { return <section className="section"><div className="container" style={{ maxWidth: 900 }}>{content.sections.map((section) => <section key={section.heading} style={{ marginBottom: 36 }}><h2 style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)" }}>{section.heading}</h2><p className="lede">{section.body}</p></section>)}<Link className="btn btn-secondary" href="/contact">Neem contact op</Link></div></section>; }

export default async function CommercialPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const segments = (await params).slug;
  const cmsPage = await getCmsPage(segments);
  if (cmsPage) return <CmsPublicPageView page={cmsPage} />;

  // Nested commercial routes never fall through to legacy templates. They
  // either resolve an immutable CMS snapshot or correctly return a 404.
  if (segments.length !== 1) notFound();

  const slug = segments[0];
  const published = await localPages.getPublished(slug);
  if (!published) notFound();

  const legalContent = legal[slug];
  const meta = pageMeta[slug];
  if (!legalContent && !meta) notFound();

  const [title, intro] = legalContent ? [legalContent.title, legalContent.intro] : meta;
  return <PublicShell><section className={(slug === "prijzen" || slug === "over-ons" || legalContent) ? "hero" : "section section-mist"}><div className="container"><p className="eyebrow">Meer Vereniging</p><h1>{title}</h1><p className="lede">{intro}</p></div></section>{slug === "prijzen" ? <Pricing /> : slug === "over-ons" ? <About /> : slug === "contact" ? <Form demo={false} /> : slug === "demo" ? <Form demo /> : legalContent ? <LegalPage content={legalContent} /> : null}</PublicShell>;
}
