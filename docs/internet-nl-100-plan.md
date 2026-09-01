# Internet.nl — plan naar 100% voor meervereniging.nl

Onderzoek uitgevoerd op 2026-09-01, verdiept op dezelfde dag na visuele
acceptatie van PR #6. **Geen DNS-, CSP- of Vercel-productiewijziging uit dit
document is doorgevoerd.** Eén item (Referrer-Policy) is wél lokaal op de
branch voorbereid en gecommit, omdat het aantoonbaar veilig, standards-
compliant is en geen productgedrag raakt — zie FASE 6 hieronder. Elke andere
rij met "GO nodig: JA" vereist een aparte, expliciete GO.

## Huidige score

**86%** — ongewijzigd sinds het eerste onderzoek. Permalink:
https://internet.nl/site/meervereniging.nl/4268782/ (getest 2026-09-01 15:42 UTC)

| Hoofdcategorie | Uitslag |
|---|---|
| Modern adres (IPv6) | ❌ Gezakt |
| Domeinnaam ondertekend (DNSSEC) | ✅ Geslaagd |
| Beveiligde verbinding (HTTPS) | ✅ Geslaagd (2 suggesties binnen deze categorie) |
| Beveiligingsopties | ⚠️ Suggestie (security headers + security.txt) |
| Route-autorisatie (RPKI) | ✅ Geslaagd |

## Onderscheid: zelf oplosbaar vs. platform-afhankelijk

### ZELF OPLOSBAAR (DNS of code, binnen ons mandaat)
- CAA (DNS, TransIP)
- Referrer-Policy (code, vercel.json) — **lokaal al voorbereid, zie FASE 6**
- security.txt-verfijningen (code, maar geblokkeerd op een echte PGP-sleutel — zie FASE 6)
- Content-Security-Policy `unsafe-inline` (code, maar structureel geblokkeerd — zie FASE 5)

### PLATFORM-AFHANKELIJK (Vercel, mogelijk buiten ons mandaat)
- IPv6 op de webserver
- Certificaatsleutelsterkte (RSA-2048 → ECDSA/RSA≥3072)

## Volledige bevindingentabel

| Onderdeel | Blokkeert score of alleen aanbeveling? | Effect op score | Strikt nodig voor 100%? | Zonder functionele regressie mogelijk? | Oorzaak | Benodigde wijziging | Waar uitvoeren | Risico | Productie-impact | GO nodig |
|---|---|---|---|---|---|---|---|---|---|---|
| IPv6 (webserver) | **Blokkeert** (categorie "Gezakt") | Grootste; één hele hoofdcategorie op onvoldoende | Ja | Onbekend — afhankelijk van Vercel, niet door ons te testen zonder het echt te doen | Vercel-edge voor dit domein publiceert geen AAAA-record (bevestigd: `dig AAAA meervereniging.nl` geeft niets terug, nameservers zelf hebben wél IPv6) | Vercel moet IPv6 aanbieden voor dit custom domain, of een IPv6-fähige laag ervoor | VERCEL / EXTERNE INFRASTRUCTUUR | Middel — een verkeerd AAAA-record kan het domein onbereikbaar maken | Hoog — raakt live routing van het hele domein | **JA** |
| Certificaatsleutel (RSA-2048) | Alleen aanbeveling ("uit te faseren", nog niet "onvoldoende") | Klein | Nee, pas op termijn ("in een toekomstige update waarschijnlijk onvoldoende") | Onbekend — certificaatuitgifte is volledig Vercel/Let's Encrypt-geautomatiseerd | Vercel/Let's Encrypt geeft standaard RSA-2048 uit | Certificaat met ECDSA of RSA≥3072 | VERCEL (automatisch beheerd, niet direct instelbaar) | Laag-middel — certificaatwissel kan kort verbindingsimpact geven | Middel | **JA** |
| CAA voor domein | Alleen aanbeveling (suggestie) | Klein-middel | Ja, voor een volledig groene "Beveiligde verbinding"-subsectie | **Ja** — zie concreet advies hieronder | Nooit ingesteld (bevestigd: `dig CAA meervereniging.nl` geeft niets terug) | CAA-record(s) toevoegen die de gebruikte CA autoriseren | DNS / TransIP (huidige nameservers: ns0.transip.net, ns1.transip.nl, ns2.transip.eu) | Laag, mits het juiste CA-domein wordt gebruikt — zie risicosectie | Middel — fout kan toekomstige certificaatvernieuwing breken | **JA** |
| Content-Security-Policy (`unsafe-inline` in style-src) | Alleen aanbeveling (suggestie) | Klein-middel | Ja, voor een volledig groene "Beveiligingsopties"-subsectie | **Nee, niet zonder architectuurwijziging** — zie root cause hieronder | Zie FASE 5-analyse | `unsafe-inline` uit `style-src` verwijderen | CODE (proxy.ts + sitewide inline-style-gebruik) | Middel-hoog | Hoog — verkeerd toegepast breekt zichtbare opmaak sitebreed, inclusief CMS-content | **JA** |
| Referrer-Policy | Was "Informatie" (geen directe scoreblokkade, wel gemiste punten) | Klein | Nee, maar wel voor volledige punten in die subsectie | **Ja — al gedaan** | Stond expliciet op `strict-origin-when-cross-origin` (browserdefault-waarde, "Waarschuwing"-tier) in vercel.json | → `no-referrer` (hoogste "Goed"-tier) | CODE (vercel.json) | Laag — geen enkele referrer-afhankelijke logica in de codebase (geverifieerd) | Laag | **JA voor deploy, maar lokaal al voorbereid/gecommit** |
| security.txt | Was "Informatie" (bestand bestaat al, geldig) | Klein | Nee | **Nee, niet zonder een echte PGP-sleutel** | `Encryption`-veld ontbreekt; bestand niet ondertekend | PGP-sleutel aanmaken/beheren, `Encryption`-veld toevoegen, bestand ondertekenen | CODE + sleutelbeheer (mensbeslissing, geen technische taak alleen) | Laag qua site, middel qua operationele last | Laag | **JA (én eerst een sleutelbeheerbeslissing)** |
| DNSSEC, HTTPS-kern, X-Frame-Options, X-Content-Type-Options, RPKI | Al volledig geslaagd | Geen | — | — | — | Geen | — | — | — | Nee |

