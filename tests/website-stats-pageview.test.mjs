import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// WEBSITE STATISTIEKEN 1.1 (nightshift 2026-09-09/10) - dekt de nieuwe
// paginaweergave-beacon: app/api/website-stats/pageview/route.ts en
// src/components/website-stats-beacon.tsx. Focus: nooit een IP-adres/
// user-agent lezen of opslaan (AVG), altijd zacht falen (een mislukte
// telling mag een paginaweergave nooit zichtbaar breken), ongeldige invoer
// server-side afwijzen (nooit alleen op de client vertrouwen), geen cookies,
// dezelfde vertrouwensgrens (service_role, server-only) als de bestaande
// proefabonnement-routes.

const stripComments = (source) => source.split("\n").map((line) => (line.trim().startsWith("//") ? "" : line.replace(/\/\/.*$/, ""))).join("\n");
const read = async (relativePath) => stripComments(await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"));

test("de route leest of bewaart nergens een IP-adres of user-agent", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.doesNotMatch(source, /extractVisitorIp|hashVisitorIp|x-forwarded-for|user-agent/i, "geen enkele IP/UA-toegang - dit verschilt bewust van de proefabonnement-aanvraagroute");
});

test("de route gebruikt de service_role-only RPC, nooit een directe tabelschrijving", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.match(source, /admin\.rpc\('website_traffic_pageview_record', \{/);
  assert.doesNotMatch(source, /\.from\('website_traffic_daily_stats'\)/);
  assert.doesNotMatch(source, /\.insert\(/);
});

test("de route valideert pad/apparaattype/verwijzer server-side - vertrouwt de client nooit blind", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.match(source, /PATH_PATTERN = \/\^\\\/\[a-z0-9\/_-\]\{1,200\}\$\//);
  assert.match(source, /HOST_PATTERN = \/\^\[a-z0-9\.-\]\{1,255\}\$\//);
  assert.match(source, /DEVICE_TYPES = new Set\(\['mobile', 'desktop', 'unknown'\]\)/);
});

test("de route faalt altijd zacht (204, geen throw naar de bezoeker) bij ontbrekende configuratie of een RPC-fout", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.doesNotMatch(source, /throw (?!new)/, "de route mag nooit een onafgevangen fout laten ontsnappen naar de bezoeker");
  const rpcCallStart = source.indexOf("await admin.rpc('website_traffic_pageview_record'");
  const surroundingBlock = source.slice(Math.max(0, rpcCallStart - 40), rpcCallStart + 260);
  assert.match(surroundingBlock, /try \{/, "de RPC-aanroep staat in een try/catch, een mislukte telling breekt de paginaweergave nooit");
});

test("de beacon-component gebruikt geen cookies en bewaart geen enkele identificerende waarde over een sessie heen", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  assert.doesNotMatch(source, /document\.cookie/);
  assert.doesNotMatch(source, /localStorage/, "alleen sessionStorage (per tabblad, gewist bij sluiten) - nooit localStorage (blijft bewaard)");
  assert.match(source, /sessionStorage/);
});

test("de beacon telt een pagina van dezelfde site nooit mee als externe verwijzer (geen valse 'verkeersbron')", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  assert.match(source, /referrer\.hostname === window\.location\.hostname\) return null/);
});

test("de beacon stuurt geen pad met querystring/fragment mee (usePathname geeft alleen het pad, nooit search/hash)", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  assert.match(source, /import \{ usePathname \} from "next\/navigation";/);
  assert.doesNotMatch(source, /location\.hash|window\.location\.href/);
  // WEBSITE STATISTIEKEN 1.2: window.location.search wordt nu wél gelezen,
  // maar uitsluitend binnen resolveUtmSource() om de ENE utm_source-waarde
  // eruit te halen - nooit om de ruwe querystring door te geven, en nooit
  // als onderdeel van het verstuurde `path`-veld zelf (dat blijft `pathname`
  // uit usePathname).
  assert.match(source, /function resolveUtmSource\(\)[\s\S]*?window\.location\.search[\s\S]*?\.get\("utm_source"\)/);
  assert.doesNotMatch(source, /path:\s*pathname\s*\+/, "path mag nooit met de querystring worden samengevoegd");
});

