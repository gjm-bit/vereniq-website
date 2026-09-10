import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// P0 MODULEPAGINA'S — ÉÉN BRON VAN WAARHEID. Dekt app/modules/[slug]/page.tsx:
// CMS-first met veilige localModules-fallback, exact hetzelfde patroon als
// app/platform/page.tsx en app/app/page.tsx. Zelfde stijl als de bestaande
// suite (statische broncode-analyse, geen netwerkafhankelijke tests) - zie
// tests/commercial-cms-routes.test.mjs voor het precedent.

const stripComments = (source) => source.split("\n").map((line) => (line.trim().startsWith("//") ? "" : line)).join("\n");
const read = async (relativePath) => stripComments(await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"));

test("gebruikt hetzelfde CMS-adapter-patroon als /platform en /app (geen tweede CMS-laag)", async () => {
  const source = await read("app/modules/[slug]/page.tsx");
  const platform = await read("app/platform/page.tsx");
  const appRoute = await read("app/app/page.tsx");
  assert.match(source, /import \{ getPublishedCmsPage \} from "@\/src\/lib\/public-cms"/);
  assert.match(source, /import \{ CmsPublicPageView \} from "@\/src\/components\/cms-public-page"/);
  // Zelfde adapter, niet een eigen kopie - alle drie roepen letterlijk dezelfde functie aan.
  assert.match(platform, /getPublishedCmsPage/);
  assert.match(appRoute, /getPublishedCmsPage/);
});

test("localModules blijft de enige bron voor geldige slugs - onbekende slug is altijd 404, ongeacht CMS", async () => {
  const source = await read("app/modules/[slug]/page.tsx");
  const bodyStart = source.indexOf("export default async function ModuleDetail");
  const body = source.slice(bodyStart);
  const localModulesCheckIndex = body.indexOf("localModules.getPublished(slug)");
  const notFoundIndex = body.indexOf("if (!m) return notFound()");
  const cmsCallIndex = body.indexOf("getPublishedCmsPage(");
  assert.ok(localModulesCheckIndex !== -1 && notFoundIndex !== -1 && cmsCallIndex !== -1, "alle drie de stappen moeten aanwezig zijn");
  assert.ok(localModulesCheckIndex < notFoundIndex, "de modulecatalogus-check moet vóór de 404-beslissing staan");
  assert.ok(notFoundIndex < cmsCallIndex, "de 404-beslissing moet vóór de CMS-aanroep staan - CMS wordt nooit geraadpleegd voor een ongeldige slug");
});

test("gepubliceerde, gevulde CMS-pagina wint - lege gepubliceerde pagina (0 blocks) telt als 'geen override'", async () => {
  const source = await read("app/modules/[slug]/page.tsx");
  assert.match(source, /if \(cmsPage && cmsPage\.blocks\.length > 0\)/, "een leeg gepubliceerd CMS-resultaat moet expliciet worden uitgesloten, anders zou een lege pagina getoond kunnen worden i.p.v. de werkende fallback");
});

test("CMS-fetch levert nooit een publieke 500 op - getPublishedCmsPage faalt altijd zacht naar null (bestaand, hergebruikt gedrag)", async () => {
  const publicCms = await read("src/lib/public-cms.ts");
  const fnStart = publicCms.indexOf("export async function getPublishedCmsPage");
  const fnEnd = publicCms.indexOf("\n}", fnStart);
  const fnBody = publicCms.slice(fnStart, fnEnd);
  assert.match(fnBody, /catch \{\s*return null;\s*\}/, "elke fout (netwerk/RPC) moet resulteren in null, nooit een onafgevangen exception");
});

test("CMS levert uitsluitend gepubliceerde content - draft/preview gebruikt een aparte, apart-beveiligde functie", async () => {
  const publicCms = await read("src/lib/public-cms.ts");
  const publishedFnStart = publicCms.indexOf("export async function getPublishedCmsPage");
  const publishedFnEnd = publicCms.indexOf("\n}", publishedFnStart);
  const publishedFnBody = publicCms.slice(publishedFnStart, publishedFnEnd);
  assert.match(publishedFnBody, /website_public_page/);
  assert.doesNotMatch(publishedFnBody, /website_preview_page|draft/i, "de publieke, gepubliceerde-paginafunctie mag nooit draft-content kunnen ophalen");
});

test("metadata: CMS SEO-velden hebben voorrang, canonical wijst altijd naar het eigen modulepad, nooit een lege fallback terwijl local.ts-data bestaat", async () => {
  const source = await read("app/modules/[slug]/page.tsx");
  const metaStart = source.indexOf("export async function generateMetadata");
  const metaEnd = source.indexOf("\n}", source.indexOf("export default"));
  const metaBody = source.slice(metaStart, metaEnd);
  assert.match(metaBody, /alternates:\s*\{\s*canonical\s*\}/, "canonical moet één gedeelde `canonical`-variabele gebruiken in beide takken - nooit per ongeluk twee verschillende waarden");
  assert.match(metaBody, /cmsPage\.seoTitle \?\? cmsPage\.title/);
  assert.match(metaBody, /cmsPage\.seoDescription \?\? m\.seoDescription \?\? m\.shortDescription/, "CMS-beschrijving eerst, dan de bestaande modulemetadata, nooit leeg terwijl er een goede fallback is");
  assert.match(metaBody, /title: `\$\{m\.seoTitle \?\? m\.name\} voor verenigingen`/, "fallback-titel ongewijzigd t.o.v. SEO Vindbaarheid 2.0");
});

test("BreadcrumbList blijft behouden in zowel de CMS- als de fallback-weergave", async () => {
  const source = await read("app/modules/[slug]/page.tsx");
  const cmsBranch = source.slice(source.indexOf("if (cmsPage && cmsPage.blocks.length > 0)"), source.indexOf("return <PublicShell>"));
  assert.match(cmsBranch, /\{breadcrumb\}/);
  assert.match(source, /const breadcrumb = <script type="application\/ld\+json"/);
});

test("geen tweede CMS-renderer gebouwd - de CMS-tak rendert uitsluitend via het bestaande CmsPublicPageView, geen losse blocktype-switch", async () => {
  const source = await read("app/modules/[slug]/page.tsx");
  assert.doesNotMatch(source, /block\.blockType ===/, "een eigen blocktype-switch zou een tweede renderer betekenen - moet niet voorkomen in dit bestand");
  assert.match(source, /<CmsPublicPageView page=\{cmsPage\} \/>/);
});