## FASE 4 — CAA, concreet advies

- **Huidige DNS-status:** geen CAA-record (bevestigd via `dig CAA meervereniging.nl`, leeg resultaat). A-records: `216.150.1.1`, `216.150.16.1`. Geen AAAA-record (bevestigt het IPv6-probleem ook op DNS-niveau). Nameservers: TransIP (`ns0.transip.net`, `ns1.transip.nl`, `ns2.transip.eu`).
- **Daadwerkelijk gebruikte CA:** bevestigd via het live certificaat (`openssl s_client`): `issuer=C=US, O=Let's Encrypt, CN=YR1` — Let's Encrypt, automatisch uitgegeven via Vercel's ingebouwde certificaatbeheer.
- **Aanbevolen CAA-record(s):**
  ```
  meervereniging.nl. CAA 0 issue "letsencrypt.org"
  meervereniging.nl. CAA 0 issuewild ";"
  meervereniging.nl. CAA 0 issuemail ";"
  ```
  (`issuewild`/`issuemail` leeg = geen wildcard- of S/MIME-certificaten toegestaan, conform internet.nl's eigen aanbeveling — er wordt momenteel geen wildcardcertificaat gebruikt, subject op het certificaat is exact `meervereniging.nl` zonder `*`.)
- **Risico op blokkeren van toekomstige certificaatvernieuwing:** reëel en het belangrijkste aandachtspunt. Vercel kan in de toekomst van CA wisselen (bijvoorbeeld naar ZeroSSL of Google Trust Services) voor load-balancing van certificaatuitgifte — dat is dit sessie niet bij Vercel zelf geverifieerd. Een CAA-record dat uitsluitend `letsencrypt.org` toestaat, zou een certificaatvernieuwing via een andere CA blokkeren en tot een verlopen-certificaat-incident kunnen leiden. **Aanbeveling: vóór het live zetten expliciet bij Vercel's actuele documentatie/support nagaan welke CA(‘s) zij daadwerkelijk (kunnen) gebruiken voor dit domein/plan, en zo nodig meerdere `issue`-regels opnemen.**
- **Validatieprocedure na wijziging:** (1) DNS-propagatie afwachten (TransIP TTL); (2) `dig CAA meervereniging.nl` controleren; (3) een internet.nl-hertest draaien en bevestigen dat de CAA-subsectie op "Geslaagd" staat; (4) een handmatige certificaatvernieuwing/-controle bij Vercel niet forceren, maar het eerstvolgende automatische vernieuwingsmoment volgen en bevestigen dat het certificaat geldig blijft.
- **Geen DNS-write uitgevoerd deze ronde.**

## FASE 5 — CSP, root cause en conclusie

- **Root cause geverifieerd (proxy.ts):** `script-src` gebruikt al een correcte per-request nonce (`'nonce-${nonce}'`, geen `unsafe-inline`) — alleen `style-src 'self' 'unsafe-inline'` is nog open.
- **Omvang geverifieerd:** 25 plekken met `style={{...}}` in 11 bestanden, waaronder `src/components/site-shell.tsx` (Header/Footer, geladen op élke pagina) en `src/components/cms-public-page.tsx` (de generieke CMS-contentrenderer).
- **Kern van het probleem:** in `cms-public-page.tsx` zijn de inline styles niet incidenteel maar **dynamisch, CMS-beheerder-gestuurde waarden** — bijvoorbeeld `style={{ objectFit: image.objectFit ?? 'cover', objectPosition: image.focus?.replace('-',' ') ?? 'center' }}` voor een door de content-editor gekozen bijsnijdpunt van een afbeelding. Zulke waarden zijn niet vooraf bekend en kunnen dus niet in een vaste CSS-klasse of een statische CSP-hash worden vastgelegd — een CSP-nonce werkt bovendien alleen voor `<style>`-elementen, niet voor het `style="..."`-attribuut.
- **Regressierisico voor Turnstile:** geen — Turnstile draait via `script-src`/`frame-src`, niet via `style-src`; dit blijft ongemoeid.
- **Regressierisico voor bestaande styling:** hoog als `unsafe-inline` zonder meer verwijderd zou worden — elke CMS-pagina met een aangepast beeldbijsnijdpunt en de gedeelde header/footer-spacing zouden zichtbaar breken.
- **Conclusie: `unsafe-inline` is dit sessie NIET lokaal veilig te verwijderen.** Dit is een platform-/architectuurbeperking (de CMS ondersteunt admin-gestuurde inline styling), geen simpele opschoonactie. Er is geen geïsoleerde codevariant gemaakt — een gedeeltelijke/onveilige verwijdering zou een misleidend "opgelost" rapporteren terwijl de site elders breekt. Een echte oplossing vereist een aparte architectuurkeuze (bijvoorbeeld CSS custom properties + een vaste klasse in plaats van vrije `style`-objecten) en een eigen, grondige test-/acceptatieronde — buiten scope van deze pagina.

## FASE 6 — Referrer-Policy + security.txt

- **Referrer-Policy:** internet.nl's advies is `no-referrer` of `same-origin` (beide "Goed"-tier). Geverifieerd dat geen enkele plek in de codebase leunt op een aanwezige `document.referrer`-waarde — bestaande code doet juist het tegenovergestelde (`rel="noreferrer noopener"` op alle externe links, `referrer: "no-referrer"` al expliciet op de CMS-preview-fetch). **Lokaal doorgevoerd op deze branch:** `Referrer-Policy` in `vercel.json` aangepast naar `no-referrer` (was `strict-origin-when-cross-origin`), voor zowel de reguliere routes als de CMS-preview-route. Het bijbehorende testcontract (`tests/security-headers.test.mjs`) is bijgewerkt naar de nieuwe, bewust striktere waarde. Standards-compliant, geen productgedrag geraakt, build/lint/tests blijven groen. **Dit is een vercel.json-bestandswijziging op de branch — pas live na een reguliere Vercel-deploy, dus na een aparte GO voor deze PR/branch, niet vóór dat moment.**
- **security.txt:** beide resterende adviezen (een `Encryption`-veld, en een PGP-handtekening over het bestand) vereisen een echte PGP-sleutel die vandaag niet bestaat. Een sleutel *aanmaken* is geen zuiver technische taak — iemand moet de private sleutel genereren, veilig bewaren en op termijn roteren. Dat is een organisatorische beslissing, geen code-taak die ik zonder overleg kan/mag verzinnen. Niet voorbereid; geen placeholder-sleutel aangemaakt.

## Verwachte haalbaarheid 100%

- **Zonder IPv6:** 100% is niet haalbaar zolang de "Modern adres (IPv6)"-hoofdcategorie op "Gezakt" staat — dit weegt te zwaar. Dit is het enige punt dat een harde blokkade vormt en volledig bij Vercel ligt.
- **Met IPv6 opgelost, zonder CSP-fix:** een aanzienlijk hogere score is haalbaar (CAA + Referrer-Policy + certificaatsleutel zijn stuk voor stuk kleine, oplosbare punten), maar niet de volle 100% zolang de CSP-suggestie openstaat.
- **Volledige 100%:** vereist alle vier platform-onafhankelijke punten (CAA, Referrer-Policy ✅, CSP, security.txt) én de twee Vercel-afhankelijke punten (IPv6, certificaatsleutel). De CSP-fix is op zijn beurt de meest fundamentele: die vereist eerst een architectuurbeslissing over hoe CMS-admin-gestuurde styling zonder `unsafe-inline` kan, niet alleen een headerwijziging.

## Samenvatting eigenaarschap

- **VERCEL**: IPv6 op de webserver, certificaatsleutelsterkte.
- **DNS / TransIP**: CAA-record (concreet advies hierboven, nog niet uitgevoerd).
- **CODE**: Referrer-Policy (✅ lokaal voorbereid), CSP `unsafe-inline` (structureel geblokkeerd, geen lokale fix mogelijk), security.txt (geblokkeerd op een sleutelbeheerbeslissing).
- Geen enkel punt valt onder Supabase-mutaties.

Alleen Referrer-Policy is dit sessie daadwerkelijk (lokaal, op de branch)
doorgevoerd. IPv6, certificaatsleutel, CAA, CSP en security.txt blijven
allemaal open en vereisen elk een eigen, expliciete GO — de meeste ook een
aparte beslissing buiten pure code (Vercel-onderzoek, DNS-wijziging,
architectuurkeuze, of sleutelbeheer).
