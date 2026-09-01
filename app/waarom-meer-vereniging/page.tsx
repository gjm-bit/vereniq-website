import type { Metadata } from "next";
import { SiteLink as Link } from "@/src/components/site-link";
import { PublicShell } from "@/src/components/site-shell";

export const metadata: Metadata = {
  title: "Waarom Meer Vereniging?",
  description:
    "Gebouwd voor verenigingen, met de zorgvuldigheid van professionele bedrijfssoftware. Ontdek hoe Meer Vereniging omgaat met veiligheid, privacy en releasekwaliteit.",
};

// Bewust géén iconen/afbeeldingen per pijler - genummerde badges, zelfde
// vormtaal als .module-index/.step (zie app/globals.css). Elke tekst hier is
// afgestemd op docs/website-claims-waarom-meer-vereniging.md - geen ISO- of
// AVG-compliance-claim, geen ongeverifieerde cijfers.
const USPS: ReadonlyArray<{ number: string; title: string; body: string }> = [
  {
    number: "01",
    title: "Eenvoudig voor iedereen",
    body: "Geen IT-kennis nodig. Duidelijke taal, overzichtelijke schermen. Software moet de vereniging helpen — niet andersom.",
  },
  {
    number: "02",
    title: "Veilig vanaf het ontwerp",
    body: "Beveiliging en privacy worden niet achteraf toegevoegd. Bij ontwerp en ontwikkeling houden we rekening met gegevensscheiding, toegang, veilige verbindingen en controleerbare wijzigingen.",
  },
  {
    number: "03",
    title: "Gecontroleerd ontwikkeld",
    body: "Nieuwe functionaliteit gaat niet zomaar online. Wijzigingen worden getest voordat ze worden uitgebracht. Belangrijke releases krijgen aanvullende controles — en als zo'n controle een probleem vindt, wordt de release gestopt.",
  },
  {
    number: "04",
    title: "Professioneel georganiseerd",
    body: "We bouwen met principes die passen bij professioneel informatiebeheer: risico's beheersen, toegang beperken, wijzigingen kunnen herleiden, gecontroleerd releasen, en blijven controleren en verbeteren.",
  },
  {
    number: "05",
    title: "Privacy als uitgangspunt",
    body: "Verenigingen verwerken persoonsgegevens. Daarom behandelen we privacy niet als een vinkje achteraf, maar als onderdeel van ontwerp en beheer.",
  },
  {
    number: "06",
    title: "Eén platform dat kan meegroeien",
    body: "De basis blijft eenvoudig. Functionaliteit kan meegroeien met wat een vereniging nodig heeft — zonder onnodige functies op te dringen.",
  },
];

const ISO_PRINCIPLES: readonly string[] = [
  "Risico's herkennen en beheersen",
  "Wijzigingen controleren voordat ze doorgevoerd worden",
  "Toegang beperken tot wie het nodig heeft",
  "Belangrijke acties herleidbaar maken",
  "Beveiliging meenemen in het ontwerp, niet achteraf",
  "Releases gecontroleerd uitvoeren",
  "Leren van gevonden problemen",
  "Structureel verbeteren",
];

const RELEASE_STEPS: ReadonlyArray<{ title: string; body: string }> = [
  { title: "Bouwen", body: "Een wijziging wordt gemaakt en samengevoegd met de rest van het platform." },
  { title: "Automatisch controleren", body: "Vaste, geautomatiseerde controles draaien mee: klopt de code, en werkt hij zoals bedoeld." },
  { title: "Uitgebreid testen", body: "Belangrijke releases krijgen aanvullende controles op onder andere de werking van de software, databasewijzigingen en belangrijke gebruikersstromen." },
  { title: "Pas daarna vrijgeven", body: "Alleen als alle controles slagen, gaat een wijziging live. Vindt een controle een probleem, dan stoppen we de release en lossen we het eerst op." },
];

type FaqItem = { question: string; answer: string };
type FaqGroup = { heading: string; items: readonly FaqItem[] };

