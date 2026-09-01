# AI crawler policy — vereniq-website

Intern werkdocument. Onderbouwing voor de expliciete AI-crawlerregels in
`app/robots.ts`. Bronnen: elke aanbieder se eigen documentatie (zie tabel), plus
Google Search Central en Search Engine Journal voor Google-Extended.

## Uitgangspunt

`meervereniging.nl` is een publieke marketingsite zonder gevoelige data, geen
betaalmuur, geen persoonsgegevens van klanten. Er is dus **geen beveiligings- of
privacyreden** om welke crawler dan ook te blokkeren. We willen vindbaarheid in
AI-antwoorden actief bevorderen. Tegelijk is dit een **bewuste** keuze, niet een
automatisch "alles staat default open" — daarom staan alle relevante crawlers met
naam en met een reden in `app/robots.ts`, in plaats van dit stilzwijgend aan het
wildcard-record (`User-Agent: *`) over te laten.

## Onderscheid: training vs. live-antwoord vs. zoekindexering

Elke grote AI-aanbieder documenteert tegenwoordig **aparte, onafhankelijk
controleerbare bots** voor verschillende doeleinden:

| Aanbieder | User-agent | Doel |
|---|---|---|
| OpenAI | `GPTBot` | Trainingsdata verzamelen |
| OpenAI | `OAI-SearchBot` | Indexering voor ChatGPT-zoekresultaten |
| OpenAI | `ChatGPT-User` | Live ophalen wanneer een gebruiker een concrete vraag stelt |
| Anthropic | `ClaudeBot` | Trainingsdata verzamelen |
| Anthropic | `Claude-User` | Live antwoord op een gebruikersvraag |
| Anthropic | `Claude-SearchBot` | Zoekresultaatkwaliteit |
| Google | `Google-Extended` | Geen aparte crawler — een robots.txt-token dat bepaalt of al gecrawlde content gebruikt mag worden voor Gemini/Vertex AI-training & grounding. Raakt Search-indexering niet. |
| Perplexity | `PerplexityBot` | Zoekresultaten/indexering |
| Perplexity | `Perplexity-User` | Live antwoord op een gebruikersvraag |
| Common Crawl | `CCBot` | Open dataset, gebruikt als trainingsinput door meerdere labs |

(Bronnen: OpenAI bots-documentatie, Anthropic crawler-documentatie, Perplexity
bots-documentatie, Common Crawl CCBot-pagina, Search Engine Journal over
Google-Extended.)

## Besluit

Alle bovenstaande crawlers staan expliciet toegestaan (`Allow: /`, met dezelfde
`Disallow`-uitzonderingen als het wildcard-record: `/master`, `/cms-preview`,
`/api/`). Reden per categorie:

- **Live-antwoordbots** (ChatGPT-User, Claude-User, Perplexity-User): dit is precies
  het gedrag dat we willen bevorderen — een gebruiker stelt een vraag, de assistent
  haalt onze pagina op om een accuraat antwoord te geven. Blokkeren zou rechtstreeks
  ingaan tegen het doel van deze opdracht.
- **Zoek-/indexeringsbots** (OAI-SearchBot, Claude-SearchBot, PerplexityBot,
  Google-Extended voor grounding): zelfde argument als traditionele SEO — zonder
  indexering geen vindbaarheid.
- **Trainingsbots** (GPTBot, ClaudeBot, CCBot): bewust óók toegestaan, met als
  redenering: (1) er staat niets gevoeligs of betaalmuur-content op deze site — alles
  is al publiek en wordt sowieso door reguliere zoekmachines geïndexeerd; (2) een
  model dat traint op onze eigen, accurate productbeschrijving zorgt eerder voor een
  correct beeld van Meer Vereniging dan wanneer het model alleen op
  derde-partijbronnen (reviews, vergelijkingssites) leunt. Dit is een bewuste,
  herzienbare keuze — geen "toevallig niet geblokkeerd".

## Wat NIET is gedaan

- Geen enkele crawler is geblokkeerd op basis van een aanname — elke regel in de tabel
  hierboven is gecontroleerd tegen de eigen documentatie van de aanbieder.
  Geen naam is verzonnen.
- Geen DNS- of Vercel-configuratiewijziging — dit is uitsluitend een `robots.txt`-
  wijziging in code.
- Deze policy is expliciet herzienbaar: als een van deze partijen ooit misbruik zou
  maken van deze toegang, is het een kwestie van één regel aanpassen in
  `app/robots.ts`.
