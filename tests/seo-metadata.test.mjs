import assert from "node:assert/strict";
import test from "node:test";

async function render(path) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const SITE = "https://meervereniging.nl";

test("robots.txt allows public crawling and blocks internal-only routes", async () => {
  const response = await render("/robots.txt");
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /User-Agent: \*/);
  assert.match(body, /Allow: \//);
  assert.match(body, /Disallow: \/master/);
  assert.match(body, /Disallow: \/cms-preview/);
  assert.match(body, /Disallow: \/api\//);
  assert.match(body, new RegExp(`Sitemap: ${SITE}/sitemap.xml`));
  // Bewuste, met naam genoemde AI-crawlerpolicy (zie docs/ai-crawler-policy.md):
  // alleen search/discovery- en live-answercrawlers krijgen een expliciete regel.
  for (const agent of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"]) {
    assert.match(body, new RegExp(`User-Agent: ${agent}\\b`), `verwacht een expliciete regel voor ${agent}`);
  }
  // Training-/datasetcrawlers krijgen bewust GEEN aparte, expliciete regel (dat zou
  // een aparte beleidskeuze - training toestaan - zijn, losgekoppeld van
  // vindbaarheid/citatie). Ze vallen terug op het wildcard-record, dus niet
  // apart geblokkeerd, maar ook niet apart bevoordeeld.
  for (const agent of ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot"]) {
    assert.doesNotMatch(body, new RegExp(`User-Agent: ${agent}\\b`), `verwacht GEEN aparte regel voor trainingscrawler ${agent}`);
  }
});

test("sitemap.xml includes real public pages and excludes internal/mid-flow routes", async () => {
  const response = await render("/sitemap.xml");
  assert.equal(response.status, 200);
  const body = await response.text();
  for (const path of ["/platform", "/waarom-meer-vereniging", "/modules", "/voor-wie", "/voor-wie/muziekverenigingen", "/app", "/proefabonnement"]) {
    assert.match(body, new RegExp(`<loc>${SITE}${path}</loc>`), `verwacht ${path} in de sitemap`);
  }
  assert.doesNotMatch(body, /\/master</);
  assert.doesNotMatch(body, /\/cms-preview</);
  assert.doesNotMatch(body, /\/api\//);
  assert.doesNotMatch(body, /\/proefabonnement\/activeren</, "een noindex mid-flow pagina hoort niet in de sitemap");
});

test("every checked public page has exactly one canonical link matching its own URL", async () => {
  for (const path of ["/", "/platform", "/waarom-meer-vereniging", "/modules", "/voor-wie", "/proefabonnement", "/over-ons-contact", "/app"]) {
    const html = await (await render(path)).text();
    const matches = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    assert.equal(matches.length, 1, `verwacht precies 1 canonical op ${path}`);
    // /app canonicaliseert bewust naar /platform zolang er geen eigen CMS-pagina bestaat
    // (zie app/app/page.tsx) - duplicate content i.p.v. twee URLs met identieke inhoud.
    // De homepage-canonical komt zonder trailing slash terug (Next.js' eigen
    // URL-normalisatie van de site-root) - functioneel identiek, dus geaccepteerd.
    const expected = path === "/app" ? `${SITE}/platform` : path === "/" ? SITE : `${SITE}${path}`;
    assert.equal(matches[0][1], expected, `canonical op ${path}`);
  }
});

test("public pages expose Open Graph and Twitter Card metadata", async () => {
  const html = await (await render("/waarom-meer-vereniging")).text();
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, new RegExp(`property="og:url" content="${SITE}/waarom-meer-vereniging"`));
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});

test("noindex pages carry a robots noindex meta tag", async () => {
  const html = await (await render("/proefabonnement/activeren")).text();
  assert.match(html, /name="robots" content="noindex/);
});

test("Organization/WebSite/SoftwareApplication JSON-LD is present and well-formed on every page", async () => {
  const html = await (await render("/platform")).text();
  const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(match, "verwacht een @graph JSON-LD script in de layout");
  const data = JSON.parse(match[1]);
  const types = data["@graph"].map((entry) => entry["@type"]);
  assert.deepEqual(types, ["Organization", "WebSite", "SoftwareApplication"]);
  const org = data["@graph"][0];
  assert.equal(org.url, SITE);
  assert.match(org.logo, /^https:\/\//);
  // Geen verzonnen rating/review/prijs op SoftwareApplication - zie docs/ai-visibility-audit.md §6.
  const softwareApp = data["@graph"][2];
  assert.equal(softwareApp.aggregateRating, undefined);
  assert.equal(softwareApp.offers, undefined);
});

test("BreadcrumbList JSON-LD is present and valid on detail pages", async () => {
  const html = await (await render("/voor-wie/muziekverenigingen")).text();
  const matches = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  const breadcrumb = matches.map((m) => JSON.parse(m[1])).find((json) => json["@type"] === "BreadcrumbList");
  assert.ok(breadcrumb, "verwacht een BreadcrumbList naast de sitewide @graph");
  assert.equal(breadcrumb.itemListElement.length, 3);
  assert.equal(breadcrumb.itemListElement[0].name, "Home");
  assert.equal(breadcrumb.itemListElement.at(-1).item, `${SITE}/voor-wie/muziekverenigingen`);
});

test("llms.txt reflects the real current module list, not stale/internal product names", async () => {
  const response = await render("/llms.txt");
  assert.equal(response.status, 200);
  const body = await response.text();
  // Regressiebescherming: dit bestand noemde eerder "CRM", "Finance" en een
  // "prijsstelling volgt binnenkort"-claim die niet meer klopten met de
  // echte huidige onderdelen/prijssituatie.
  assert.doesNotMatch(body, /\bCRM\b/);
  assert.doesNotMatch(body, /\bFinance\b/);
  assert.doesNotMatch(body, /Fortissimo/);
  for (const name of ["Agenda", "Ledenadministratie", "Drankhaler", "Communicatiecentrum"]) {
    assert.match(body, new RegExp(name));
  }
});

test("waarom-meer-vereniging FAQ answers the question directly instead of only deflecting to another page", async () => {
  const html = await (await render("/waarom-meer-vereniging")).text();
  // Regressiebescherming voor de eerder gerapporteerde deflectiepatronen.
  assert.doesNotMatch(html, /Een actueel overzicht staat op de modulepagina/);
  assert.match(html, /Agenda, Ledenadministratie, Projecten, Repertoire, Voorraad, Drankhaler, Polls, Prikbord/);
});
