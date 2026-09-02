# Claimregister — SEO/AI-vindbaarheid nightshift

Intern werkdocument, zelfde conventie als `docs/website-claims-waarom-meer-vereniging.md`.
Elke inhoudelijke tekstwijziging uit deze sessie staat hieronder met bron. Statussen:
**BEWEZEN** (direct geverifieerd feit of expliciet door Gert-Jan gegeven in deze
opdracht), **VEILIG GEFORMULEERD** (claim beweert niet meer dan aantoonbaar is),
**NIET GEWIJZIGD** (bestaande, al eerder onderbouwde claim, alleen elders herhaald).

## FAQ-antwoorden op /waarom-meer-vereniging

| Wijziging | Status | Bron |
|---|---|---|
| "Welke onderdelen zijn er?" noemt nu: Agenda, Ledenadministratie, Projecten, Repertoire, Voorraad, Drankhaler, Polls, Prikbord, Communicatiecentrum | BEWEZEN | Expliciet door Gert-Jan gegeven in deze opdracht ("Huidige belangrijke onderdelen zijn onder andere: ...") |
| "Hoe stap ik over?" noemt nu een importfunctie voor bestaande ledengegevens | BEWEZEN | Expliciet door Gert-Jan gegeven ("Er is een importfunctie voor bestaande ledengegevens.") |
| "Kunnen we onze gegevens meenemen als we stoppen?" antwoordt nu "Ja... kun je exporteren" | BEWEZEN | Expliciet door Gert-Jan gegeven ("Belangrijke gegevens kunnen worden geëxporteerd.") |
| "Wat gebeurt er met onze gegevens als we opzeggen?" noemt nu meewerken aan overdracht + AVG-verwijdering met bewaarplichten | BEWEZEN | Expliciet door Gert-Jan gegeven ("Bij vertrek werken we netjes mee aan gegevensoverdracht." / "Verwijdering van persoonsgegevens gebeurt volgens AVG en afspraken, rekening houdend met eventuele wettelijke bewaarplichten.") |
| "Hoe vaak brengen jullie updates uit" noemt nu push-meldingen, "Wat is nieuw" en e-mailaankondigingen voor nieuwe modules | BEWEZEN | Expliciet door Gert-Jan gegeven ("Updates kunnen via push en 'Wat is nieuw' worden gecommuniceerd." / "Nieuwe modules kunnen per e-mail worden aangekondigd.") én "Wat is nieuw"-functionaliteit is al eerder deze bredere sessie bevestigd live/gebouwd (zie projectgeheugen "Platform release read-state fix") |
| "Wat kost Meer Vereniging?" aangepast naar "prijsstelling wordt op dit moment afgerond" i.p.v. "actuele prijzen staan op de prijzenpagina" | BEWEZEN (correctie) | `/prijzen` zelf (`app/[...slug]/page.tsx`, `pageMeta.prijzen`) zegt al "Onze prijsstelling komt binnenkort" — de oude FAQ-tekst was feitelijk onjuist t.o.v. de eigen prijzenpagina. Dit is een correctie, geen nieuwe claim. |
| Internet.nl-sectie en -FAQ-antwoord: "Onze website scoort momenteel 86% bij Internet.nl. Alleen IPv6 ontbreekt nog. Dit wordt op dit moment nog niet ondersteund door onze hostingomgeving. Zodra dat verandert, pakken we ook dit laatste onderdeel aan." | BEWEZEN | Letterlijk aangeleverde tekst door Gert-Jan in deze opdracht; score 86% is het al eerder deze bredere sessie geverifieerde, actuele internet.nl-testresultaat (permalink in `docs/internet-nl-100-plan.md`) |
| "Een moderne verbinding" → hernoemd naar "Een betrouwbare verbinding", tekst "nieuwste internetstandaarden" verwijderd | VEILIG GEFORMULEERD (correctie) | De oude tekst ("bereikbaar via de nieuwste internetstandaarden") stond in tegenspraak met de expliciete IPv6-erkenning elders op dezelfde pagina — IPv6 is juist een moderne internetstandaard die (nog) ontbreekt. Nieuwe tekst noemt alleen DNSSEC, wat wél bewezen is (internet.nl: Geslaagd). |

## Metadata / SEO-teksten

| Wijziging | Status | Bron |
|---|---|---|
| `/modules`-metabeschrijving: "De losse onderdelen van het Meer Vereniging-platform. Gebruik alleen wat jouw vereniging nodig heeft." (i.p.v. "Agenda, ledenadministratie, communicatie, CRM, Finance en Fortissimo...") | VEILIG GEFORMULEERD (correctie) | Oude tekst noemde specifieke onderdeelnamen die niet overeenkomen met de door Gert-Jan bevestigde huidige onderdelenlijst; "Fortissimo" oogt als interne projectcodenaam. Nieuwe tekst is generiek en claimt geen specifieke onderdeelnamen die niet geverifieerd zijn voor déze pagina's onderliggende data. |
| `llms.txt`: onderdelenlijst nu Agenda/Ledenadministratie/Projecten/Repertoire/Voorraad/Drankhaler/Polls/Prikbord/Communicatiecentrum | BEWEZEN | Zelfde bron als de FAQ-onderdelenlijst hierboven |
| `llms.txt`: prijszin nu "Definitieve prijsstelling wordt op dit moment afgerond" (i.p.v. eerdere identieke, al langer stale tekst die toevallig nog klopte) | BEWEZEN | Zelfde bron als de `/prijzen`-pagina zelf |
| `llms.txt`: "Meer Vereniging is niet ISO/IEC 27001-gecertificeerd" | NIET GEWIJZIGD | Eerder deze bredere sessie al bevestigd en onderbouwd in `docs/website-claims-waarom-meer-vereniging.md` |
| Organization JSON-LD `sameAs` | BEWEZEN | Rechtstreeks, dynamisch opgehaald uit de bestaande, al productie-gebruikte CMS-social-kanalenbron (`getWebsiteSocialLinks`/`getOrganizationFooterData`) — geen enkele URL is handmatig ingevoerd of verzonnen |
| Organization JSON-LD `logo` | BEWEZEN | Verwijst naar een bestaand, echt merkasset (`public/brand/meer-vereniging-brand-lockup.png`), geen nieuw of gegenereerd beeld |

## Wat expliciet NIET is toegevoegd/beweerd

- Geen `aggregateRating`, `review`, `offers`/prijs in de `SoftwareApplication`
  structured data — er bestaat geen review- of prijsdata.
- Geen `google-site-verification`-token — zie `docs/search-console-prep.md`.
- Geen wijziging aan de onderliggende moduledata/detailpagina's zelf (alleen aan
  tekstuele metadata/omschrijvingen) — zie P0 in `docs/seo-ai-visibility-audit.md` §8.
- Geen specifieke hostingregio/leverancier genoemd in de Internet.nl-tekst (expliciet
  gevraagd om te vermijden).
