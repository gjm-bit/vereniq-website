# Website Content & Commercial Foundation v1

## Scope

- Start HEAD: `6cb92222e6d3e81beb6732b2a28d215ad8a9eda5`.
- Commercial content only. The Dark Brand Canvas, routes, product placeholders, architecture, Supabase and Master Portaal foundation remain in scope-preserving state.

## Pricing implementation

- Central launch pricing configuration: `src/config/pricing.mjs`.
- One complete platform price, determined by association size:
  - €24,95/month: up to 50 people and up to 3 teams.
  - €44,95/month: 51–150 people or 4–9 teams.
  - from €99,95/month: more than 150 people or 10+ teams.
- Rule precedence matches the requested boundary conditions: a team threshold moves an association to the higher tier.
- Pricing is now central for later Website & Content / Master Portaal adapter management; it is not distributed through components.

## Adjusted public pages

- Homepage: pricing teaser now states “Eén prijs. Het hele platform.”
- Platform: explains one central environment and “Technisch modulair. Commercieel eenvoudig.”
- Modules and module details: positioned as parts of one platform, not separately priced add-ons.
- Audience pages: retained existing audiences and their specific processes.
- Prices: three visible launch tiers, pricing FAQ and demo CTA.
- About, contact, demo, privacy, legal, security and data storage: launch-ready, cautious copy; legal pages are explicitly marked `DRAFT — LEGAL REVIEW REQUIRED`.

## Removed old public price claims

- “Betaal voor wat je gebruikt.”
- “kies per module” / “kies de onderdelen die nodig zijn.”
- The previous implied modular commercial pricing strategy.

Module inventory unchanged: **JA**. Product placeholders intact: **JA**.

## SEO, AI/AEO and legal

- Added page-specific metadata for prices, platform/modules, module details and audience pages.
- Added Organization, WebSite and SoftwareApplication structured data.
- Updated `llms.txt` with server-rendered, factual product scope and launch pricing.
- Future knowledge-base topics are centrally listed but not automatically published.
- Legal review TODO remains for privacy, terms, cookies and processor content.

## Validation

- Build: **PASS** (`npm run build`).
- Lint: **PASS** (`npm run lint`).
- Typecheck: **PASS** (`npx tsc --noEmit`).
- Tests: **PASS**, 5/5 (`node --test tests/*.test.mjs`), including all requested person/team boundary conditions.
- Secret check: **PASS**. `.gitignore` excludes `.env*` (except `.env.example`), build output and Wrangler state; the changed and added files contain no credential patterns.
- Desktop review, 1440 × 900: homepage and `/prijzen` have navy header/hero (`rgb(6, 21, 47)`), show the intended headings and the three launch tiers; no horizontal overflow.
- Mobile review, 390 × 844: homepage and `/prijzen` remain readable, show the three launch tiers and have no horizontal overflow.
- Private deployment: **PASS** — version 13 from release commit `46d038a21ccb3141322303f713e10773689555e5` was deployed to `https://meer-vereniging.young-clove-6396.chatgpt.site`.
