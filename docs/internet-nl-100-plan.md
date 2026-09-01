# Internet.nl — plan naar 100% voor meervereniging.nl

Onderzoek uitgevoerd op 2026-09-01. **Geen enkele wijziging uit dit document is
al doorgevoerd** — dit is uitsluitend onderzoek en een plan. Elke rij met
"GO nodig: JA" vereist een aparte, expliciete GO van Gert-Jan voordat hij wordt
uitgevoerd, en de meeste raken productie-DNS of -infrastructuur direct.

## Huidige score

**86%** — permalink (bewaar dit exacte rapport als referentie):
https://internet.nl/site/meervereniging.nl/4268782/ (getest 2026-09-01 15:42 UTC)

| Hoofdcategorie | Uitslag |
|---|---|
| Modern adres (IPv6) | ❌ Gezakt |
| Domeinnaam ondertekend (DNSSEC) | ✅ Geslaagd |
| Beveiligde verbinding (HTTPS) | ✅ Geslaagd (2 suggesties binnen deze categorie, zie tabel) |
| Beveiligingsopties | ⚠️ Suggestie (security headers + security.txt) |
| Route-autorisatie (RPKI) | ✅ Geslaagd |

## Volledige bevindingentabel

| Onderdeel | Huidige status | Internet.nl-bevinding | Oorzaak | Benodigde wijziging | Waar uitvoeren | Risico | Productie-impact | GO nodig |
|---|---|---|---|---|---|---|---|---|
| IPv6 (webserver) | Gezakt | "IPv6-adressen voor webserver" gezakt; nameservers hebben wél IPv6 | De webserver (Vercel-edge voor dit domein) heeft geen IPv6-adres gepubliceerd voor dit domein | Vercel moet IPv6 aanbieden voor het custom domain, of er moet een IPv6-fähige proxy/CDN vóór de huidige setup komen | VERCEL (platforminstelling, mogelijk buiten klantcontrole op het huidige plan) / EXTERNE INFRASTRUCTUUR | Middel — een verkeerd geconfigureerde AAAA-record of proxy kan het domein onbereikbaar maken | Hoog — raakt de live routing van het hele domein | **JA** |
| DNSSEC | Geslaagd | Volledig geslaagd, geen actie | — | Geen | — | — | — | Nee (niets te doen) |
| HTTPS beschikbaar/doorverwijzing/HSTS/TLS-versie/cipher suites | Geslaagd | Volledig geslaagd | — | Geen | — | — | — | Nee |
| Publieke sleutel van certificaat | Suggestie | RSA-2048 gebruikt; NCSC-richtlijn adviseert ≥3072 bit (of ECDSA) op termijn | Vercel/Let's Encrypt geeft standaard een RSA-2048-certificaat uit voor dit domein | Certificaat met sterkere sleutel laten uitgeven (ECDSA of RSA≥3072) | VERCEL (automatisch certificaatbeheer — niet direct door ons te kiezen op het standaardpad) | Laag-middel — certificaatwissel kan kort verbindingsimpact geven | Middel — raakt TLS voor het hele domein | **JA** |
| CAA voor domein | Suggestie | Geen CAA-record aanwezig | Nooit ingesteld | CAA-record toevoegen dat de gebruikte CA (Let's Encrypt, door Vercel gebruikt) autoriseert | DNS / DOMEINPROVIDER | Laag — een verkeerd ingesteld CAA-record kan certificaatvernieuwing blokkeren als de verkeerde CA wordt toegestaan | Middel — fout kan toekomstige certificaatvernieuwing breken | **JA** |
| X-Frame-Options | Geslaagd | Volledig geslaagd | — | Geen | — | — | — | Nee |
| X-Content-Type-Options | Geslaagd | Volledig geslaagd | — | Geen | — | — | — | Nee |
| Content-Security-Policy | Suggestie | `style-src 'self' 'unsafe-inline'` bevat `'unsafe-inline'`, internet.nl adviseert dit te verwijderen | De huidige CSP staat inline `<style>`/`style=`-gebruik toe via `unsafe-inline` in plaats van nonces/hashes | `unsafe-inline` uit `style-src` verwijderen; inline styles vervangen door externe CSS of CSP-nonces/hashes | CODE (CSP-configuratie + mogelijk inline-`style`-gebruik in de React-componenten) | Middel-hoog — deze codebase gebruikt inline `style={{...}}` op meerdere plekken; een te strikte CSP kan styling breken zonder zorgvuldige migratie | Middel — verkeerd toegepast breekt zichtbare opmaak sitebreed | **JA** |
| Referrer-Policy | Informatie | `strict-origin-when-cross-origin` aanwezig (browserdefault, "Waarschuwing"-tier); internet.nl telt volledige punten pas bij `no-referrer`/`same-origin` | Header nooit expliciet naar de striktere waarde gezet | `Referrer-Policy: no-referrer` of `same-origin` toevoegen | CODE (dezelfde plek als de CSP-header) | Laag — kan analytics/referrer-afhankelijke logica raken (voor zover aanwezig) | Laag | **JA** |
| security.txt | Informatie | Bestand bestaat al en is geldig; 2 verbeteradviezen | `Encryption`-veld ontbreekt (verplicht aanbevolen bij een e-mailadres in `Contact`); bestand is niet PGP-ondertekend | `Encryption`-veld toevoegen; bestand PGP-ondertekenen | CODE (bestand) + een PGP-sleutel moet eerst worden aangemaakt/beheerd | Laag qua site, middel qua operationele last (sleutelbeheer, iemand moet de sleutel bewaren/roteren) | Laag | **JA** |
| RPKI | Geslaagd | Volledig geslaagd | — | Geen | — | — | — | Nee |

## Samenvatting eigenaarschap

- **VERCEL**: IPv6 op de webserver, certificaat-sleutelsterkte — grotendeels platformkeuzes, mogelijk (deels) buiten directe controle op het huidige Vercel-plan; vereist onderzoek bij Vercel zelf of dit uberhaupt instelbaar is voor dit domein/plan.
- **DNS / DOMEINPROVIDER**: CAA-record.
- **CODE**: CSP (`unsafe-inline` verwijderen), Referrer-Policy-header, security.txt-verbeteringen.
- Geen enkel punt valt onder Supabase-mutaties.

## Realistisch pad

1. IPv6 is de enige echte "Gezakt"-categorie en waarschijnlijk de zwaarste
   om op te lossen, omdat dit buiten de applicatiecode ligt (Vercel-platform).
   Dit bepaalt of 100% op korte termijn haalbaar is.
2. CAA is de laagste-risico, snelste winst (één DNS-record), maar blijft een
   DNS-wijziging op een live productiedomein — vereist een eigen GO en een
   rustig moment, niet gecombineerd met andere wijzigingen.
3. CSP (`unsafe-inline` verwijderen) is de meest risicovolle codewijziging
   in deze lijst: vereist eerst een inventarisatie van alle inline
   `style={{...}}`-gebruik in de vereniq-website-codebase en een aparte
   test/acceptatieronde vóórdat dit ooit naar productie mag, los van deze
   pagina.
4. Referrer-Policy en de security.txt-verfijningen zijn laag risico maar
   ook laag prioriteit; kunnen samen met de CSP-wijziging in één latere,
   aparte PR.

Geen van deze vier punten is dit sessie uitgevoerd. Elk vereist een eigen,
expliciete GO — dit document is uitsluitend het onderzoek en de kaart naar
100%, geen uitvoering.
