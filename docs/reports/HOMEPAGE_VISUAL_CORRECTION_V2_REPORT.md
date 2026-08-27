# Homepage Visual Correction v2

## Scope

Gerichte correctie van de publieke homepage. Geen wijzigingen aan database, repositories, SEO-architectuur, Master Portaal, Supabase, RLS, authenticatie of andere functionaliteit.

## Rendered acceptance record

- Start HEAD: `7fb2ee68f6c845aa2a90bfd8df89de71bb7d6ac2`
- End HEAD: vastgelegd in de releasecommit die dit rapport bevat.
- Hero computed background: `rgb(59, 20, 105)` op 1440 px en 390 px (`#3B1469`).
- Header computed background: `rgb(59, 20, 105)` op 1440 px en 390 px (`#3B1469`).
- Fictieve agenda verwijderd: ja.
- Echte productscreenshot gebruikt: nee. Er is geen goedgekeurde, privacyveilige productscreenshot aangetroffen.
- Placeholder gebruikt: ja — rustige branded container met uitsluitend het officiële Founder Kit-logo en de interne markering `TODO: approved real product screenshot`.
- Desktop visueel gecontroleerd: ja, 1440 × 900. Header en hero zijn deep violet; headline is wit; CTA's tonen de gevraagde behandeling; de overgang naar de lichte sectie is zichtbaar; geen fictieve agenda.
- Mobiel visueel gecontroleerd: ja, 390 × 844. Hero en header zijn deep violet; headline en CTA's zijn leesbaar; de placeholder bevat geen fictieve productinterface; geen horizontale overflow (`scrollWidth: 390`, `clientWidth: 390`).
- Screenshots:
  - `docs/reports/homepage-visual-correction-v2-desktop.png`
  - `docs/reports/homepage-visual-correction-v2-mobile.png`

## Technische validatie vóór publicatie

- Build: geslaagd.
- Lint: geslaagd.
- Typecheck: geslaagd (`tsc --noEmit`).
- Tests: geslaagd, 2 van 2.
