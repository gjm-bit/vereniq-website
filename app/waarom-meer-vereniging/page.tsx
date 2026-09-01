import type { ReactElement } from "react";
import { SiteLink as Link } from "@/src/components/site-link";
import { PublicShell } from "@/src/components/site-shell";
import { WaaromFaq, type FaqGroup } from "@/src/components/waarom-faq";
import { pageMetadata } from "@/src/lib/seo";

export const metadata = pageMetadata({
  title: "Waarom Meer Vereniging?",
  description:
    "Gebouwd voor verenigingen, met de zorgvuldigheid van professionele bedrijfssoftware. Ontdek hoe Meer Vereniging omgaat met veiligheid, privacy en releasekwaliteit.",
  path: "/waarom-meer-vereniging",
});

/**
 * Simpele, consistente lijn-iconen (2px stroke, currentColor) in dezelfde
 * stijl als de bestaande iconen op public/brand/meer-vereniging-hier-komt.png
 * (schild, wolk, mensen, ster). Geen productscreenshots beschikbaar in de
 * bestaande assets (zie het onderzoek in de PR-body) - dit zijn bewust
 * decoratieve, uitleggende iconen, geen verzonnen productinterface.
 */
function IconChecklist() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12l2 2 4-4M9 17h4" /></svg>;
}
function IconShield() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9.5 12l1.8 1.8L15 10" /></svg>;
}
function IconCheckCircle() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.2 2.2L16 9.5" /></svg>;
}
function IconLayers() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4-8 4-8-4 8-4z" /><path d="M4 12l8 4 8-4M4 16l8 4 8-4" /></svg>;
}
function IconEyeOff() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /><path d="M4 4l16 16" /></svg>;
}
function IconGrowth() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17l5-5 4 4 7-8" /><path d="M15 8h5v5" /></svg>;
}
function IconHammer() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 6l4 4-3 3-4-4z" /><path d="M12.5 9.5L4 18l2 2 8.5-8.5" /></svg>;
}
function IconMagnifier() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4.5-4.5" /></svg>;
}
function IconFlask() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /><path d="M7.5 15h9" /></svg>;
}
function IconRocket() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3c3 1 5 4 5 8 0 3-2 6-2 6H9s-2-3-2-6c0-4 2-7 5-8z" /><path d="M9 15l-3 3M15 15l3 3M10 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" /></svg>;
}
function IconGlobe() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z" /></svg>;
}
function IconLock() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
}
function IconRoute() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 7.2C10 10 13 12 15.8 13.8" strokeDasharray="3 3" /></svg>;
}

const USPS: ReadonlyArray<{ icon: () => ReactElement; title: string; body: string }> = [
  {
    icon: IconChecklist,
    title: "Eenvoudig voor iedereen",
    body: "Je hoeft geen verstand van computers te hebben om met Meer Vereniging te werken. Alles staat in gewone taal, in duidelijke schermen. De software moet jou helpen, niet andersom.",
  },
  {
    icon: IconShield,
    title: "Veilig vanaf het ontwerp",
    body: "Veiligheid en privacy voegen we niet achteraf toe. We denken er al over na als we iets nieuws bouwen: wie mag wat zien, hoe blijven gegevens van verenigingen gescheiden, en hoe controleren we wijzigingen voordat ze live gaan.",
  },
  {
    icon: IconCheckCircle,
    title: "Gecontroleerd ontwikkeld",
    body: "Nieuwe functies gaan niet zomaar online. Voordat een update online komt, controleren we of alles nog werkt. Vinden we een probleem? Dan gaat de update niet door, totdat het is opgelost.",
  },
  {
    icon: IconLayers,
    title: "Professioneel georganiseerd",
    body: "We werken zoals een serieus bedrijf dat hoort te doen: we kijken naar risico's, we beperken wie ergens bij mag, we kunnen terugzien wie wat heeft veranderd, en we blijven onszelf verbeteren.",
  },
  {
    icon: IconEyeOff,
    title: "Privacy als uitgangspunt",
    body: "Verenigingen werken met gegevens van hun leden. Daarom denken we bij alles wat we bouwen mee: blijft dit veilig? Privacy is bij ons geen laatste stap, het zit er vanaf het begin in.",
  },
  {
    icon: IconGrowth,
    title: "Eén platform dat kan meegroeien",
    body: "De basis blijft simpel. Heeft jouw vereniging later meer nodig? Dan breidt Meer Vereniging mee. Je krijgt nooit functies opgedrongen die je niet gebruikt.",
  },
];

const ISO_PRACTICE: readonly string[] = [
  "Niet iedereen kan overal zomaar bij.",
  "Een update wordt eerst gecontroleerd, voordat hij live gaat.",
  "Belangrijke wijzigingen zijn achteraf terug te vinden.",
  "We lossen een gevonden probleem op voordat we verdergaan.",
  "Veiligheid zit al in het ontwerp, niet er achteraf bij geplakt.",
];

