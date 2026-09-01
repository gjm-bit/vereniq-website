# Bekend issue: .section-mist heeft een sitebreed contrastprobleem

Gevonden tijdens de visuele acceptatie van PR #6 (2026-09-01), niet door die
PR veroorzaakt en niet in die PR opgelost.

## Wat is het probleem

Elke sectie met `className="section section-mist"` rendert lichte
tekst (wit/lichtgrijs) op een lichte achtergrond — vrijwel onleesbaar. De
oorzaak ligt in de CSS-cascade: meerdere van de 20 in `app/layout.tsx`
geïmporteerde stylesheets definiëren elk hun eigen `:root`-kleurvariabelen
(`--brand-surface`, `--brand-text`, ...), en de later geladen bestanden
(bijvoorbeeld `dark-premium-v2.css`) overschrijven de vroegere zonder dat
elke sectievariant daar consistent rekening mee houdt.

## Waar het al zichtbaar is

Bevestigd op de al live `/platform`-pagina, sectie "Onderdelen van één
platform" (`.module-list`/`.module-row`, ook binnen `.section-mist`) — dus
een bestaand productieprobleem, onafhankelijk van de nieuwe
"Waarom Meer Vereniging?"-pagina.

## Wat er in PR #6 is gedaan

Uitsluitend vermeden: de nieuwe pagina gebruikt nergens `.section-mist` (elke
sectie gebruikt de al bewezen leesbare, gewone `.section`-variant op de
donkere achtergrond). Niet gefixed — dat raakt gedeelde, sitewide CSS
(mogelijk meerdere `:root`-definities in meerdere bestanden) en verdient een
eigen, gerichte ronde met een volledige audit van alle 20 geïmporteerde
stylesheets, niet een spot-fix binnen een contentpagina-PR.

## Voorstel voor een vervolgronde

1. Inventariseer alle `:root`-blokken in de 20 bestanden die
   `app/layout.tsx` importeert en welke variabelen elkaar overschrijven.
2. Bepaal het bedoelde eindresultaat (is de site bedoeld als volledig donker
   canvas, met `.section-mist` als de uitzondering — of andersom).
3. Fix `.section-mist`/`.section-soft` zodat de tekstkleur binnen die
   sectievariant altijd correct contrasteert met de achtergrond, ongeacht
   welk stylesheet toevallig als laatste laadt.
4. Hertest minimaal `/platform` en elke andere pagina die `.section-mist`
   gebruikt.
