# IndexNow

Intern werkdocument. Toegevoegd: 2026-09-03/04 (nightshift-sessie op branch
`feat/seo-ai-nightshift-20260903`). Basis: `origin/main` @
`60d9f2c025710d86df939e3f8c11ec12a1e3aed8`.

## 1. Status vóór deze wijziging

IndexNow bestond niet in deze repo (geen sleutelbestand, geen submission-code,
geen route, geen tests) - geverifieerd via een volledige grep op "indexnow" in
`app/`, `src/`, `public/` en `api/`, nul treffers. Dit document/deze
implementatie is dus nieuw, geen herbouw van iets bestaands.

## 2. Wat IndexNow wel en niet is

IndexNow (https://www.indexnow.org) is een open protocol - één submission
naar één deelnemend eindpunt (`api.indexnow.org`) wordt gedeeld met alle
deelnemende zoekmachines: **Bing, Yandex** en enkele kleinere. **Google
ondersteunt IndexNow niet** - Google blijft afhankelijk van reguliere crawling
+ de al bestaande Search Console-sitemap-indiening. IndexNow is dus specifiek
de sectie 20 (Bing/Copilot readiness)-hefboom uit de opdracht, geen
Google-hefboom.

## 3. Architectuur (deze repo)

- **Sleutelbestand**: `public/1f34f0e5c1d3b6ebbfc1c09ab79cca80.txt` - bevat
  exact de 32-hex-teken-sleutel, geen trailing newline, conform de
  IndexNow-specificatie (`https://<host>/<key>.txt`). Dit is **geen geheim**:
  de spec vereist juist dat dit bestand publiek ophaalbaar is, dat is hoe een
  zoekmachine bevestigt dat de indiener ook de sitebeheerder is. Gecommit als
  gewoon static asset in `public/`, geen route-logica nodig.
- **`src/config/crawl-policy.ts`** (nieuw, gedeeld met `app/robots.ts`):
  `DISALLOWED_PATH_PREFIXES` (`/master`, `/cms-preview`, `/api/`) en
  `isDisallowedPath()`. Vóór deze wijziging stond deze lijst alleen lokaal in
  `app/robots.ts`; nu is er precies één plek, zodat robots.txt en IndexNow
  nooit uit elkaar kunnen lopen over wat "privé" is.
- **`src/lib/server/indexnow.ts`** (nieuw): `isSubmittableUrl()` /
  `partitionSubmittableUrls()` (host moet `site.url` zijn, geen
  private/CMS/beheer/API-pad, geen statisch bestand/asset) en
  `submitToIndexNow(urls)` - POST naar `https://api.indexnow.org/indexnow`
  met `{ host, key, keyLocation, urlList }`, gebatcht (max 2000 URL's per
  aanroep, de spec staat tot 10.000 toe), 8s timeout via `AbortController`,
  vangt élke fout op (netwerk/timeout/non-2xx) en faalt nooit hard - een
  IndexNow-storing mag de normale sitewerking nooit raken. Logging bevat
  alleen tellingen/status, geen individuele URL's of response-bodies.
- **`app/api/indexnow/submit/route.ts`** (nieuw): `POST`-trigger-route,
  uitsluitend bruikbaar met het juiste `x-indexnow-trigger-secret`-header
  (vergeleken via SHA-256-hashvergelijking i.p.v. directe `===`, tegen
  timing-gebaseerd raden), gevalideerd tegen de server-only env var
  `INDEXNOW_TRIGGER_SECRET`. Zonder die env var: **503, uitgeschakeld** (geen
  onbedoeld openstaande endpoint als niemand deze feature configureert).
  Body: `{ "urls": string[] }` - expliciete lijst van daadwerkelijk
  gewijzigde/nieuwe publieke URL's. Optioneel `?mode=full`: dient de complete
  huidige sitemap in (voor eerste inrichting/een volledige resync) -
  bewust **niet** het standaardpad, om te voorkomen dat een verkeerd/leeg
  aanroep per ongeluk de hele site herindient. De route zelf valt al onder de
  bestaande `Disallow: /api/`-regel in robots.txt.

## 4. Wat hier NIET gebouwd is (buiten scope van deze repo)

Er bestaat in deze website-repo geen "content is zojuist gepubliceerd"-event
- publiceren gebeurt in het aparte Websitebeheer-apprepo (`meer-vereniging`
platform, off-limits voor deze opdracht). Om IndexNow daadwerkelijk
automatisch te laten afgaan bij een echte publicatie is in dát repo een
uitgaande webhook nodig:

1. Na een succesvolle publish/unpublish/URL-wijziging in Websitebeheer:
   `POST https://meervereniging.nl/api/indexnow/submit`
   met header `x-indexnow-trigger-secret: <dezelfde waarde als INDEXNOW_TRIGGER_SECRET>`
   en body `{ "urls": ["https://meervereniging.nl/<gewijzigd-pad>"] }`.
2. Best-effort/fire-and-forget: een falende aanroep mag de publicatieflow in
   Websitebeheer zelf niet blokkeren of tonen als fout aan de redacteur -
   dezelfde "IndexNow-storing breekt nooit het echte werk"-regel als in deze
   repo.
3. `INDEXNOW_TRIGGER_SECRET` moet als environment variable in het
   Websitebeheer-apprepo/-project staan (Vercel), gelijk aan de waarde die
   hier in het `meer-vereniging`-website-Vercel-project staat. Nooit
   hardcoden.

Dit is **niet** tijdens deze nightshift gebouwd (zou een wijziging in het
off-limits apprepo vereisen) - zie eindrapport, sectie K (open punten).

## 5. Handmatig testen (na een bewuste GO, NIET tijdens deze nightshift)

```
curl -s https://meervereniging.nl/1f34f0e5c1d3b6ebbfc1c09ab79cca80.txt
# verwacht: exact "1f34f0e5c1d3b6ebbfc1c09ab79cca80", geen extra tekens

curl -s -X POST https://meervereniging.nl/api/indexnow/submit \
  -H "x-indexnow-trigger-secret: <secret>" \
  -H "content-type: application/json" \
  -d '{"urls":["https://meervereniging.nl/platform"]}'
```

Er is tijdens deze nightshift **geen echte productie-submission** gedaan
(dat zou `INDEXNOW_TRIGGER_SECRET` in productie vereisen, wat niet is gezet,
en zou hoe dan ook een productiemutatie-achtige actie zijn - buiten de scope
van een read-only/lokale nightshift).

## 6. Sleutelrotatie

1. Genereer een nieuwe 8-128-teken-hexadecimale sleutel.
2. Commit een nieuw `public/<nieuwe-sleutel>.txt`-bestand (mag naast het oude
   bestaan, geen probleem).
3. Zet `INDEXNOW_KEY=<nieuwe-sleutel>` in de Vercel-projectinstellingen
   (Production + relevante Preview-omgevingen).
4. Pas na een succesvolle deploy: verwijder het oude sleutelbestand (niet
   eerder - anders kan een zoekmachine die net de oude sleutel gebruikte de
   verificatie niet meer ophalen).
