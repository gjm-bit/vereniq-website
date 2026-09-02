# SEO- en AI-vindbaarheidsaudit — vereniq-website

Intern werkdocument. Datum: 2026-09-02 (nightshift-sessie op branch `feat/seo-ai-visibility`).
Basis: `origin/main` @ `bc7ce665fdec1b6c32b79f9f299276e32368f4fd`.

Dit document beschrijft de audit, de doorgevoerde technische SEO-wijzigingen en de
bewust NIET doorgevoerde ideeën. Voor de zoekintentie/keyword-analyse zie
`docs/keyword-topic-map.md`. Voor de AI-crawlerpolicy zie `docs/ai-crawler-policy.md`.
Voor de Search Console-voorbereiding zie `docs/search-console-prep.md`. Voor de
feitelijke onderbouwing van elke SEO-tekstclaim zie `docs/seo-claims-register.md`.

## 1. Uitgangspunt en aanpak

Alles wat een bezoeker ziet moet in de eerste plaats goed en eerlijk zijn voor mensen.
Technische SEO- en AI-verbeteringen zijn dit sessie uitsluitend structureel/technisch
(canonicals, metadata, structured data, robots/sitemap) of feitelijke correcties
(stale/onjuiste content die toevallig ook slecht is voor AI-vindbaarheid). Er zijn
**geen nieuwe landingspagina's gebouwd** (zie `docs/keyword-topic-map.md` voor de
onderbouwing) en er is **niets verzonnen** — elke tekstwijziging staat met bron in
`docs/seo-claims-register.md`.

## 2. Feitelijke inventarisatie (vóór wijzigingen)

Volledige routelijst, per-route metadata, robots/sitemap-implementatie,
structured-data-status, canonical-strategie, redirectgedrag, afbeeldingen/alt-tekst,
interne linkstructuur en bestaande tests zijn onderzocht via directe code-inspectie
(niet aangenomen). Belangrijkste bevindingen:

- **Geen canonical-strategie bestond**: geen enkele pagina zette `<link rel="canonical">`.
  `metadataBase` was wel gezet in `app/layout.tsx`, maar dat genereert zelf geen
  canonical-tags.
- **Geen Open Graph/Twitter-metadata** bestond op paginaniveau (alleen impliciet via
  de root-defaults, zonder afbeelding of URL).
- **JSON-LD bestond al** (Organization/WebSite/SoftwareApplication in `app/layout.tsx`,
  sitewide), correct zonder verzonnen rating/prijs-data. Geen BreadcrumbList, geen
  per-paginastructured data.
- **`app/over-ons-contact/page.tsx` en `app/app/page.tsx` hadden géén eigen
  `generateMetadata`**, ondanks dat ze een ander component renderen dat er wél een
  heeft — Next.js/vinext resolvet metadata per route-segment, niet per gerenderd
  component, dus deze routes vielen stil terug op de generieke root-titel/omschrijving.
  **Gefixed**: beide hebben nu een eigen `generateMetadata`.
- **`modules/[slug]` en `kennisbank/[slug]` hadden helemaal geen metadata-export.**
  **Gefixed.**
- **`app/sitemap.ts` miste een aantal echte, indexeerbare routes** die geen eigen
  CMS `Page`-rij hebben (en dus nooit via de bestaande CMS-gedreven sitemap-logica
  konden verschijnen): `/waarom-meer-vereniging`, `/app`, `/voor-wie` + de 5
  doelgrooppagina's daaronder, `/proefabonnement`. **Gefixed** met een expliciete,
  code-eigen lijst (zie §4).
- **`app/robots.ts` had geen expliciete regel voor `/cms-preview` en `/api/`**
  (beide sowieso niet waardevol om te indexeren, en `/cms-preview` toont mogelijk
  niet-gepubliceerde content). **Gefixed.**
- **Twee "dubbele titel"-bugs gevonden**: `/voor-wie`'s `title: "Voor wie | Meer
  Vereniging"` en de 404-fallback-titel `"Pagina niet gevonden | Meer Vereniging"`
  zouden door de root-titelsjabloon (`"%s | Meer Vereniging"`) een tweede keer
  "| Meer Vereniging" achter zich krijgen. **Gefixed** (titels zonder het achtervoegsel,
  het sjabloon voegt het al toe).
