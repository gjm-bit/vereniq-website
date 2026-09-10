import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// SEO VINDBAARHEID 2.0 - dekt de technische SEO-fixes van de nightshift:
// canonical tags, gedupliceerde title-bug, ontbrekende metadata op modules-
// en /app-routes, sitemap-correcties, de crawl-trap-fix op /voor-wie/[slug],
// en sitewide OpenGraph/Twitter-defaults. Zelfde stijl als de bestaande
// testsuite: statische broncode-analyse (geen SSR-render nodig).

// Alleen hele commentaarregels strippen - een naïeve trailing-"//"-strip
// zou "https://schema.org" in de JSON-LD-code zelf kapotmaken.
const stripComments = (source) => source.split("\n").map((line) => (line.trim().startsWith("//") ? "" : line)).join("\n");
const read = async (relativePath) => stripComments(await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"));

test("app/layout.tsx: sitewide OpenGraph/Twitter-defaults met een echt merkbeeld (geen verzonnen productscreenshot)", async () => {
  const source = await read("app/layout.tsx");
  assert.match(source, /openGraph:\s*{/);
  assert.match(source, /twitter:\s*{/);
  assert.match(source, /brand\/meer-vereniging-brand-lockup\.png/);
});

test("app/voor-wie/page.tsx: title bevat niet meer de dubbele merknaam (het sitebrede template voegt \"| Meer Vereniging\" al toe)", async () => {
  const source = await read("app/voor-wie/page.tsx");
  assert.doesNotMatch(source, /title:"Voor wie \| Meer Vereniging"/);
  assert.match(source, /alternates:\{canonical:"\/voor-wie"\}/);
});

test("app/modules/[slug]/page.tsx: heeft nu generateMetadata + canonical + BreadcrumbList JSON-LD (voorheen volledig afwezig)", async () => {
  const source = await read("app/modules/[slug]/page.tsx");
  assert.match(source, /export async function generateMetadata/);
  assert.match(source, /alternates:\{canonical:`\/modules\/\$\{m\.slug\}`\}/);
  assert.match(source, /BreadcrumbList/);
});

test("app/app/page.tsx: heeft nu generateMetadata (voorheen volledig afwezig, viel terug op generieke sitebrede titel)", async () => {
  const source = await read("app/app/page.tsx");
  assert.match(source, /export async function generateMetadata/);
  assert.match(source, /alternates:\s*\{\s*canonical:\s*"\/app"\s*\}/);
});

test("app/over-ons-contact/page.tsx: heeft nu een eigen generateMetadata (voorheen erfde deze route geen metadata van het component dat ze rendert)", async () => {
  const source = await read("app/over-ons-contact/page.tsx");
  assert.match(source, /export async function generateMetadata/);
  assert.match(source, /generateCommercialMetadata/);
});

test("app/[...slug]/page.tsx en app/page.tsx: generateMetadata geeft altijd een canonical terug", async () => {
  const catchAll = await read("app/[...slug]/page.tsx");
  assert.match(catchAll, /alternates:\s*\{\s*canonical\s*\}/);
  const home = await read("app/page.tsx");
  assert.match(home, /alternates:\{canonical:"\/"\}/);
});

test("app/voor-wie/[slug]/page.tsx: onbekende doelgroep-slug geeft 404, geen stille 200 met generieke inhoud (crawl-trap-fix)", async () => {
  const source = await read("app/voor-wie/[slug]/page.tsx");
  assert.doesNotMatch(source, /\|\|\s*\{title:"verenigingen"/, "de oude generieke fallback-content mag niet meer bestaan");
  assert.match(source, /if \(!a\) notFound\(\);/);
});

test("app/voor-wie/[slug]/page.tsx: kleine-verenigingen (senioren/buurt/hobby/cultureel) bestaat en is vanaf de hub gelinkt (geen orphan page)", async () => {
  const detail = await read("app/voor-wie/[slug]/page.tsx");
  assert.match(detail, /"kleine-verenigingen":\s*\{/);
  const hub = await read("app/voor-wie/page.tsx");
  assert.match(hub, /'kleine-verenigingen'/);
});

test("app/kennisbank/page.tsx: tijdelijk noindex zolang er 0 artikelen zijn (dunne-content-fix), maar follow blijft aan", async () => {
  const source = await read("app/kennisbank/page.tsx");
  assert.match(source, /robots:\{index:false,follow:true\}/);
});

test("app/sitemap.ts: geen verzonnen identieke lastModified meer, kennisbank uitgesloten, waarom-meer-vereniging en /app toegevoegd", async () => {
  const source = await read("app/sitemap.ts");
  assert.doesNotMatch(source, /lastModified/, "geen lastModified-veld meer i.p.v. een onjuiste, identieke datum voor elke URL");
  assert.match(source, /filter\(p=>p\.slug!=="kennisbank"\)/);
  assert.match(source, /waarom-meer-vereniging/);
  assert.match(source, /STATIC_ROUTES.*"\/app"/s);
});

test("app/llms.txt/route.ts: verwijst naar alleen bestaande, echte pagina's (geen verzonnen URL's)", async () => {
  const source = await read("app/llms.txt/route.ts");
  const referencedPaths = [...source.matchAll(/- (\/[a-z-]*)/g)].map((match) => match[1]);
  assert.ok(referencedPaths.length >= 5, "llms.txt moet meerdere pagina's noemen");
  const realRoutes = ["/platform", "/modules", "/voor-wie", "/prijzen", "/waarom-meer-vereniging", "/beveiliging", "/over-ons", "/proefabonnement"];
  for (const path of referencedPaths) {
    assert.ok(realRoutes.includes(path), `${path} moet een echte, bestaande route zijn`);
  }
});