const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    heading: "Algemeen",
    items: [
      {
        question: "Wat is Meer Vereniging?",
        answer:
          "Meer Vereniging is software voor verenigingen: leden, agenda, communicatie en beheer op één overzichtelijke plek, zodat vrijwilligers en bestuurders minder tijd kwijt zijn aan regelen en meer tijd overhouden voor de vereniging zelf.",
      },
      {
        question: "Voor wie is Meer Vereniging bedoeld?",
        answer:
          "Voor verenigingen van elke soort: muziek-, sport- en carnavalsverenigingen, stichtingen en andere verenigingen. De basis is voor iedereen hetzelfde; onderdelen kunnen verschillen per type vereniging.",
      },
      {
        question: "Welke onderdelen (modules) zijn er?",
        answer:
          "De basis is bewust eenvoudig. Daaromheen zijn losse onderdelen beschikbaar die je alleen gebruikt als je vereniging ze nodig heeft. Een actueel overzicht staat op de modulepagina.",
      },
      {
        question: "Wat kost Meer Vereniging?",
        answer:
          "De actuele prijzen en wat daarbij hoort staan op onze prijzenpagina. Nieuwe verenigingen kunnen gratis starten met een proefabonnement, zonder creditcard.",
      },
      {
        question: "Moet ik iets installeren?",
        answer:
          "Nee. Meer Vereniging werkt volledig in de browser. Er is geen aparte installatie nodig om te beginnen.",
      },
      {
        question: "Op welke apparaten werkt Meer Vereniging?",
        answer:
          "Meer Vereniging werkt in de browser op laptop, tablet en telefoon. Je hoeft geen app te installeren om aan de slag te gaan.",
      },
    ],
  },
  {
    heading: "Veiligheid & privacy",
    items: [
      {
        question: "Hoe gaat Meer Vereniging om met persoonsgegevens van leden?",
        answer:
          "Verenigingen verwerken al snel persoonsgegevens: namen, adressen, soms geboortedata of foto's. Meer Vereniging is daarom zo gebouwd dat gegevens van de ene vereniging gescheiden blijven van die van een andere, dat toegang is gekoppeld aan rollen, en dat verbindingen versleuteld zijn (HTTPS).",
      },
      {
        question: "Is Meer Vereniging AVG-proof?",
        answer:
          "De AVG (Algemene Verordening Gegevensbescherming) verplicht organisaties om zorgvuldig met persoonsgegevens om te gaan: alleen verzamelen wat nodig is, gegevens beveiligen, en betrokkenen inzage- en verwijderrechten geven. Als vereniging blijf je zelf verantwoordelijk voor hoe je persoonsgegevens van je leden verwerkt (de zogeheten verwerkingsverantwoordelijke); Meer Vereniging ondersteunt dat met een architectuur die uitgaat van gegevensscheiding en beperkte toegang. We noemen onszelf hier bewust geen 'AVG-compliant' — dat is geen eenmalig vinkje, maar iets waar we doorlopend aan werken.",
      },
      {
        question: "Is Meer Vereniging ISO 27001-gecertificeerd?",
        answer:
          "Nee, op dit moment niet. We gebruiken bij ontwikkeling en beheer wel principes die daarbij passen — hierboven op deze pagina leggen we precies uit welke, en waarom we daar niet mee wachten tot een certificaat.",
      },
      {
        question: "Wie kan er bij onze verenigingsgegevens?",
        answer:
          "In de eerste plaats de mensen binnen je eigen vereniging aan wie jullie zelf rollen en rechten toekennen. Platformbeheerders van Meer Vereniging kunnen, wanneer dat nodig is voor beheer of ondersteuning, ook toegang hebben — dat gebeurt via een aparte, gecontroleerde weg en wordt vastgelegd.",
      },
      {
        question: "Wie bepaalt wie welke rechten heeft binnen onze vereniging?",
        answer:
          "Dat bepaalt het bestuur of de beheerder van jullie eigen vereniging. Jullie kennen zelf rollen toe — bijvoorbeeld voor bestuur, ledenadministratie of een specifieke commissie — en daarmee ook de bijbehorende rechten.",
      },
      {
        question: "Wat gebeurt er als er een beveiligingsprobleem wordt gevonden?",
        answer:
          "Onderzoekers die een kwetsbaarheid vinden, kunnen ons direct bereiken via het gepubliceerde security.txt-bestand. Bij een datalek dat persoonsgegevens raakt, gelden de wettelijke meldplichten uit de AVG.",
      },
    ],
  },
  {
    heading: "Overstappen & gegevens",
    items: [
      {
        question: "Hoe stap ik over vanuit onze huidige ledenadministratie?",
        answer:
          "We denken graag met je mee over de overstap vanuit je huidige systeem of spreadsheet. Neem contact met ons op via info@meervereniging.nl om te bespreken wat voor jullie vereniging de beste aanpak is.",
      },
      {
        question: "Blijven onze gegevens van onze vereniging?",
        answer:
          "Ja. De gegevens die jullie invoeren, blijven van jullie vereniging. Meer Vereniging is het systeem waarin jullie ze beheren.",
      },
      {
        question: "Kunnen we onze gegevens meenemen als we stoppen?",
        answer:
          "Neem in dat geval contact met ons op, dan bespreken we samen de mogelijkheden voor jullie situatie.",
      },
      {
        question: "Wat gebeurt er met onze gegevens als we opzeggen?",
        answer:
          "Ook dat bespreken we graag persoonlijk bij een opzegging, zodat het past bij wat jullie vereniging nodig heeft. Neem contact op via info@meervereniging.nl.",
      },
      {
        question: "Hoe zeg ik op?",
        answer: "Neem contact met ons op via info@meervereniging.nl — we helpen je verder.",
      },
    ],
  },
  {
    heading: "Gebruik",
    items: [
      {
        question: "Is er veel uitleg nodig om te starten?",
        answer:
          "Nee. Meer Vereniging is gebouwd voor mensen zonder IT-achtergrond: duidelijke taal en overzichtelijke schermen, zodat je snel aan de slag kunt.",
      },
      {
        question: "Kan ik zelf bepalen wie wat mag zien of doen?",
        answer:
          "Ja, via rollen en rechten die jullie zelf instellen binnen de vereniging — bijvoorbeeld voor bestuur, ledenadministratie of een commissie.",
      },
      {
        question: "Groeit Meer Vereniging mee als onze vereniging verandert?",
        answer:
          "Ja. De basis blijft eenvoudig, en er zijn losse onderdelen die je kunt toevoegen zodra jullie ze nodig hebben — zonder dat je vanaf het begin met alles wordt geconfronteerd.",
      },
      {
        question: "Is er ondersteuning als ik vastloop?",
        answer: "Ja, neem contact op via info@meervereniging.nl.",
      },
    ],
  },
  {
    heading: "Techniek & betrouwbaarheid",
    items: [
      {
        question: "Waar draait Meer Vereniging op?",
        answer:
          "We kiezen bewust voor professionele, gespecialiseerde infrastructuur in plaats van dit zelf te beheren. De verbinding met je website en de app is beveiligd met HTTPS.",
      },
      {
        question: "Hoe vaak brengen jullie updates uit, en merk ik daar iets van?",
        answer:
          "Updates doorlopen ons vaste releaseproces (hierboven op deze pagina uitgelegd) voordat ze live gaan. Meestal merk je daar niets van, behalve dat er af en toe iets verbeterd is.",
      },
      {
        question: "Is Meer Vereniging altijd beschikbaar?",
        answer:
          "We doen ons best om de dienst zo betrouwbaar mogelijk te laten draaien op professionele infrastructuur. We geven hier bewust geen harde beschikbaarheidsgarantie, om geen verwachting te wekken die we niet kunnen waarmaken.",
      },
      {
        question: "Gebruikt Meer Vereniging AI, en wat gebeurt er dan met onze gegevens?",
        answer:
          "We zijn hier terughoudend in: persoonsgegevens van leden worden niet zomaar aan externe AI-diensten blootgesteld voor de kernfunctionaliteit van het platform. Heb je hier een specifieke vraag over, neem dan gerust contact op.",
      },
      {
        question: "Wat is Internet.nl en waarom noemen jullie het?",
        answer:
          "Internet.nl is een onafhankelijke test die controleert of een website moderne internetstandaarden gebruikt, zoals IPv6, DNSSEC, HTTPS en routebeveiliging. We nemen dit serieus als aantoonbare, controleerbare maatstaf — hierboven op deze pagina lichten we onze huidige stand van zaken toe.",
      },
    ],
  },
];