- **`/app` dupliceert `/platform`'s volledige inhoud** zolang er geen eigen CMS-pagina
  op `/mogelijkheden` bestaat (beide renderen dan hetzelfde `<Platform/>`-component).
  Dat is duplicate content op twee indexeerbare URL's. **Gefixed**: `/app`
  canonicaliseert in dat geval naar `/platform`, en pas naar zichzelf zodra er een
  eigen CMS-pagina bestaat.
- **`/kennisbank` toont een lege "we vullen dit nog"-placeholder zolang er geen
  gepubliceerde artikelen zijn** — te dun om te indexeren. **Gefixed**: `noindex`
  wanneer `articles.length === 0`, indexeert vanzelf weer zodra er echte artikelen
  bijkomen.
- **`/voor-wie` en `/kennisbank` waren orphan pages** (nergens in header/footer/body
  gelinkt). `/voor-wie` bevat vijf goede, echte doelgroeppagina's — **gefixed** met
  een footer-only link (bewust niet in de hoofdnavigatie, om het bekende
  header-overlapprobleem rond ~800-900px niet te verergeren). `/kennisbank` blijft
  bewust ongelinkt zolang hij leeg/noindex is.
- **Content-onjuistheid gevonden, buiten de directe SEO-scope maar met feitelijke
  impact op AI-antwoordkwaliteit**: de metabeschrijving van `/modules` en de
  `llms.txt` noemden "CRM, Finance en Fortissimo" als onderdelen — dit komt niet
  overeen met de huidige, door Gert-Jan bevestigde onderdelenlijst (Agenda,
  Ledenadministratie, Projecten, Repertoire, Voorraad, Drankhaler, Polls, Prikbord,
  Communicatiecentrum) en "Fortissimo" oogt als een interne projectcodenaam die
  niet publiek hoort te staan. **Gefixed waar het puur tekst/metadata betrof**
  (modules-meta-description, llms.txt). **NIET gefixed**: de onderliggende
  `localModules`-dataset (`src/repositories/local.ts`) en de `/modules/[slug]`-
  detailpagina's zelf gebruiken nog het oude zesdelige testmodel
  (Agenda/Ledenadministratie/Communicatie/Finance/CRM/Fortissimo) — dat vereist
  echte, per-onderdeel productcopy die ik niet heb en die ik niet ga verzinnen.
  **Zie P0 in §8.**
- **Feitelijke tegenstrijdigheid gevonden**: de FAQ op `/waarom-meer-vereniging`
  claimde "de actuele prijzen staan op onze prijzenpagina", terwijl `/prijzen` zelf
  zegt "Onze prijsstelling komt binnenkort" (nog niet vastgesteld). **Gefixed**: de
  FAQ-tekst is aangepast aan de daadwerkelijke status van `/prijzen`.

## 3. Canonical- en metadatastrategie (nieuw)

Nieuwe gedeelde helper: `src/lib/seo.ts`.

- `absoluteUrl(path)`: bouwt een absolute URL op basis van `site.url`
  (`https://meervereniging.nl`, via `NEXT_PUBLIC_SITE_URL`).
- `pageMetadata({title, description, path, noindex?, ogImage?, titleIsAbsolute?})`:
  retourneert consistente `canonical` + `openGraph` + `twitter`-metadata voor één
  pagina. Toegepast op alle publieke routes met een eigen `page.tsx`
  (homepage, `/platform`, `/app`, `/waarom-meer-vereniging`, `/modules`,
  `/modules/[slug]`, `/voor-wie`, `/voor-wie/[slug]`, `/kennisbank`,
  `/kennisbank/[slug]`, `/proefabonnement`, `/proefabonnement/activeren`,
  `/over-ons-contact`, en de CMS-gedreven catch-all `[...slug]`).
- `breadcrumbJsonLd(trail)`: BreadcrumbList JSON-LD voor detailpagina's
  (`/modules/[slug]`, `/voor-wie/[slug]`, `/kennisbank/[slug]`).

