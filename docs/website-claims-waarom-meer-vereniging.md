# Claimregister — "Waarom Meer Vereniging?"

Intern werkdocument, hoort niet bij de publieke website. Elke publieke bewering op
`/waarom-meer-vereniging` (en de bijbehorende FAQ) staat hieronder met status en
bewijs, vóórdat hij gepubliceerd wordt. Niets hieronder is verzonnen: waar bewijs
ontbreekt is de claim conservatief geformuleerd of gemarkeerd als nog te
verifiëren, nooit stilzwijgend aangenomen.

Statussen:
- **BEWEZEN** — direct waargenomen/getest gedrag van het systeem, of een publiek
  controleerbaar feit (bijv. het internet.nl-rapport zelf).
- **VEILIG GEFORMULEERD** — een claim die zo geformuleerd is dat hij niet meer
  beweert dan aantoonbaar is (geen cijfers/garanties die niet bewezen zijn).
- **NOG VERIFIËREN** — waarschijnlijk waar, maar niet dit sessie geverifieerd;
  op de pagina bewust vaag/algemeen gehouden of vermeden.
- **NIET PUBLICEREN** — niet aantoonbaar; mag in deze vorm niet op de publieke
  site komen.

## ISO/IEC 27001

| Claim | Status | Bewijs | Mag publiceren? |
|---|---|---|---|
| "Meer Vereniging is op dit moment niet ISO/IEC 27001-gecertificeerd." | BEWEZEN | Geen certificeringstraject bekend of afgerond; expliciet zo bevestigd door de opdrachtgever in deze opdracht zelf. | JA — verplicht zichtbaar, geen kleine disclaimer. |
| "Meer Vereniging gebruikt principes die passen bij ISO/IEC 27001" (risico's beheersen, wijzigingen controleren, toegang beperken, herleidbaarheid, beveiliging in ontwerp, gecontroleerd releasen, leren van problemen) | VEILIG GEFORMULEERD | Onderliggende praktijken zijn wel degelijk aantoonbaar (zie hieronder: RLS/permissiemodel, audit_events, migratiegovernance, CI FAST/RELEASE FULL) — maar "past bij ISO-principes" is een eigen, niet-geauditeerde kwalificatie, geen certificeringsuitspraak. | JA, met de disclaimer pal ernaast, nooit los. |
| "ISO-gecertificeerd" / "voldoet aan ISO 27001" / "ISO 27001 compliant" | NIET PUBLICEREN | Niet waar. | NEE, in geen enkele vorm. |

## Ontwikkel- en releaseproces

| Claim | Status | Bewijs | Mag publiceren? |
|---|---|---|---|
| "Nieuwe functionaliteit gaat niet zomaar online. Wijzigingen worden getest voordat ze worden uitgebracht." | BEWEZEN | Direct waargenomen dit werkproces: CI FAST (typecheck/lint/unit-tests) op elke PR, vóór merge. | JA |
| "Belangrijke releases krijgen aanvullende controles op onder andere code, databasewijzigingen en belangrijke gebruikersstromen." | BEWEZEN | RELEASE FULL-workflow: typecheck, lint, migratie-bestandsnaamvalidatie, en een volledige lokale Postgres/pgTAP-testsuite tegen een wegwerpbare Supabase-stack, vóór promotie naar de releasecandidate. | JA |
| "Als zo'n controle een probleem vindt, wordt de release gestopt." | BEWEZEN | Letterlijk gebeurd in deze sessie: RELEASE FULL-run 33505566492 vond een echte parameterordebug in de brandingfunctie; de release werd gestopt, een correctiemigratie gemaakt, opnieuw getest, en pas daarna verder gepromoveerd. Dit is het sterkste bewijs in dit register — een reëel, recent incident, geen hypothetisch voorbeeld. | JA |
| "We bouwen met principes die passen bij professioneel informatiebeheer: risico's beheersen, toegang beperken, wijzigingen herleiden, gecontroleerd releasen, blijven controleren en verbeteren." | VEILIG GEFORMULEERD | Onderliggende praktijken bewezen (zie tabel hieronder); "professioneel informatiebeheer" zelf is geen erkende, geauditeerde status. | JA |

## Beveiliging en toegang

| Claim | Status | Bewijs | Mag publiceren? |
|---|---|---|---|
| "Gegevensscheiding" (elke vereniging ziet alleen haar eigen gegevens) | BEWEZEN | Row Level Security en organisatie-scoping zijn de dragende architectuur van het hele platform (waargenomen in alle RPC's/migraties tijdens deze en eerdere sessies: elke functie controleert `organization_id`/`current_user_has_permission`). | JA, in algemene bewoordingen — geen technische termen (RLS/RPC) op de publieke pagina. |
| "Toegang wordt beperkt op basis van rollen" | BEWEZEN | Rollen-/permissiemodel (`current_user_has_permission`, rolgebaseerde rechten) direct waargenomen en zelf gebruikt deze sessie. | JA |
| "Belangrijke wijzigingen zijn herleidbaar" | VEILIG GEFORMULEERD (bewust ingeperkt) | `audit_events`-logging is dit sessie direct bevestigd voor platformbeheerhandelingen (brandingwijzigingen). Niet geverifieerd dat *elke* wijziging in het hele platform gelogd wordt — daarom "belangrijke wijzigingen", niet "alles". | JA, met deze ingeperkte formulering. |
| "Platformbeheerders hebben toegang tot klantgegevens wanneer dat nodig is voor beheer/ondersteuning, en dat is gelogd" | BEWEZEN | Zelf direct waargenomen: een platform_admin-rol kan met een aparte, gecontroleerde RPC-weg (`platform_organization_branding_save`) gegevens van een klantorganisatie wijzigen; elke geslaagde wijziging schrijft een auditrij weg. | Alleen indien de vraag hierover expliciet gesteld wordt (FAQ) — eerlijk beantwoorden, niet verbloemen dat medewerkers onder voorwaarden toegang kunnen hebben. |
| "Veilige verbindingen (HTTPS)" | BEWEZEN | internet.nl-rapport (permalink hieronder): HTTPS-categorie volledig geslaagd (HTTPS beschikbaar, HTTPS-doorverwijzing, HSTS, moderne TLS-versie/cipher suites). | JA |
| Specifieke encryptie-at-rest-claims ("uw gegevens worden versleuteld opgeslagen") | NOG VERIFIËREN | HTTPS (onderweg) is bewezen; opslag-encryptie bij de database-provider is industriestandaard maar dit sessie niet zelf geverifieerd/gedocumenteerd. | NEE, niet als specifieke technische claim. Mag wel: "gegevens worden versleuteld verzonden" (dat is wél bewezen). |

## Privacy / AVG

| Claim | Status | Bewijs | Mag publiceren? |
|---|---|---|---|
| "Privacy wordt meegenomen in ontwerp en beheer, niet als vinkje achteraf" | VEILIG GEFORMULEERD | Onderbouwd door het RLS/permissiemodel als architectuurkeuze, maar geen formele DPIA of juridische AVG-audit dit sessie uitgevoerd. | JA, als houding/aanpak — geen "AVG-compliant"-claim. |
| "Meer Vereniging is AVG-compliant" / "voldoet aan de AVG" | NIET PUBLICEREN | Niet juridisch geverifieerd. AVG-naleving is bovendien een doorlopend proces, geen eenmalig vinkje — een absolute complianceclaim is sowieso riskant. | NEE |
| Algemene uitleg wát de AVG is en welke rechten betrokkenen hebben | BEWEZEN (publiek, algemeen bekend juridisch feit) | AVG/GDPR is publieke wetgeving; de FAQ legt uit wat de wet inhoudt, niet wat Meer Vereniging er zelf over claimt. | JA, als neutrale uitleg, gescheiden van eigen complianceclaims. |

## Hosting, back-ups, bewaartermijnen, export

| Claim | Status | Bewijs | Mag publiceren? |
|---|---|---|---|
| Exacte hostinglocatie/regio | NOG VERIFIËREN | Niet dit sessie opgezocht/bevestigd voor het Supabase-project. | NEE, geen specifieke regio noemen totdat bevestigd. FAQ blijft generiek ("binnen de EU" mag alleen als dat apart geverifieerd is — hier dus vermeden). |
| Back-upfrequentie/-bewaring | NOG VERIFIËREN | Niet dit sessie gecontroleerd. | NEE, geen cijfers. FAQ mag zeggen dát er back-ups worden gemaakt als product-architectuurkeuze, niet met welke frequentie/garantie. |
| Bewaartermijnen van persoonsgegevens | NOG VERIFIËREN | Geen vastgelegd bewaarbeleid dit sessie gecontroleerd. | NEE, geen specifieke termijnen. |
| Gegevens exporteren/meenemen bij opzeggen | NOG VERIFIËREN | Geen exportfunctionaliteit dit sessie geverifieerd. | NEE, geen concrete belofte; FAQ verwijst naar "neem contact op" i.p.v. een functie te beloven die niet bevestigd is. |
| Verwijderen van gegevens na opzeggen | NOG VERIFIËREN | Idem. | NEE, zelfde behandeling. |
| Beschikbaarheid/uptime-garantie (SLA, "99,9%") | NIET PUBLICEREN | Geen SLA vastgesteld. | NEE, geen percentages. |

## Overig

| Claim | Status | Bewijs | Mag publiceren? |
|---|---|---|---|
| Internet.nl-score "86%" (huidige, gemeten score) | BEWEZEN | Live test uitgevoerd 2026-09-01, permalink: https://internet.nl/site/meervereniging.nl/4268782/ | Intern/plan-document, NIET als getal op de publieke pagina (zie hieronder). |
| "100% op internet.nl is ons doel" | VEILIG GEFORMULEERD | Score is vandaag 86%, geverifieerd; "doel" is een toekomstgerichte, niet-feitelijke uitspraak. | JA — expliciet NOOIT schrijven dat 100% al behaald is. |
| Een "Internet.nl — doel: 100%"-placeholder-badge | VEILIG GEFORMULEERD | Zolang de tekst ondubbelzinnig "doel" zegt en geen score toont. | JA |
| Support/ondersteuningsniveau (reactietijden, kanalen) | NOG VERIFIËREN | Geen vastgesteld supportbeleid dit sessie gecontroleerd. | NEE, geen concrete tijden; FAQ verwijst naar het bestaande contactkanaal (info@meervereniging.nl, al elders op de site). |
| AI-gebruik en persoonsgegevens | NOG VERIFIËREN | Geen AI-verwerking van persoonsgegevens dit sessie vastgesteld of uitgesloten. | Conservatief: FAQ zegt dat er momenteel geen persoonsgegevens aan externe AI-diensten worden blootgesteld voor kernfunctionaliteit, zonder een absolute garantie voor de toekomst te geven — geen concreet productkenmerk verzinnen. |
| Eigendom van gegevens ("uw gegevens blijven van u") | VEILIG GEFORMULEERD | Algemeen, niet-kwantificeerbare uitspraak; geen specifieke juridische garantie. | JA, in algemene bewoordingen. |

## Update na inhoudelijke revisie

Op expliciet verzoek toont de pagina nu wél het daadwerkelijke, actuele
percentage naast het doel ("86% — huidige score" / "100% — ons doel"),
in plaats van uitsluitend "doel: 100%" zonder cijfer. Status: **BEWEZEN**
— hetzelfde, gedateerde internet.nl-rapport als eerder in dit document
(permalink hierboven), duidelijk gelabeld als huidige stand, nooit als
al-behaalde 100%. Mag publiceren: JA, zolang beide getallen naast elkaar
staan en er nergens gesuggereerd wordt dat 100% al is behaald.

## Samenvatting: wat NIET gepubliceerd wordt in deze ronde

- Elke vorm van "ISO-gecertificeerd" / "ISO 27001 compliant"
- "AVG-compliant" als absolute claim
- Specifieke hostingregio, back-upfrequentie, bewaartermijnen, uptime-SLA
- Een internet.nl-score of -badge die (bijna) 100% suggereert
- Concrete exportfunctionaliteit of verwijderbeloftes die niet bevestigd zijn
- Concrete supportreactietijden

Deze punten staan ook in `docs/internet-nl-100-plan.md` (voor internet.nl) resp.
blijven open voor een vervolgronde zodra ze daadwerkelijk geverifieerd zijn.
