# Dark Brand Canvas v1

## Scope

- Start HEAD: `7837b15600f64eba728ee7249e33ca55709103fd`.
- The story-driven homepage structure, copy, routes, SEO and product placeholders are unchanged.

## Brand canvas changes

- Header, hero, origin story and final CTA now use Midnight Navy `#06152F` as their shared dark canvas.
- Deep Violet `#3B1469` is removed from those dominant homepage surfaces.
- Violet `#8B36E8` and Electric Blue `#2476F3` remain limited to the official CTA gradient, accent rules and the origin mark.
- Dark-section eyebrow text is white for reliable small-text contrast; the official gradient appears only as a short decorative rule.
- Product placeholders remain unchanged in meaning and contain no fictional interface.

## Contrast review

Measured WCAG contrast ratios:

| Pair | Ratio | Use |
| --- | ---: | --- |
| White `#FFFFFF` on Navy `#06152F` | 18.17:1 | Headings and controls on dark canvas |
| Light neutral `#D9C8EE` on Navy `#06152F` | 11.63:1 | Supporting copy on dark canvas |
| Violet `#8B36E8` on Navy `#06152F` | 3.28:1 | Decorative accents only, never small text |
| Electric Blue `#2476F3` on Navy `#06152F` | 4.29:1 | Decorative accents only, never small text |

The primary CTA keeps the required official Violet → Electric Blue gradient with white, bold control text. Informational text on dark surfaces is white or light neutral; no small violet or blue text is used on Navy.

## Rendered validation

- Hero computed background: `rgb(6, 21, 47)` on 1440 px and 390 px (`#06152F`).
- Header computed background: `rgb(6, 21, 47)` on 1440 px and 390 px (`#06152F`).
- Desktop review: passed at 1440 px. The navy header and hero form one canvas; white type remains direct and product placeholders contain no fictional UI.
- Mobile review: passed at 390 px. Header and hero are navy, CTA controls stack clearly and there is no horizontal overflow (`scrollWidth: 390`, `clientWidth: 390`).
- Build: passed.
- Lint: passed.
- Typecheck: passed.
- Tests: passed, 2 of 2.
