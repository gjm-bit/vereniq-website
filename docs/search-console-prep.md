# Google Search Console — voorbereiding

Intern werkdocument. **Dit sessie is er geen account gekoppeld en geen verificatie
uitgevoerd** — dat vereist een bewuste GO en een echt verificatietoken, geen van
beide hoort bij een nightshift zonder toezicht. Dit document beschrijft alleen de
aanbevolen vervolgstappen.

## Welke property toevoegen

**URL-prefix property voor `https://meervereniging.nl/`** (niet een Domain-property).
Een Domain-property dekt alle subdomeinen/protocollen automatisch, maar **vereist
DNS TXT-record-verificatie** — expliciet buiten de scope van deze opdracht (geen
DNS-wijzigingen toegestaan). De site serveert canoniek uitsluitend
`https://meervereniging.nl` (geen www-variant, geen los http-protocol in gebruik),
dus een URL-prefix-property dekt in de praktijk alles wat er is.

## Aanbevolen verificatiemethode

**HTML meta tag**, via Next.js' `metadata.verification.google`-veld in
`app/layout.tsx`. Dit rendert `<meta name="google-site-verification" content="...">`
en is een pure repo-codewijziging — geen DNS nodig, en werkt direct na de eerstvolgende
deploy. Het alternatief (HTML-bestand uploaden naar `public/`) werkt ook, maar de
meta-tag-methode is eenvoudiger te onderhouden binnen dezelfde `layout.tsx` waar de
overige metadata al staat.

**Belangrijk**: er is dit sessie **bewust geen placeholder-token toegevoegd** aan de
code. Een verzonnen/fictief token zou niets doen behalve een vals gevoel van
voorbereiding geven, en de instructie was expliciet om dit niet te doen. De echte
stap is:

1. Gert-Jan (of wie de property aanmaakt) opent Google Search Console, voegt de
   URL-prefix-property `https://meervereniging.nl/` toe, kiest de
   "HTML tag"-verificatiemethode, en kopieert de gegenereerde `content`-waarde.
2. Die waarde wordt toegevoegd aan `app/layout.tsx`:
   ```ts
   export const metadata: Metadata = {
     // ...bestaande velden
     verification: { google: "HET_ECHTE_TOKEN_HIER" },
   };
   ```
3. Committen, PR, en pas na de eerstvolgende productiedeploy op "Verifiëren" klikken
   in Search Console.

## Sitemap indienen

Na verificatie: `https://meervereniging.nl/sitemap.xml` indienen via
Search Console → Sitemaps. De sitemap is dit sessie uitgebreid (zie
`docs/seo-ai-visibility-audit.md` §4) met de eerder ontbrekende routes.

## Belangrijke URL's om na verificatie handmatig te inspecteren

Prioriteit, in volgorde van belang voor vindbaarheid:

1. `/` (homepage)
2. `/platform`
3. `/waarom-meer-vereniging`
4. `/modules`
5. `/prijzen` (let op: bevat momenteel nog "prijsstelling komt binnenkort" — opnieuw
   inspecteren zodra de definitieve prijsstelling live staat, de content verandert
   dan wezenlijk)
6. `/voor-wie` en de vijf doelgroeppagina's daaronder
7. `/proefabonnement`

Gebruik de URL Inspection-tool per pagina om te bevestigen dat Google de canonical,
title en meta-description correct oppikt zoals dit sessie geïmplementeerd (zie
`docs/seo-ai-visibility-audit.md` §3).
