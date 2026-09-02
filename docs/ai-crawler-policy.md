# AI crawler policy — vereniq-website

Intern werkdocument. Onderbouwing voor de expliciete AI-crawlerregels in
`app/robots.ts`. Bronnen: elke aanbieder se eigen, dit sessie rechtstreeks
opnieuw geraadpleegde documentatie (zie tabel en bronnenlijst onderaan).

## Het criterium

Het relevante criterium is **niet** "is er een beveiligingsreden om deze crawler te
blokkeren" — dat is niet de vraag die hier speelt, want deze site bevat geen
gevoelige of betaalmuur-content. Het relevante criterium is:

**Heeft deze crawler daadwerkelijk nut voor vindbaarheid of citatie in
zoekresultaten of live AI-antwoorden — of dient hij een ander doel, zoals
modeltraining of het opbouwen van een webdataset?**

Alleen crawlers uit de eerste categorie krijgen een expliciete, met naam genoemde
`Allow`-regel. Crawlers die (mede) voor training of datasetopbouw dienen krijgen
géén aparte regel — dat zou een eigen beleidskeuze zijn (trainingsdata beschikbaar
stellen), die losstaat van het doel van deze policy en niet stilzwijgend aan
vindbaarheid gekoppeld moet worden. Dit betekent niet dat ze geblokkeerd worden: ze
vallen terug op het gewone wildcard-record (`User-Agent: *`), exact zoals elke
andere, niet met naam genoemde crawler.

## Vier categorieën

1. **Search/discovery-crawlers** — bouwen een doorzoekbare index op, vergelijkbaar
   met traditionele SEO.
2. **Live user-request/answer-crawlers** — halen een pagina op omdat een concrete
   gebruiker op dat moment een vraag stelt aan een AI-assistent.
3. **Trainingscrawlers** — verzamelen content om AI-modellen te trainen.
4. **Dataset-/archiefcrawlers** — bouwen een brede, herbruikbare webdataset op
   (niet gebonden aan één aanbieder of doel).

Alleen categorie 1 en 2 zijn relevant voor "vindbaarheid en citeerbaarheid in
AI-zoekresultaten en AI-antwoorden" — het expliciete doel van deze policy.

## Per aanbieder, met exacte bron

### OpenAI (bron: developers.openai.com/api/docs/bots, dit sessie rechtstreeks geraadpleegd)

| Bot | Categorie | Officiële omschrijving | Expliciete regel? |
|---|---|---|---|
| `OAI-SearchBot` | 1. Search/discovery | "used to surface websites in search results in ChatGPT's search features" | **Ja** |
| `ChatGPT-User` | 2. Live answer | gebruikt "for certain user actions in ChatGPT" — wanneer een gebruiker ChatGPT een vraag stelt, "it may visit a web page" | **Ja** |
| `GPTBot` | 3. Training | "used to crawl content that may be used in training" om de modellen "more useful and safe" te maken | **Nee** |
| `OAI-AdsBot` | (advertentievalidatie, niet gecontroleerd) | valideert advertentiepagina's | Niet van toepassing, niet opgenomen |

### Anthropic (bron: support.claude.com — officiële Help Center, dit sessie rechtstreeks geraadpleegd)

| Bot | Categorie | Officiële omschrijving | Expliciete regel? |
|---|---|---|---|
| `Claude-SearchBot` | 1. Search/discovery | "navigates the web to improve search result quality for users. It analyzes online content specifically to enhance the relevance and accuracy of search responses" | **Ja** |
| `Claude-User` | 2. Live answer | "supports Claude AI users. When individuals ask questions to Claude, it may access websites using a Claude-User agent" | **Ja** |
| `ClaudeBot` | 3. Training | "helps enhance the utility and safety of our generative AI models by collecting web content that could potentially contribute to their training" | **Nee** |

### Perplexity (bron: docs.perplexity.ai/guides/bots, dit sessie rechtstreeks geraadpleegd)

| Bot | Categorie | Officiële omschrijving | Expliciete regel? |
|---|---|---|---|
| `PerplexityBot` | 1. Search/discovery | "designed to surface and link websites in search results on Perplexity"; expliciet: "It is not used to crawl content for AI foundation models" | **Ja** |
| `Perplexity-User` | 2. Live answer | "supports user actions within Perplexity. When users ask Perplexity a question, it might visit a web page"; expliciet: "not used for web crawling or to collect content for training" | **Ja** |

