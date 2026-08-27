# Reference Visual Match v1

## Scope

The supplied reference was used as the visual benchmark for the public website only. Existing routes, copy, links, content structure and the approved Founder Kit lockup remain unchanged. No CMS, pricing, white-label or product functionality was changed.

## Reference analysis and applied system

- **Canvas:** near-black navy `#020610`, with restrained navy surfaces and subtle grid texture.
- **Accent language:** official violet `#8B36E8` and electric blue `#2476F3`, limited to gradients, hairlines, badges and primary actions.
- **Hero:** oversized uppercase white headline, compact intro, clear action group and an abstract in-development construction form. The form deliberately remains non-product UI.
- **Surfaces:** compact dark panels with fine violet/blue borders, 12px corners and no generic light cards.
- **Rhythm:** tighter header, benefits separated by fine lines, a compact contact CTA and a restrained footer divider.
- **Typography:** the existing type stack is retained; hierarchy, scale, tracking and contrast were adjusted to match the reference's editorial, premium feel.

## Components aligned

- Header, navigation and primary CTA receive the dark premium treatment while their routes stay unchanged.
- The temporary development hero uses the same dark, violet/blue construction language as the reference without adding fictional product screens.
- Principle blocks, cards, module rows, CTA band and footer share a single dark surface, border and radius system.
- The existing official Founder Kit logo remains unchanged. Its supplied PNG includes a light background; no substitute or logo reinterpretation was introduced.

## Visual review

Screenshots were captured in the in-app browser against the production alias after deployment.

| Area | Score / 10 | Review |
| --- | ---: | --- |
| Color system | 9 | Deep navy canvas with restrained official violet/blue accents. |
| Hero hierarchy | 8 | Strong oversized heading and clear actions; different copy is intentionally preserved. |
| Typography | 8 | Clear display hierarchy and compact supporting copy. |
| Cards and panels | 8 | Consistent dark surfaces, fine borders and quieter radii. |
| CTA system | 9 | Gradient primary action and outline secondary action match the reference language. |
| Section rhythm | 8 | Hero, benefits, CTA and footer use a compact visual cadence. |
| Footer | 8 | Dark, separated and visually integrated without changing content. |
| Overall match | 8 | The visual language matches while preserving the existing temporary development content and avoiding fictional UI. |

- **Desktop 1440px:** reviewed; hero fills the viewport without horizontal overflow.
- **Mobile 390px:** reviewed; hero, menu and content stack cleanly without horizontal overflow.
- **Intentional differences:** the reference's phone/product renders were not copied because this scope forbids fictional product UI. The supplied official logo asset contains its own light background and was retained unchanged.

## Validation

- Build: passed (`npm run build`)
- Lint: passed (`npm run lint`)
- Typecheck: passed (`npx tsc --noEmit`)
- Tests: passed — 4/4 (`npm test`)
- Link audit: public navigation, CTA and footer link tests passed; no newly introduced internal 404 routes.

## Deployment

- Production deployment: `dpl_Au8gyTEZcP7eDqjZgaNibQZP2n3Z`
- Deployment URL: `https://meer-vereniging-nm3y2459o-feestbende.vercel.app`
- Production alias: `https://meervereniging.nl`
- Status: READY; homepage was loaded and reviewed on production.