const RELEASE_STEPS: ReadonlyArray<{ icon: () => ReactElement; title: string; body: string }> = [
  { icon: IconHammer, title: "Bouwen", body: "Een nieuwe functie of verbetering wordt gemaakt." },
  { icon: IconMagnifier, title: "Controleren", body: "We checken automatisch of alles nog klopt." },
  { icon: IconFlask, title: "Testen", body: "Belangrijke updates worden extra grondig getest, ook onderdelen die je niet direct ziet." },
  { icon: IconRocket, title: "Vrijgeven", body: "Pas als alles goed is bevonden, gaat de update live." },
];

const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    heading: "Algemeen",
    items: [
      {
        question: "Wat is Meer Vereniging?",
        answer:
          "Meer Vereniging is software voor verenigingen: leden, agenda, communicatie en beheer op één plek, zodat vrijwilligers en bestuurders minder tijd kwijt zijn aan regelen.",
      },
      {
        question: "Voor wie is Meer Vereniging bedoeld?",
        answer:
          "Voor elke vereniging: muziekverenigingen, sportclubs, carnavalsverenigingen, stichtingen, noem maar op. De basis is voor iedereen hetzelfde.",
      },
      {
        question: "Welke onderdelen zijn er?",
        answer:
          "De basis is bewust simpel. Daarnaast zijn er onder andere: Agenda, Ledenadministratie, Projecten, Repertoire, Voorraad, Drankhaler, Polls, Prikbord en een Communicatiecentrum. Je gebruikt alleen wat jouw vereniging nodig heeft. Op de modulepagina lees je per onderdeel meer.",
      },
      {
        question: "Wat kost Meer Vereniging?",
        answer:
          "Onze definitieve prijsstelling wordt op dit moment afgerond en verschijnt binnenkort op de prijzenpagina. Tot die tijd kun je 90 dagen gratis proberen, zonder creditcard.",
      },
      {
        question: "Moet ik iets installeren?",
        answer: "Nee. Meer Vereniging werkt gewoon in je browser. Je hoeft niets te installeren om te beginnen.",
      },
      {
        question: "Op welke apparaten werkt Meer Vereniging?",
        answer: "Op je laptop, tablet en telefoon, gewoon via de browser. Je hoeft geen app te installeren.",
      },
    ],
  },
  {
    heading: "Veiligheid & privacy",
    items: [
      {
        question: "Hoe gaan jullie om met de gegevens van onze leden?",
        answer:
          "Zorgvuldig. Gegevens van de ene vereniging blijven gescheiden van die van een andere. Wie wat mag zien, is gekoppeld aan de rol die iemand heeft. En het verkeer tussen jouw scherm en Meer Vereniging is versleuteld.",
      },
      {
        question: "Voldoen jullie aan de AVG?",
        answer:
          "De AVG is de wet die zegt hoe je zorgvuldig met persoonsgegevens moet omgaan: alleen verzamelen wat nodig is, gegevens goed beveiligen, en mensen inzage geven in hun eigen gegevens. Als vereniging blijf je daar zelf verantwoordelijk voor. Wij bouwen Meer Vereniging wel zo dat het je daarbij helpt: gegevens blijven gescheiden en toegang is beperkt. We noemen onszelf hier bewust niet 'AVG-compliant', want dat is geen vinkje dat je één keer zet. Het is iets waar we doorlopend mee bezig blijven.",
      },
      {
        question: "Is Meer Vereniging ISO 27001-gecertificeerd?",
        answer:
          "Nee, nog niet. We werken al wel volgens veel van dezelfde principes. Hierboven op deze pagina leggen we uit wat dat in de praktijk betekent, en waarom we daar niet mee wachten tot we een certificaat hebben.",
      },
      {
        question: "Wie kan mijn gegevens bekijken?",
        answer:
          "In de eerste plaats de mensen binnen jouw eigen vereniging aan wie jullie zelf rechten geven. Onze eigen medewerkers kunnen, als dat nodig is voor beheer of hulp, ook meekijken. Dat gaat via een aparte, beveiligde weg, en het wordt vastgelegd wie dat wanneer heeft gedaan.",
      },
      {
        question: "Wie bepaalt wie wat mag binnen onze vereniging?",
        answer: "Jullie zelf. Het bestuur of de beheerder van je vereniging kent rollen en rechten toe aan de mensen die dat nodig hebben.",
      },
      {
        question: "Wat doen jullie als er een beveiligingsprobleem wordt gevonden?",
        answer:
          "Beveiligingsonderzoekers kunnen ons rechtstreeks bereiken, via een vast contactbestand dat daarvoor bedoeld is. Gaat het om een datalek met persoonsgegevens, dan houden we ons aan de wettelijke meldplicht.",
      },
    ],
  },
  {
    heading: "Overstappen & gegevens",
    items: [
      {
        question: "Hoe stap ik over vanuit ons huidige systeem?",
        answer:
          "Je bestaande ledengegevens kun je importeren, zodat je niet alles opnieuw hoeft in te typen. Loop je tegen iets aan, mail dan naar info@meervereniging.nl, dan denken we met je mee.",
      },
      {
        question: "Blijven onze gegevens van onze vereniging?",
        answer: "Ja. Wat jullie invoeren, blijft van jullie vereniging. Meer Vereniging is het systeem waarin je het beheert.",
      },
      {
        question: "Kunnen we onze gegevens meenemen als we stoppen?",
        answer:
          "Ja. Belangrijke gegevens kun je exporteren, zodat je vereniging niet vastzit aan Meer Vereniging. Neem voor de precieze mogelijkheden contact op via info@meervereniging.nl.",
      },
      {
        question: "Wat gebeurt er met onze gegevens als we opzeggen?",
        answer:
          "We werken netjes mee aan de overdracht van jullie gegevens. Persoonsgegevens verwijderen we volgens de AVG en de afspraken die we maken, met inachtneming van eventuele wettelijke bewaarplichten. Neem contact op via info@meervereniging.nl om dit samen te regelen.",
      },
      {
        question: "Hoe zeg ik op?",
        answer: "Stuur een mail naar info@meervereniging.nl, dan helpen we je verder.",
      },
    ],
  },
  {
    heading: "Gebruik",
    items: [
      {
        question: "Heb ik veel uitleg nodig om te starten?",
        answer: "Nee. Meer Vereniging is gemaakt voor mensen zonder IT-achtergrond: gewone taal en duidelijke schermen, zodat je snel aan de slag kunt.",
      },
      {
        question: "Kan ik zelf bepalen wie wat mag zien of doen?",
        answer: "Ja, via rollen en rechten die jullie zelf instellen. Bijvoorbeeld voor het bestuur, de ledenadministratie of een commissie.",
      },
      {
        question: "Groeit Meer Vereniging mee als onze vereniging verandert?",
        answer: "Ja. De basis blijft simpel, en er zijn onderdelen die je later kunt toevoegen zodra je ze nodig hebt.",
      },
      {
        question: "Is er hulp als ik ergens niet uitkom?",
        answer: "Ja, mail ons via info@meervereniging.nl.",
      },
    ],
  },
  {
    heading: "Techniek & betrouwbaarheid",
    items: [
      {
        question: "Waar draait Meer Vereniging op?",
        answer:
          "We kiezen bewust voor professionele, gespecialiseerde partijen om onze techniek te laten draaien, in plaats van dit zelf te doen. De verbinding met onze website en app is versleuteld.",
      },
      {
        question: "Hoe vaak brengen jullie updates uit, en merk ik daar iets van?",
        answer:
          "Updates doorlopen ons vaste proces (hierboven op deze pagina uitgelegd) voordat ze live gaan. Merk je iets, dan zie je dat via een pushmelding en in \"Wat is nieuw\" in de app. Een grotere, nieuwe module kondigen we vooraf aan per e-mail.",
      },
      {
        question: "Is Meer Vereniging altijd bereikbaar?",
        answer: "We doen ons best om de dienst zo betrouwbaar mogelijk te laten draaien. We geven daar bewust geen harde garantie op, we willen geen belofte doen die we niet kunnen waarmaken.",
      },
      {
        question: "Gebruiken jullie AI met onze gegevens?",
        answer: "Daar zijn we terughoudend in. Gegevens van leden gaan niet zomaar naar externe AI-diensten voor onze kernfunctionaliteit. Heb je hier een specifieke vraag over, mail ons gerust.",
      },
      {
        question: "Wat is die Internet.nl-score die jullie noemen?",
        answer:
          "Onze website scoort momenteel 86% bij Internet.nl, een onafhankelijke test die controleert of een website moderne en veilige internetstandaarden gebruikt. Alleen IPv6 ontbreekt nog, dat wordt op dit moment nog niet ondersteund door onze hostingomgeving. Zodra dat verandert, pakken we ook dit laatste onderdeel aan.",
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
              Met oog voor wat belangrijk is.
            </h1>
            <p className="lede">
              Een vereniging draait vaak op vrijwilligers. Maar persoonsgegevens, communicatie en belangrijke
              verenigingsinformatie verdienen net zoveel zorg als bij een gewoon bedrijf.
            </p>
            <p className="lede">Bij Meer Vereniging is dat simpel aan de voorkant, en zorgvuldig geregeld achter de schermen.</p>
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
            Niet alleen simpel.
            <br />
            Ook zorgvuldig.
            <br />
            <strong>Gebouwd voor verenigingen, met de zorgvuldigheid van professionele bedrijfssoftware.</strong>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Waarom deze aanpak</p>
          <h2>Zes dingen waar we niet op inleveren.</h2>
          <div className="grid cards-3" style={{ marginTop: 32 }}>
            {USPS.map((usp) => (
              <article className="card" key={usp.title}>
                <span className="wmv-icon">
                  <usp.icon />
                </span>
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
          <h2>Zorgvuldig werken, ook zonder certificaat.</h2>
          <p className="lede">
            ISO/IEC 27001 is een internationale norm voor informatiebeveiliging. Simpel gezegd gaat het erom dat je
            niet op goed geluk met gegevens omgaat. Je spreekt af wie ergens bij mag, je controleert veranderingen,
            en je grijpt in als iets niet goed gaat.
          </p>
          <p className="lede">Meer Vereniging werkt al op die manier. Wat betekent dat in de praktijk?</p>
          <div className="problem-list" style={{ marginTop: 24 }}>
            {ISO_PRACTICE.map((principle) => (
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
              Omdat goede beveiliging niet hoeft te wachten op een certificaat. We willen het nu al goed doen, niet
              pas op het moment dat dat ergens op papier moet staan.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Aantoonbare veiligheid</p>
          <h2>Veiligheid moet je niet alleen beloven.</h2>
          <p className="lede">
            We zeggen niet alleen dat onze website veilig is. Internet.nl controleert onafhankelijk of websites
            moderne en veilige internetstandaarden gebruiken. Zo&apos;n score bewijst niet dat er nooit iets mis kan
            gaan. Het laat wel zien hoe goed een website daadwerkelijk is ingericht, gecontroleerd door een partij
            die daar geen belang bij heeft.
          </p>
          <div className="grid cards-3" style={{ marginTop: 24 }}>
            <article className="card">
              <span className="wmv-icon">
                <IconGlobe />
              </span>
              <h3>Een betrouwbare verbinding</h3>
              <p className="muted">Onze website gebruikt een domeinnaam die niet zomaar te vervalsen is en is goed ondertekend (DNSSEC).</p>
            </article>
            <article className="card">
              <span className="wmv-icon">
                <IconLock />
              </span>
              <h3>Versleutelde gegevens</h3>
              <p className="muted">Alles wat tussen jouw scherm en onze website reist, is versleuteld en dus niet zomaar af te luisteren.</p>
            </article>
            <article className="card">
              <span className="wmv-icon">
                <IconRoute />
              </span>
              <h3>Beschermd tegen misbruik</h3>
              <p className="muted">Extra maatregelen zorgen ervoor dat verkeer naar onze website niet per ongeluk of expres verkeerd wordt omgeleid.</p>
            </article>
          </div>
          <div className="card" style={{ marginTop: 28, maxWidth: 460 }}>
            <p className="muted" style={{ margin: 0 }}>Onze score op internet.nl</p>
            <div className="wmv-stat-row">
              <div className="wmv-stat">
                <div className="wmv-stat-value wmv-stat-current">86%</div>
                <div className="wmv-stat-label">Huidige score</div>
              </div>
              <div className="wmv-stat">
                <div className="wmv-stat-value wmv-stat-goal">100%</div>
                <div className="wmv-stat-label">Ons doel</div>
              </div>
            </div>
            <div className="wmv-stat-bar">
              <div className="wmv-stat-bar-fill" />
            </div>
            <p className="muted" style={{ marginTop: 16, marginBottom: 0 }}>
              Onze website scoort momenteel 86% bij Internet.nl. Alleen IPv6 ontbreekt nog. Dit wordt op dit moment
              nog niet ondersteund door onze hostingomgeving. Zodra dat verandert, pakken we ook dit laatste
              onderdeel aan. Is dat zover, dan laten we dat hier zien met het officiële keurmerk.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="hoe-we-werken">
        <div className="container">
          <p className="eyebrow">Hoe we releasen</p>
          <h2>Een update moet eerst bewijzen dat hij werkt.</h2>
          <div className="steps wmv-steps-4" style={{ marginTop: 24 }}>
            {RELEASE_STEPS.map((step) => (
              <div className="step" key={step.title}>
                <span className="wmv-icon">
                  <step.icon />
                </span>
                <h3>{step.title}</h3>
                <p className="muted">{step.body}</p>
              </div>
            ))}
          </div>
          <p className="lede" style={{ marginTop: 32 }}>
            Vinden we ergens een probleem? Dan gaat de update niet door. Eerst lossen we het op, pas daarna proberen
            we het opnieuw.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Veelgestelde vragen</p>
          <h2>Nog vragen?</h2>
          <WaaromFaq groups={FAQ_GROUPS} />
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