test("de beacon leest uitsluitend utm_source uit de querystring (geen andere parameter, geen ruwe querystring)", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  const fnMatch = source.match(/function resolveUtmSource\(\)[\s\S]*?\n\}/);
  assert.ok(fnMatch, "resolveUtmSource moet bestaan");
  assert.doesNotMatch(fnMatch[0], /window\.location\.search(?!\)\.get\("utm_source"\))/, "search wordt alleen doorgegeven aan URLSearchParams, nooit los opgeslagen/verstuurd");
});

test("Website Statistieken 1.2 - de centrale AI-bronresolver bestaat en wordt door zowel de beacon als de route gebruikt (geen verspreide hardcoded domeinlijstjes)", async () => {
  const beacon = await read("src/components/website-stats-beacon.tsx");
  const route = await read("app/api/website-stats/pageview/route.ts");
  const resolver = await read("src/lib/ai-referral-source.ts");
  assert.match(beacon, /resolveUtmSource\(\)/);
  assert.match(route, /from '@\/src\/lib\/ai-referral-source'/);
  assert.match(route, /resolveAiSource\(\{ referrerHost, utmSource: rawUtmSource \}\)/);
  assert.match(route, /target_ai_source: aiSource/);
  // Geen los, tweede hardcoded AI-domeinlijstje in de route zelf.
  assert.doesNotMatch(route, /chatgpt\.com|perplexity\.ai|copilot\.microsoft\.com/);
  assert.match(resolver, /"chatgpt\.com":\s*"chatgpt"/);
});

test("de beacon staat in de root layout, dus op elke paginaweergave van de publieke website", async () => {
  const source = await read("app/layout.tsx");
  assert.match(source, /<WebsiteStatsBeacon \/>/);
});

test("app/api/proefabonnement/*: geen regressie - de bestaande routes zijn niet gewijzigd door deze nightshift", async () => {
  const aanvraag = await read("app/api/proefabonnement/aanvraag/route.ts");
  assert.match(aanvraag, /admin\.rpc\('platform_trial_signup_request', \{/);
});

// ============================================================
// WEBSITE STATISTIEKEN 1.3 — AI-bezoeken: unieke sessies + terugkerende
// bezoeken. Dekt: een AI-sessie mag maximaal 1 AI-bezoek registreren (ook na
// een latere, andere platformdetectie binnen dezelfde sessie), geen
// localStorage (geen consentbasis), en dat de route dit nooit blindelings
// van de client overneemt (server valideert tegen de vaste allowlist).
// ============================================================

test("de beacon houdt de sessie-brede AI-bron bij via sessionStorage, nooit localStorage (geen consentbasis)", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  assert.match(source, /AI_SESSION_SOURCE_KEY = "mv_ai_session_source"/);
  assert.doesNotMatch(source, /localStorage/, "cross-sessie opslag vereist consent die nog niet bestaat - alleen sessionStorage");
});

test("de beacon overschrijft een eenmaal vastgestelde AI-sessiebron nooit (first-touch, sticky, voorkomt een dubbel AI-bezoek bij een latere, andere platformdetectie)", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  const fnMatch = source.match(/function persistAiSessionSourceIfNew\([\s\S]*?\n\}/);
  assert.ok(fnMatch, "persistAiSessionSourceIfNew moet bestaan");
  assert.match(fnMatch[0], /if \(priorAiSource \|\| !directAiSource\) return;/, "een reeds bestaande sessiebron mag nooit overschreven worden door een latere, andere detectie");
});

test("de beacon stuurt de sessiebron mee als aiSessionSource, nooit als vrije tekst uit de querystring", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  assert.match(source, /aiSessionSource: priorAiSessionSource/);
});

test("de route valideert een door de client gerapporteerde sessiebron tegen de vaste allowlist - vertrouwt de client nooit blind op een nieuwe rol", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.match(source, /isKnownAiSourceKey\(body\.aiSessionSource\)/);
});

test("de route telt een AI-bezoek alleen als startpunt (aiVisitStart) op de EERSTE AI-paginaweergave van de sessie, nooit op vervolgpagina's binnen dezelfde sessie", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.match(source, /const aiSource = directAiSource \?\? priorAiSessionSource;/);
  assert.match(source, /const aiVisitStart = aiSource !== null && priorAiSessionSource === null;/);
});

test("de route stuurt nooit een verzonnen nieuw/terugkerend-classificatie - target_ai_visit_kind is altijd null (geen consentbasis voor cross-sessie-detectie)", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.match(source, /target_ai_visit_kind: null/);
});