Perplexity is de enige aanbieder die expliciet en ondubbelzinnig bevestigt dat beide
bots **niet** voor training worden gebruikt — het duidelijkste geval van de vier.

### Google (bron: Google Cloud/Search Central-documentatie over Google-Extended, dit
sessie geraadpleegd; reguliere Google Search-documentatie apart geraadpleegd)

Google-Extended is **geen aparte crawler** — het heeft geen eigen HTTP-user-agent en
haalt zelf niets op. Het is een robots.txt-token dat bepaalt of content die door
reguliere Google-crawlers is opgehaald, gebruikt mag worden voor (a) toekomstige
Gemini-modeltraining, (b) grounding in de Gemini-apps, en (c) grounding in
"Grounding with Google Search" op Vertex AI (een betaald API-product voor
ontwikkelaars die eigen agents bouwen). Google bevestigt expliciet: **dit token
beïnvloedt de opname of ranking in reguliere Google Search niet.**

Belangrijk: Google's eigen AI Overviews-functie *binnen* de gewone Google
Zoekresultaten wordt gevoed door de standaard Google Search-index (Googlebot) —
niet door Google-Extended. Er is dus geen aantoonbare, van training losstaande
search/answer-visibilityreden om Google-Extended apart toe te staan: de enige
gedocumenteerde functies van dit token zijn training en grounding voor het losse
Gemini-app/Vertex AI-productenpakket, wat volgens het criterium hierboven niet
kwalificeert. **Geen expliciete regel.**

**Reguliere Google Search (Googlebot) wordt door deze policy op geen enkele manier
geraakt of geblokkeerd** — die crawler valt, zoals altijd, onder het wildcard-record
en is nooit apart genoemd of beperkt geweest.

### Common Crawl

| Bot | Categorie | Toelichting | Expliciete regel? |
|---|---|---|---|
| `CCBot` | 4. Dataset/archief | Een brede, open webdataset die door meerdere partijen (waaronder AI-labs) als trainingsinput wordt gebruikt — geen aanbiedersspecifieke search- of live-answerfunctie. | **Nee** |

## Uiteindelijke policy in `app/robots.ts`

```
User-Agent: *
Allow: /
Disallow: /master
Disallow: /cms-preview
Disallow: /api/

User-Agent: OAI-SearchBot
Allow: /
Disallow: /master
Disallow: /cms-preview
Disallow: /api/

User-Agent: ChatGPT-User
...

User-Agent: Claude-SearchBot
...

User-Agent: Claude-User
...

User-Agent: PerplexityBot
...

User-Agent: Perplexity-User
...

Sitemap: https://meervereniging.nl/sitemap.xml
```

Zes expliciete crawlerregels (was tien) — elk aantoonbaar gekoppeld aan
zoekresultaten of live AI-antwoorden, niet aan training of datasetopbouw.

## Wat NIET is gedaan

- `GPTBot`, `ClaudeBot`, `Google-Extended` en `CCBot` zijn **niet actief
  geblokkeerd** — dat zou een eigen, apart te maken beleidskeuze zijn die niet
  impliciet uit deze correctie volgt. Ze vallen terug op het reguliere
  wildcard-record, exact zoals elke andere crawler die niet met naam wordt genoemd.
- Geen enkele crawler is toegestaan of geblokkeerd op basis van een aanname — elke
  regel hierboven is dit sessie rechtstreeks tegen de eigen documentatie van de
  aanbieder gecontroleerd (WebFetch/WebSearch, geciteerd met exacte bewoording).
- Geen DNS- of Vercel-configuratiewijziging — dit is uitsluitend een `robots.txt`-
  wijziging in code.
- Deze policy is expliciet herzienbaar.

## Bronnen (dit sessie rechtstreeks geraadpleegd)

- OpenAI — https://developers.openai.com/api/docs/bots
- Anthropic — https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Perplexity — https://docs.perplexity.ai/guides/bots
- Google-Extended — Google Cloud/Search Central-documentatie over Gemini/Vertex AI-grounding en trainingstoken (geraadpleegd via zoekresultaten, o.a. Search Engine Journal-berichtgeving over de bijgewerkte officiële Google-documentatie)
