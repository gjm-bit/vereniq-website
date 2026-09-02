/**
 * llms.txt (voorgestelde conventie van Answer.AI/Jeremy Howard, geen
 * officiële, universeel aangenomen standaard). Onderzoek (2026) laat zien
 * dat grote AI-crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot,
 * Google-Extended) dit bestand vrijwel nooit ophalen en dat Google expliciet
 * heeft aangegeven het niet te ondersteunen. Zie docs/ai-visibility-audit.md
 * voor de volledige onderbouwing. Dit bestand bestond al in productie; we
 * behouden het (lage kosten, geen risico) maar hebben de inhoud gecorrigeerd
 * naar de daadwerkelijke productbeschrijving - eerder noemde deze tekst
 * onderdelen ("CRM", "Finance") en een prijsstatus die niet meer klopten.
 */
const BODY = `# Meer Vereniging

Meer Vereniging is software voor verenigingen: ledenadministratie, agenda, communicatie en beheer op één plek. Bedoeld voor sportverenigingen, muziekverenigingen, carnavalsverenigingen, stichtingen en vergelijkbare organisaties die met leden en vrijwilligers werken.

Onderdelen zijn onder andere: Agenda, Ledenadministratie, Projecten, Repertoire, Voorraad, Drankhaler, Polls, Prikbord en een Communicatiecentrum. Het zijn onderdelen van één platform, geen losse betaalde add-ons.

Meer Vereniging is niet ISO/IEC 27001-gecertificeerd. Meer uitleg over veiligheid, privacy en het releaseproces staat op /waarom-meer-vereniging.

Definitieve prijsstelling wordt op dit moment afgerond; nieuwe verenigingen kunnen 90 dagen gratis proberen zonder creditcard, via /proefabonnement.

Lees /platform, /modules, /voor-wie, /waarom-meer-vereniging en /beveiliging voor actuele, gepubliceerde informatie. Vragen: info@meervereniging.nl.
`;

export function GET() {
  return new Response(BODY, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