Default OG-afbeelding: `public/brand/meer-vereniging-brand-lockup.png` — een
bestaand, echt merkasset (logo + tagline, lichte achtergrond), geen AI-afbeelding en
geen stockfoto. Niet het ideale 1200×630-formaat (588×516, bijna vierkant) — zie
opportuniteit in §9.

## 4. Sitemap en robots

`app/sitemap.ts`: naast de bestaande CMS `Page`/`Module`/`Article`-gedreven entries
nu ook een expliciete `STATIC_ROUTES`-lijst voor routes met een eigen `page.tsx` die
niet via toeval van een CMS `Page`-rij afhangen, plus de vijf `/voor-wie/[slug]`-
doelgroepen. `/kennisbank` alleen opgenomen als er echte artikelen zijn. Geen
verzonnen `lastModified` — alleen gebruikt waar een echte CMS-`updatedAt` bestaat.

`app/robots.ts`: `Allow: /` met `Disallow: /master`, `/cms-preview`, `/api/` voor
`User-Agent: *`, plus expliciete, met naam genoemde regels voor uitsluitend de
search/discovery- en live user-answer-crawlers uit `docs/ai-crawler-policy.md`
(`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`,
`Perplexity-User`). Crawlers die volgens hun eigen documentatie (mede) voor
modeltraining of datasetopbouw dienen (`GPTBot`, `ClaudeBot`, `Google-Extended`,
`CCBot`) krijgen bewust **geen** aparte regel — dat zou een eigen beleidskeuze zijn
(trainingsdata expliciet beschikbaar stellen), losgekoppeld van het doel
"vindbaarheid/citatie" van deze policy. Ze vallen terug op het wildcard-record,
dus niet geblokkeerd, maar ook niet ten onrechte bestempeld als "nodig voor
AI-vindbaarheid". Zie `docs/ai-crawler-policy.md` voor de per-crawler bronnen.

## 5. Structured data

Sitewide `@graph` in `app/layout.tsx` (al bestaand, dit sessie uitgebreid):

- **Organization**: nu met `logo` (absolute URL naar het echte merklockup) en
  `sameAs` — dynamisch opgehaald uit dezelfde, al bestaande CMS-gedreven
  socialkanalenbron als de footer (`getWebsiteSocialLinks`/`getOrganizationFooterData`).
  Geen verzonnen profielen; als er niets is ingesteld, blijft `sameAs` weg.
- **WebSite**: ongewijzigd.
- **SoftwareApplication**: bewust **geen** `aggregateRating`, `review` of `offers` —
  die data bestaat niet (nog geen prijsstelling, geen reviews) en zou verzonnen zijn.
  Onderzoek bevestigt dit is veilig: Google's eigen documentatie vereist geen van
  deze velden; het enige gevolg van weglaten is dat de pagina niet in aanmerking komt
  voor een visuele rich result-kaart, wat het eerlijke, correcte resultaat is.
  (Bron: Google Search Central — SoftwareApplication structured data.)
- **BreadcrumbList** (nieuw): op `/modules/[slug]`, `/voor-wie/[slug]`,
  `/kennisbank/[slug]` — Home → sectie-index → detailpagina.
- **FAQPage: bewust NIET geïmplementeerd.** Google heeft FAQ-rich-results per
  7 mei 2026 volledig uitgefaseerd voor alle sites (verder dan de al bestaande
  beperking uit 2023 tot overheids-/gezondheidssites) en verwijdert ook de
  bijbehorende documentatie/tooling. `FAQPage`-JSON-LD toevoegen heeft dus geen
  enkel praktisch voordeel meer voor Google, en zou alleen onderhoudslast
  toevoegen. De FAQ zelf blijft gewoon, goed gestructureerde semantische HTML
  (`<details>/<summary>`), leesbaar voor elke crawler/AI-systeem zonder JSON-LD
  nodig te hebben. (Bron: Google Search Central FAQPage-documentatie,
  Search Engine Journal.)

JSON-LD is elke keer gevalideerd via `JSON.parse()` in de nieuwe contracttests
(`tests/seo-metadata.test.mjs`), niet alleen visueel gecontroleerd.

## 6. AI-vindbaarheid (AEO/GEO) — wat wél en niet is gedaan

