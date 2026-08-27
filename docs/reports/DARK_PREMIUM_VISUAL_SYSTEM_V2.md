# Dark Premium Visual System v2

## Actieve tokens

- Canvas: `#030914`, met `#06152F` en `#08172C` als sectieritme.
- Accenten: officieel Violet `#8B36E8` en Electric Blue `#2476F3` in één horizontale gradient.
- Tekst: wit, 78% wit voor bodycopy en 58% wit voor secundaire informatie.
- Surfaces: transparant donker `rgba(8, 22, 45, .82)` met subtiele violet/blauwe borders.

## Uitvoering

De publieke site gebruikt nu één gecentraliseerde dark-premium systeemlaag. Dit verwijdert de zichtbare witte cards, lichte secties en witte formulier-controls uit de publieke presentatie, zonder routes, content, contactgegevens of componentstructuur te wijzigen. Header, CTA's, cards, FAQ, formulieren, footer, kennisbank, prijzen en juridische pagina's volgen dezelfde donkere tokens.

## Review

- Desktop 1440: live gecontroleerd; de homepage heeft `rgb(3, 9, 20)` als canvas, witte tekst en donkere, transparante cards.
- Mobile 390: responsieve regels stapelen CTA's en footerlinks en behouden de bestaande mobiele menustructuur; geen vaste desktopbreedtes toegevoegd.
- Toegankelijkheid: primaire tekst is wit op het donker canvas; bodycopy gebruikt 78% wit; controls hebben een zichtbare blauwe focusring en invoervelden een contrastrijke focusborder.
- Geen fictieve productinterface, nieuwe content of productmockup toegevoegd.

## Technische gates

- Build: passed
- Lint: passed
- Typecheck: passed
- Tests: 4/4 passed
- Production deployment: `dpl_GSyfhg4dSr8y5K1Wgds4FqsPTY2T`
