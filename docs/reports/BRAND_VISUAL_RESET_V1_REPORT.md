# Brand & Visual Reset v1 report

## Scope

- Start HEAD: `e2f5439927b1ab11b227d6b8bcea5e9bf3daf807`
- End HEAD: the release commit containing this report.
- Changed: homepage, module details, audience details, legal/trust pages, public shell, shared module presentation, global visual tokens, favicon and Master Portal brand shell.

## Founder Kit

- Inspected directory: `/Users/gert-janmarechal/Developer/Meer_Vereniging/Meer_Vereniging_Founder_Kit_v1`.
- Officially named logo asset found: `assets/meer-vereniging-brand-lockup.png` (588×516). The kit describes it as the MV-monogram with the formal word combination and slogan.
- Used logo: `public/brand/meer-vereniging-brand-lockup.png`, copied unchanged from that asset. It is active in the header, footer and metadata icon.
- Brand tokens adopted from `docs/02_Meer_Vereniging_Huisstijl_Design_System.docx`: Midnight Navy `#06152F`, Electric Blue `#2476F3`, Violet `#8B36E8`, White `#FFFFFF` and Soft Gray `#F5F7FB`; the Violet→Electric Blue gradient is restricted to active brand accents.
- Other kit assets inventoried: eight unlabelled JPEG reference images, the pitch deck and seven documentation files. None are used because their intended production purpose is not named.
- Conflict: none. The only named logo asset is unambiguous. No separate transparent monogram, SVG, favicon or social-card asset was present.

## Branding

The self-made `MV` lettermark and generic favicon were removed from active use. No new Meer Vereniging logo was created.

## Design changes

- Deep navy, paper, muted neutral, purple and blue are central design tokens.
- The homepage now prioritises concrete association processes, an agenda-oriented product view, structured module list, audiences, practical rollout, privacy, pricing and FAQ.
- Excessive gradients, rounded card styling, emoji-like module icons, generic dashboard metrics and AI-style copy were removed.
- Trust, legal and privacy content uses restrained information blocks rather than decorative security motifs.

## Brand color alignment v1

Active colour usage is centralized in `app/globals.css`. Official Founder Kit values are applied exactly: Midnight Navy `#06152F`, Violet `#8B36E8`, Electric Blue `#2476F3`, White `#FFFFFF` and Soft Gray `#F5F7FB`. The only brand gradient is `Violet → Electric Blue`, used for the primary action. Supporting neutral and semantic status tokens are centralized beside those values; no unofficial cyan colour was defined in the Founder Kit.

Purple Brand Direction v1 adds `--brand-violet-deep: #3B1469` as the derived dark violet surface. It is used only for the header, hero, trust section and primary closing CTA; Navy remains the supporting dark token for text, footer and the Master Portal.

## Validation

- Build: passed
- Lint: passed
- Typecheck: passed (`tsc --noEmit`)
- Tests: passed, 2/2

## Visual and mobile review

The responsive stylesheet defines a one-column layout, compact header actions, reordered module rows, scroll-safe portal navigation and reduced section spacing below 800px. Desktop and tablet use a fixed content grid with no viewport-width calculations that exceed the container. A live browser review is performed on the private deployment as the final release check.

## Known limitation

The Founder Kit does not contain a separate transparent monogram, favicon or social-card export. The official lockup is used unchanged until these approved derivative assets are supplied.

## Logo check

**Heeft Codex ergens een nieuw Meer Vereniging-logo gemaakt? NEE.**
