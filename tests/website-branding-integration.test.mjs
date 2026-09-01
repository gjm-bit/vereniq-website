import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// WEBSITEBEHEER — dynamisch website-icoon, gedeeld header/footer-logo,
// headertekst en footertekst (2026-09-01). Deze tests draaien tegen de
// echte, gebouwde worker (npm run build moet eerst zijn uitgevoerd - zelfde
// harnas als tests/rendered-html.test.mjs). Er is in deze testomgeving geen
// bereikbare Supabase-instantie, dus elke publieke RPC-aanroep faalt en
// valt terug op de bestaande, hardcoded standaardwaarden - dat is precies
// wat hier bewezen wordt: het "RPC (nog) niet beschikbaar"-pad blijft de
// website exact zoals hij vandaag is, zonder flash of kapotte weergave.
// Het "RPC beschikbaar met een eigen waarde"-pad kan zonder een live
// database niet end-to-end getest worden; dat is contractueel bewezen via
// de source-inspection-tests hieronder en via de Beheer-tests die de
// migratie/servicecode zelf controleren.

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("favicon: /site-icon valt terug op het huidige, bestaande standaardicoon zolang er geen eigen icoon is ingesteld (of de RPC nog niet beschikbaar is)", async () => {
  const response = await render("/site-icon");
  assert.equal(response.status, 307);
  assert.match(response.headers.get("location") ?? "", /\/brand\/meer-vereniging-brand-lockup\.png$/);
});

test("favicon: layout.tsx verwijst naar de dynamische route, niet rechtstreeks naar een vaste afbeelding - zo kan wisselen van icoon zonder nieuwe build/deploy", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /icons: \{ icon: "\/site-icon", shortcut: "\/site-icon" \}/);
});

test("favicon: geen client-side DOM-hack - de route is een server-side Route Handler, geen script dat achteraf <link rel=\"icon\"> vervangt", async () => {
  const route = await readFile(new URL("../app/site-icon/route.ts", import.meta.url), "utf8");
  assert.match(route, /export async function GET\(/);
  assert.doesNotMatch(route, /document\.querySelector|getElementById|createElement\('link'\)/);
});

test("favicon: gebruikt dezelfde geautoriseerde, publieke leesroute als het logo (organization-branding, signed URL) - geen aparte opslag/bucket", async () => {
  const publicCms = await readFile(new URL("../src/lib/public-cms.ts", import.meta.url), "utf8");
  assert.match(publicCms, /getSignedOrganizationBrandingAssetUrl/);
  const matches = publicCms.match(/getSignedOrganizationBrandingAssetUrl\(/g) ?? [];
  assert.ok(matches.length >= 3, "verwacht hergebruik door zowel het logo (getOrganizationFooterData) als het icoon (getWebsiteFaviconUrl)");
});

test("header: bestaande naam en tekst blijven de default zolang er geen eigen waarde is ingesteld (of de RPC nog niet beschikbaar is)", async () => {
  const html = await (await render()).text();
  assert.match(html, /aria-label="Meer Vereniging — homepage"/);
  assert.match(html, /Minder regelen\.<\/span>|Minder regelen\./);
});

test("header: logo is één gedeelde instelling - zelfde databron (getOrganizationFooterData/logoUrl) voor header én footer, geen tweede uploadpad", async () => {
  const siteShell = await readFile(new URL("../src/components/site-shell.tsx", import.meta.url), "utf8");
  assert.match(siteShell, /function HeaderBrand\(\{ footer \}: \{ footer: OrganizationFooterData \| null \}\)/);
  assert.match(siteShell, /footer\?\.logoUrl/);
  const logoUrlUsages = siteShell.match(/footer\?\.logoUrl/g) ?? [];
  assert.ok(logoUrlUsages.length >= 2, "verwacht footer?.logoUrl zowel in HeaderBrand als in FooterOrganization");
});

test("header: mobiele en desktopheader gebruiken dezelfde acties-bron - Header() haalt de lijst één keer op en geeft hem door aan zowel de desktopknoppen als MobileMenu", async () => {
  const siteShell = await readFile(new URL("../src/components/site-shell.tsx", import.meta.url), "utf8");
  assert.match(siteShell, /const actions = remoteActions \?\? FALLBACK_HEADER_ACTIONS;/);
  assert.match(siteShell, /<MobileMenu actions=\{actions\}\/>/);
  const mobileMenu = await readFile(new URL("../src/components/mobile-menu.tsx", import.meta.url), "utf8");
  assert.match(mobileMenu, /actions: readonly WebsiteHeaderAction\[\]/);
  assert.doesNotMatch(mobileMenu, /"Inloggen"|"Probeer gratis"/, "mobiel menu mag de knoppen niet nogmaals hardcoderen naast de gedeelde actions-prop");
});

test("footer: bestaande omschrijving blijft de default zolang er geen eigen tekst is ingesteld (of de RPC nog niet beschikbaar is)", async () => {
  const html = await (await render()).text();
  assert.match(html, /Software voor verenigingen die overzicht willen houden in hun dagelijkse organisatie\./);
});

test("footer: social media komt uitsluitend uit het generieke socialmodel, geen aparte/dubbele configuratie in de footerkaart", async () => {
  const siteShell = await readFile(new URL("../src/components/site-shell.tsx", import.meta.url), "utf8");
  assert.match(siteShell, /socialLinks !== null\s*\n\s*\? <FooterSocialGeneric links=\{socialLinks\} \/>/);
  assert.doesNotMatch(siteShell, /public_description.*facebook|facebook.*public_description/is, "publicDescription en social-config horen niet in dezelfde bron gemengd te worden");
});

test("genericiteit: geen enkele hardcoded Meer Vereniging-organisatie-id in de publieke datalaag - alles loopt via CMS_ORGANIZATION_SLUG, een toekomstige andere website kan zijn eigen slug meegeven", async () => {
  const publicCms = await readFile(new URL("../src/lib/public-cms.ts", import.meta.url), "utf8");
  assert.doesNotMatch(publicCms, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, "geen hardcoded organisatie-uuid in de publieke CMS-laag");
  assert.match(publicCms, /const CMS_ORGANIZATION_SLUG = process\.env\.NEXT_PUBLIC_CMS_ORGANIZATION_SLUG/);
});

test("bestaande routes/regressies blijven groen: homepage, prijspagina's en juridische pagina's renderen nog steeds 200 na deze uitbreiding", async () => {
  for (const path of ["/", "/platform", "/modules", "/voor-wie", "/prijzen", "/privacy"]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
  }
});
