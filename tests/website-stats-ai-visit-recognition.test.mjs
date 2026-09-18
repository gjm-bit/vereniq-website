import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// WEBSITE STATISTIEKEN 1.4 (AI-bezoeken productmatig afronden) - dekt de
// minimale first-party toestemmingsmelding en hoe die de bestaande 1.3-keten
// aanvult: WebsiteStatsBeacon -> /api/website-stats/pageview ->
// website_traffic_pageview_record(). Focus: zonder toestemming verandert er
// niets aan het bestaande, cookieloze 1.3-gedrag; met toestemming wordt
// precies één extra, minimale boolean gelezen/geschreven - nooit een UUID,
// nooit een timestamp, nooit cross-site, geen enkele nieuwe
// derde-partij-analytics.

const stripComments = (source) => source.split("\n").map((line) => (line.trim().startsWith("//") ? "" : line.replace(/\/\/.*$/, ""))).join("\n");
const read = async (relativePath) => stripComments(await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"));

test("de beacon leest/schrijft het herkenningssignaal via de centrale consent-module, nergens los localStorage-toegang", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  assert.match(source, /from "@\/src\/lib\/ai-visit-consent"/);
  assert.match(source, /resolveAndMarkVisitedBefore\(resolveConsentState\(\)\)/);
  // localStorage wordt uitsluitend via ai-visit-consent.ts aangeroepen - niet
  // rechtstreeks in de beacon zelf (dat zou de "ENE centrale plek"-garantie
  // doorbreken).
  assert.doesNotMatch(source, /\blocalStorage\.(get|set|remove)Item\b/);
});

test("de beacon stuurt aiVisitedBefore mee als boolean-of-null, nooit een gegenereerde ID", async () => {
  const source = await read("src/components/website-stats-beacon.tsx");
  assert.match(source, /aiVisitedBefore: priorVisitedBefore/);
  assert.doesNotMatch(source, /crypto\.randomUUID|uuid|Math\.random\(\).*id/i, "geen enkele gegenereerde visitor-ID toegevoegd");
});

test("de route vertrouwt aiVisitedBefore alleen als het een echte boolean is (nooit een geraden classificatie)", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.match(source, /typeof body\.aiVisitedBefore === 'boolean' \? body\.aiVisitedBefore : null/);
});

test("de route classificeert nieuw\\/terugkerend uitsluitend op de pageview die het AI-bezoek START, en nooit zonder een bekende aiVisitedBefore-waarde", async () => {
  const source = await read("app/api/website-stats/pageview/route.ts");
  assert.match(source, /const aiVisitKind = aiVisitStart && aiVisitedBefore !== null \? \(aiVisitedBefore \? 'returning' : 'new'\) : null;/);
  assert.match(source, /target_ai_visit_kind: aiVisitKind,/);
  // Regressie: de 1.3-versie stuurde hier altijd een hardcoded null - die
  // regel mag niet zijn blijven staan naast de nieuwe logica.
  assert.doesNotMatch(source, /target_ai_visit_kind: null,/);
});

test("app/layout.tsx: de toestemmingsmelding staat sitewide naast de bestaande beacon, geen aparte nieuwe pagina", async () => {
  const source = await read("app/layout.tsx");
  assert.match(source, /<WebsiteStatsBeacon \/>/);
  assert.match(source, /<ConsentBanner \/>/);
});

test("consent-banner.tsx: exacte, Oma Nel-proof copy - geen juridisch/technisch jargon", async () => {
  const source = await read("src/components/consent-banner.tsx");
  assert.match(source, /Meer Vereniging gebruikt alleen eigen statistieken om te zien hoe onze website wordt gevonden\. Mogen we op dit apparaat onthouden of je de website eerder hebt bezocht\?/);
  assert.match(source, />\s*Ja, dat is goed\s*</);
  assert.match(source, />\s*Nee, liever niet\s*</);
  for (const jargon of ["opt-in", "opt-out", "tracking pixel", "third-party", "GDPR", "AVG-verplichting"]) {
    assert.doesNotMatch(source, new RegExp(jargon, "i"), `"${jargon}" is jargon en hoort niet in de zichtbare toestemmingsmelding`);
  }
});

test("consent-banner.tsx: weigeren beperkt de website niet - beide knoppen doen precies één ding en verbergen de melding, geen geforceerde her-vraag", async () => {
  const source = await read("src/components/consent-banner.tsx");
  assert.match(source, /grantConsent\(\);\s*\n\s*setVisible\(false\);/);
  assert.match(source, /denyConsent\(\);\s*\n\s*setVisible\(false\);/);
});

test("consent-revoke-control.tsx: toestemming kan op /cookies worden ingetrokken via de bestaande consent-module, geen nieuw consent-platform", async () => {
  const source = await read("src/components/consent-revoke-control.tsx");
  assert.match(source, /revokeConsent\(\)/);
  assert.match(source, /from "@\/src\/lib\/ai-visit-consent"/);
});

test("app/[...slug]/page.tsx: de intrekknop staat alleen op /cookies, niet sitebreed of op /privacy", async () => {
  const source = await read("app/[...slug]/page.tsx");
  assert.match(source, /extra=\{slug === "cookies" \? <ConsentRevokeControl \/> : null\}/);
});

test("app/[...slug]/page.tsx: /cookies-tekst beschrijft het daadwerkelijke gedrag (anonieme sessiestatistieken zonder toestemming, minimaal herkenningssignaal mét toestemming, geen personen/profiel)", async () => {
  const source = await read("app/[...slug]/page.tsx");
  const cookiesEntry = source.slice(source.indexOf("cookies: { title:"), source.indexOf("\"algemene-voorwaarden\":"));
  assert.match(cookiesEntry, /zonder cookies/);
  assert.match(cookiesEntry, /alleen dát je de website al eerder hebt bezocht/);
  assert.match(cookiesEntry, /geen naam, geen profiel/);
});

test("geen enkele derde-partij-analyticscode toegevoegd (Google Analytics, Meta Pixel, of een generieke tracking-SDK)", async () => {
  for (const path of ["app/layout.tsx", "src/components/consent-banner.tsx", "src/components/consent-revoke-control.tsx", "src/components/website-stats-beacon.tsx", "src/lib/ai-visit-consent.ts"]) {
    const source = await read(path);
    assert.doesNotMatch(source, /googletagmanager|google-analytics|gtag\(|facebook\.net|fbq\(|segment\.(com|io)|mixpanel|amplitude|hotjar/i, `${path} mag geen derde-partij-analytics bevatten`);
  }
});

test("ai-visit-consent.ts: precies twee localStorage-sleutels, allebei korte, niet-identificerende waarden (geen UUID/timestamp)", async () => {
  const source = await read("src/lib/ai-visit-consent.ts");
  assert.match(source, /const CONSENT_KEY = "mv_stats_consent";/);
  assert.match(source, /const VISITED_BEFORE_KEY = "mv_stats_visited_before";/);
  assert.doesNotMatch(source, /crypto\.randomUUID|Date\.now\(\)|new Date\(\)\.toISOString\(\)/, "geen timestamp of gegenereerde ID - een boolean/vaste tekst volstaat");
});