Zie `docs/ai-crawler-policy.md` voor de volledige crawlerpolicy-onderbouwing.

- **llms.txt**: bestond al in productie (`app/llms.txt/route.ts`), maar bevatte
  feitelijke fouten (zie §2). Onderzoek (2026) laat zien dat dit **geen officiële,
  breed aangenomen standaard** is: 97% van gepubliceerde `llms.txt`-bestanden wordt
  nooit opgehaald door AI-crawlers, en Google heeft expliciet gezegd het niet te
  ondersteunen (Gary Illyes, juli 2025 — vergeleken met de achterhaalde
  keywords-metatag). **Besluit**: bestand behouden (kost niets, geen risico) maar
  inhoud gecorrigeerd naar de echte productbeschrijving, met een expliciete
  code-comment die vermeldt dat dit geen erkende standaard is. Niet actief als
  SEO-hefboom gepresenteerd.
- **Entity clarity**: Organization-`sameAs` toegevoegd (zie §5) — de enige
  concrete, door Google zelf gedocumenteerde AI-relevante aanbeveling die geen hype
  is (helpt een entiteit ondubbelzinnig te onderscheiden van soortgelijke namen,
  voor zowel traditionele als AI-gedreven systemen).
  Consistent gebruik van "Meer Vereniging" (met hoofdletters, geen losse
  kleine-letter-variant) is al de bestaande conventie in alle gecontroleerde
  bronbestanden.
- **FAQ "answer first"-principe**: op `/waarom-meer-vereniging` beantwoordden
  meerdere FAQ-antwoorden de vraag niet zelf, maar verwezen alleen door
  ("Bekijk onze modulepagina", "Neem contact op"). Dat is zowel voor mensen als
  voor AI-samenvatting zwak (een AI-systeem kan het antwoord dan niet citeren).
  Gefixed voor: "Welke onderdelen zijn er?" (nu met concrete onderdelenlijst),
  "Kunnen we onze gegevens meenemen als we stoppen?" (nu: ja, export, met contact
  voor details), "Wat gebeurt er met onze gegevens als we opzeggen?" (nu: concrete
  uitleg over meewerken aan overdracht + AVG-verwijdering), "Hoe stap ik over?"
  (nu: noemt de bestaande importfunctie), en de internet.nl-vraag (nu met het
  concrete percentage in het antwoord zelf). Zie `docs/seo-claims-register.md` voor
  de onderbouwing van elke toegevoegde claim.
- **Semantische HTML / crawlbaarheid**: elke gecontroleerde pagina heeft precies
  één `<h1>`, een `<main>`-landmark (via `PublicShell`), een genavigeerde
  `<nav aria-label="Hoofdnavigatie">` en een `<footer>`. Geen belangrijke content zit
  achter alleen-JavaScript-interactie zonder onderliggende HTML (de FAQ gebruikt
  native `<details>/<summary>`, niet iets dat pas na een klik in de DOM verschijnt).

## 7. Performance en toegankelijkheid (read-only, Fase 9/10)

- **Geen `@font-face` in de hele codebase** — uitsluitend systeemfonts
  (Arial/Helvetica, Georgia als serif-fallback op één decoratieve component).
  Geen footlast, geen font-swap-layoutshift. Geen actie nodig.
- **`next/image` wordt alleen gebruikt in `site-shell.tsx`** (het logo/de
  merkidentiteit); overige afbeeldingen (CMS-gedreven productexplorer, CMS-content)
  gebruiken bewust een raw `<img>` omdat hun afmetingen dynamisch/CMS-bepaald zijn —
  dit zijn de 13 bekende, al bestaande lint-warnings. Migreren naar `next/image` zou
  een grotere, niet-low-risk wijziging zijn (afmetingen zijn niet statisch bekend) —
  **niet tijdens deze nightshift gedaan**, zie opportuniteit in §9.
- **Eén `<h1>` per gecontroleerde pagina** (`/waarom-meer-vereniging`, `/platform`,
  `/modules`, `/voor-wie`) — bevestigd via directe code-inspectie.
  Landmarks/nav/main/footer aanwezig en consistent (§6).
