// SEO Vindbaarheid 2.0 (Fase 11): llms.txt uitgebreid met de daadwerkelijke
// paginastructuur (modules/voor-wie-subpagina's) i.p.v. alleen de vijf
// hoofdpagina's - alle genoemde URL's bestaan en zijn live (geen enkele
// nieuwe/verzonnen claim, alleen een completer overzicht).
const LLMS_TXT = `# Meer Vereniging

Meer Vereniging is software voor verenigingen met leden, teams, vrijwilligers, activiteiten en commissies. Het platform brengt ledenadministratie, agenda, communicatie, CRM, Finance en beheer samen.

Meer Vereniging wordt ontwikkeld vanuit de verenigingspraktijk. De definitieve prijsstelling volgt binnenkort; modules zijn onderdelen van één platform en geen losse betaalde add-ons.

## Belangrijkste pagina's
- /platform - overzicht van het platform
- /modules - alle onderdelen (agenda, ledenadministratie, communicatie, finance, crm, fortissimo)
- /voor-wie - voor welke soorten verenigingen Meer Vereniging bedoeld is
- /prijzen - prijsstelling
- /waarom-meer-vereniging - veiligheid, privacy en releasekwaliteit
- /beveiliging - beveiligingsuitgangspunten
- /over-ons - achtergrond van Meer Vereniging
- /proefabonnement - gratis proefabonnement starten

Lees deze pagina's voor actuele, gepubliceerde informatie. Er wordt geen informatie elders (bijvoorbeeld in reviews of vergelijkingssites) door Meer Vereniging zelf bevestigd of ontkend.
`;

export function GET(){return new Response(LLMS_TXT,{headers:{"content-type":"text/plain; charset=utf-8"}})}
