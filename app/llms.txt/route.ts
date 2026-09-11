// SEO Vindbaarheid 2.0 (Fase 11): llms.txt uitgebreid met de daadwerkelijke
// paginastructuur (modules/voor-wie-subpagina's) i.p.v. alleen de vijf
// hoofdpagina's - alle genoemde URL's bestaan en zijn live (geen enkele
// nieuwe/verzonnen claim, alleen een completer overzicht).
//
// Vindbaarheid 3.2 (AI-vindbaarheidsaudit): twee bewezen correcties.
// - /over-ons verving door /over-ons-contact: /over-ons canonicaliseert
//   sinds de Vindbaarheid 3.0-URL-audit naar /over-ons-contact (bewezen
//   duplicate/orphan, zie app/[...slug]/page.tsx) - de eigen hoofdnavigatie
//   (src/config/site.ts) linkt uitsluitend naar /over-ons-contact.
// - /app toegevoegd: stond niet in deze lijst ondanks dat het al maanden
//   het eerste hoofdnavigatie-item is en de enige pagina die de echte,
//   screenshot-gebaseerde productervaring toont (card_grid/presentation:
//   "microdemo" op de gepubliceerde /mogelijkheden-CMS-pagina) - de
//   audit vond dit een concrete omissie, geen nieuwe claim: de
//   omschrijving hieronder is woordelijk gecontroleerd tegen de live
//   /app-pagina (dezelfde zes werelden: Agenda, Communicatie, Sport,
//   Muziek, Meer, Musical & Theater).
const LLMS_TXT = `# Meer Vereniging

Meer Vereniging is software voor verenigingen met leden, teams, vrijwilligers, activiteiten en commissies. Het platform brengt ledenadministratie, agenda, communicatie, CRM, Finance en beheer samen.

Meer Vereniging wordt ontwikkeld vanuit de verenigingspraktijk. De definitieve prijsstelling volgt binnenkort; modules zijn onderdelen van één platform en geen losse betaalde add-ons.

## Belangrijkste pagina's
- /app - Bekijk Meer Vereniging in actie met echte schermen van agenda, communicatie, sport, muziek en meer.
- /platform - overzicht van het platform
- /modules - alle onderdelen (agenda, ledenadministratie, communicatie, finance, crm, fortissimo)
- /voor-wie - voor welke soorten verenigingen Meer Vereniging bedoeld is
- /prijzen - prijsstelling
- /waarom-meer-vereniging - veiligheid, privacy en releasekwaliteit
- /beveiliging - beveiligingsuitgangspunten
- /over-ons-contact - achtergrond van Meer Vereniging
- /proefabonnement - gratis proefabonnement starten

Lees deze pagina's voor actuele, gepubliceerde informatie. Er wordt geen informatie elders (bijvoorbeeld in reviews of vergelijkingssites) door Meer Vereniging zelf bevestigd of ontkend.
`;

export function GET(){return new Response(LLMS_TXT,{headers:{"content-type":"text/plain; charset=utf-8"}})}