- Geen regressies veroorzaakt: alle wijzigingen dit sessie waren metadata/JSON-LD/
  tekst, geen enkele layoutwijziging.

## 8. Nieuwe P0/P1/P2-bevindingen

**P0 — sitewide module-naamgeving mismatch (buiten scope van deze nightshift
gefixed).** `/modules`, `/modules/[slug]`, `/platform`, `/voor-wie/[slug]` en (tot
vanavond) `llms.txt` gebruiken allemaal hetzelfde onderliggende testdataset
(`src/repositories/local.ts`: Agenda, Ledenadministratie, Communicatie, Finance,
CRM, Fortissimo) dat niet overeenkomt met de huidige, echte onderdelenlijst
(Agenda, Ledenadministratie, Projecten, Repertoire, Voorraad, Drankhaler, Polls,
Prikbord, Communicatiecentrum) die Gert-Jan in deze opdracht gaf. "Fortissimo" oogt
als een interne projectnaam die publiek zichtbaar is als productonderdeel. Dit
sessie alleen de **tekstuele/metadata-verwijzingen** naar deze namen gecorrigeerd
(modules-meta-description, llms.txt) zonder de onderliggende module-data, slugs of
detailpagina's te wijzigen — dat vereist echte, per-onderdeel productcopy (features,
voordelen, doelgroepen) die niet in deze opdracht is aangeleverd en die niet verzonnen
mag worden. **Aanbeveling**: een aparte, gerichte content-opdracht om
`src/repositories/local.ts` (of de echte Supabase-CMS-tegenhanger in productie) en de
`/modules/[slug]`/`/voor-wie/[slug]`-detailpagina's bij te werken naar de echte
onderdelenlijst.

**P1 — onduidelijk of productie werkelijk via CMS of via deze lokale fallback-data
draait.** Dit sessie kon niet worden geverifieerd of de echte Supabase-CMS-tabellen
in productie al wel de juiste, actuele onderdelenlijst bevatten (in welk geval het
bovenstaande P0-probleem mogelijk alleen in dev/test zichtbaar is en niet in
productie) — geen productie-databasetoegang binnen deze opdracht. **Aanbeveling**:
vóór het beoordelen van P0 als "productie-impact" eerst controleren wat de echte
Supabase `modules`-tabel in productie bevat.

**P2 — OG-afbeelding is niet in het ideale 1200×630-formaat.** Zie opportuniteit
§9.

**P2 — 13 bestaande `<img>`-lint-warnings (LCP/bandbreedte) blijven staan.** Bekend,
low-risk migratie naar `next/image` is een aparte taak (zie §9).

Geen van deze is een beveiligings- of privacyrisico.

## 9. Openstaande kansen (niet dit sessie gedaan, bewust)

- Purpose-made 1200×630 OG-afbeelding laten maken (huidige fallback werkt, maar is
  niet optimaal gecropt op elk platform).
- `next/image`-migratie voor de CMS-gedreven afbeeldingscomponenten (grotere
  wijziging, dynamische afmetingen moeten eerst worden vastgesteld).
- IPv6-ondersteuning, certificaatsleutelsterkte (beide Vercel-/platformafhankelijk),
  CAA-record, CSP `unsafe-inline`-verwijdering, security.txt PGP-ondertekening — al
  eerder gedocumenteerd in `docs/internet-nl-100-plan.md`, ongewijzigd dit sessie.
- Het bekende `.section-mist`-contrastprobleem en de header-overlap rond
  ~800-900px — bewust niet meegepakt (niet direct geraakt door dit werk).
- Zie P0/P1 in §8 voor de module-naamgeving.

## 10. Tests, lint, build

- `npm run test`: 81/81 groen (72 bestaande + 9 nieuwe SEO-contracttests in
  `tests/seo-metadata.test.mjs`). De 2 bekende CSP-testinfrastructuurfails
  manifesteerden zich dit sessie niet (afhankelijk van welke `NEXT_PUBLIC_*`-config
  toevallig in het gebouwde workerartefact zit) — geen nieuwe regressie, wel gunstiger
  dan de baseline.
- `npm run lint`: 0 errors, 13 bekende `<img>`-warnings (ongewijzigd).
- `npm run build`: groen.
