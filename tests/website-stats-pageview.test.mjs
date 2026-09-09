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
  assert.doesNotMatch(source, /location\.search|location\.hash|window\.location\.href/);
});

test("de beacon staat in de root layout, dus op elke paginaweergave van de publieke website", async () => {
  const source = await read("app/layout.tsx");
  assert.match(source, /<WebsiteStatsBeacon \/>/);
});

test("app/api/proefabonnement/*: geen regressie - de bestaande routes zijn niet gewijzigd door deze nightshift", async () => {
  const aanvraag = await read("app/api/proefabonnement/aanvraag/route.ts");
  assert.match(aanvraag, /admin\.rpc\('platform_trial_signup_request', \{/);
});