export default function WaaromMeerVerenigingPage() {
  return (
    <PublicShell>
      <section className="hero">
        <div className="container hero-layout">
          <div>
            <p className="eyebrow">Waarom Meer Vereniging?</p>
            <h1>
              Gebouwd voor verenigingen.
              <br />
              Met zorg voor wat belangrijk is.
            </h1>
            <p className="lede">
              Een vereniging draait vaak op vrijwilligers. Maar persoonsgegevens, communicatie en belangrijke
              verenigingsinformatie verdienen professionele zorg.
            </p>
            <p className="lede">
              Meer Vereniging combineert daarom eenvoud aan de voorkant met zorgvuldigheid achter de schermen.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/proefabonnement">
                Probeer gratis
              </Link>
              <Link className="btn btn-secondary" href="#hoe-we-werken">
                Bekijk hoe we werken
              </Link>
            </div>
          </div>
          <p className="home-hero-aside">
            Niet alleen eenvoudig.
            <br />
            Ook zorgvuldig.
            <br />
            <strong>Gebouwd voor verenigingen. Met de zorgvuldigheid van professionele bedrijfssoftware.</strong>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Waarom deze aanpak</p>
          <h2>Zes uitgangspunten waar we niet op inleveren.</h2>
          <div className="grid cards-3" style={{ marginTop: 32 }}>
            {USPS.map((usp) => (
              <article className="card" key={usp.number}>
                <span className="module-index">{usp.number}</span>
                <h3>{usp.title}</h3>
                <p className="muted">{usp.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">ISO/IEC 27001</p>
          <h2>Bouwen met ISO-principes.</h2>
          <p className="lede">
            ISO/IEC 27001 is een internationale norm voor het systematisch beheren van informatiebeveiliging.
            Meer Vereniging gebruikt bij ontwikkeling en beheer principes die daarbij passen:
          </p>
          <div className="problem-list" style={{ marginTop: 24 }}>
            {ISO_PRINCIPLES.map((principle) => (
              <article key={principle}>
                <p>{principle}</p>
              </article>
            ))}
          </div>
          <div className="notice" style={{ marginTop: 32, maxWidth: 720 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Meer Vereniging is op dit moment niet ISO/IEC 27001-gecertificeerd.
            </p>
          </div>
          <div style={{ marginTop: 28, maxWidth: 720 }}>
            <h3>Waarom doen we het dan toch zo?</h3>
            <p className="muted">
              Omdat goede informatiebeveiliging niet pas moet beginnen wanneer een certificaat wordt aangevraagd.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Aantoonbare veiligheid</p>
          <h2>Veiligheid moet je niet alleen beloven.</h2>
          <p className="lede">
            Waar mogelijk kiezen we voor maatregelen die je zelf kunt controleren, in plaats van uitsluitend een
            belofte. Internet.nl is daar een voorbeeld van: een onafhankelijke test die controleert of een website
            moderne internetstandaarden gebruikt, onder andere rond:
          </p>
          <div className="grid cards-3" style={{ marginTop: 24 }}>
            <article className="card">
              <h3>IPv6 &amp; DNSSEC</h3>
              <p className="muted">Een modern, betrouwbaar bereikbaar internetadres en een ondertekende domeinnaam.</p>
            </article>
            <article className="card">
              <h3>HTTPS &amp; beveiligingsinstellingen</h3>
              <p className="muted">Een goed beveiligde verbinding en aanbevolen beveiligingsinstellingen voor de website.</p>
            </article>
            <article className="card">
              <h3>Routebeveiliging</h3>
              <p className="muted">Bescherming tegen onbedoelde of kwaadwillige routeringsfouten op het internet.</p>
            </article>
          </div>
          <div className="card" style={{ marginTop: 28, maxWidth: 420 }}>
            <span className="badge">Internet.nl — doel: 100%</span>
            <p className="muted" style={{ marginTop: 14 }}>
              We meten onszelf hier bewust aan een score die je zelf kunt naslaan. Zodra we die score behalen, laten
              we dat hier zien — niet eerder.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="hoe-we-werken">
        <div className="container">
          <p className="eyebrow">Hoe we releasen</p>
          <h2>Een update moet eerst bewijzen dat hij werkt.</h2>
          <div className="steps" style={{ marginTop: 24 }}>
            {RELEASE_STEPS.map((step) => (
              <div className="step" key={step.title}>
                <h3>{step.title}</h3>
                <p className="muted">{step.body}</p>
              </div>
            ))}
          </div>
          <p className="lede" style={{ marginTop: 32 }}>
            Wanneer een controle een probleem vindt, stoppen we de release en lossen we het probleem eerst op.
            Zo gaat er nooit een wijziging live die niet eerst heeft bewezen dat hij werkt.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Veelgestelde vragen</p>
          <h2>Nog vragen?</h2>
          {FAQ_GROUPS.map((group) => (
            <div key={group.heading} style={{ marginTop: 40 }}>
              <h3>{group.heading}</h3>
              <div className="faq">
                {group.items.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <p className="eyebrow">Klaar om te starten?</p>
              <h2 style={{ marginBottom: 0 }}>Probeer Meer Vereniging 90 dagen gratis.</h2>
            </div>
            <Link className="btn btn-primary" href="/proefabonnement">
              Probeer gratis
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
