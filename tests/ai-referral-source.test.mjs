import assert from "node:assert/strict";
import test from "node:test";
import { resolveAiSource, resolveAiSourceFromReferrerHost, resolveAiSourceFromUtmSource, isKnownAiSourceKey } from "../src/lib/ai-referral-source.ts";

// WEBSITE STATISTIEKEN 1.2 (AI-vindbaarheid) - dekt de ene centrale
// AI-bronresolver die de beacon en de pageview-route allebei gebruiken.
// Echte functie-aanroepen (geen statische broncode-analyse) - dit is pure
// logica zonder externe afhankelijkheden.

test("bekende AI-referrer-hostnamen worden herkend", () => {
  assert.equal(resolveAiSourceFromReferrerHost("chatgpt.com"), "chatgpt");
  assert.equal(resolveAiSourceFromReferrerHost("www.chatgpt.com"), "chatgpt");
  assert.equal(resolveAiSourceFromReferrerHost("copilot.microsoft.com"), "microsoft_copilot");
  assert.equal(resolveAiSourceFromReferrerHost("perplexity.ai"), "perplexity");
  assert.equal(resolveAiSourceFromReferrerHost("gemini.google.com"), "gemini");
  assert.equal(resolveAiSourceFromReferrerHost("claude.ai"), "claude");
});

test("een gewone, niet-AI-referrer (bijvoorbeeld Google-zoekresultaten) blijft gewoon geen AI-bron", () => {
  assert.equal(resolveAiSourceFromReferrerHost("www.google.com"), null);
  assert.equal(resolveAiSourceFromReferrerHost("beheer.meervereniging.nl"), null);
  assert.equal(resolveAiSourceFromReferrerHost(null), null);
  assert.equal(resolveAiSourceFromReferrerHost(""), null);
});

test("geldige AI-utm_source-aliassen worden herkend en genormaliseerd naar dezelfde vaste sleutel", () => {
  assert.equal(resolveAiSourceFromUtmSource("chatgpt.com"), "chatgpt");
  assert.equal(resolveAiSourceFromUtmSource("chatgpt"), "chatgpt");
  assert.equal(resolveAiSourceFromUtmSource("openai"), "chatgpt");
  assert.equal(resolveAiSourceFromUtmSource("CHATGPT"), "chatgpt", "hoofdlettergevoeligheid mag geen verschil maken");
  assert.equal(resolveAiSourceFromUtmSource("copilot"), "microsoft_copilot");
  assert.equal(resolveAiSourceFromUtmSource("perplexity"), "perplexity");
  assert.equal(resolveAiSourceFromUtmSource("gemini"), "gemini");
  assert.equal(resolveAiSourceFromUtmSource("claude"), "claude");
});

test("een onbekende utm_source wordt NIET als vrije tekst teruggegeven - alleen null", () => {
  assert.equal(resolveAiSourceFromUtmSource("nieuwsbrief"), null);
  assert.equal(resolveAiSourceFromUtmSource("facebook"), null);
  assert.equal(resolveAiSourceFromUtmSource("<script>alert(1)</script>"), null);
  assert.equal(resolveAiSourceFromUtmSource("a".repeat(500)), null, "extreem lange waarden worden geweigerd, niet stilzwijgend afgekapt en opgeslagen");
  assert.equal(resolveAiSourceFromUtmSource(null), null);
  assert.equal(resolveAiSourceFromUtmSource(""), null);
});

test("bronprioriteit: een geldige AI-utm_source wint van referrer_host, geen dubbeltelling van twee bronnen voor één pageview", () => {
  assert.equal(resolveAiSource({ referrerHost: "www.google.com", utmSource: "chatgpt" }), "chatgpt", "utm_source wint van een niet-AI-referrer");
  assert.equal(resolveAiSource({ referrerHost: "chatgpt.com", utmSource: "perplexity" }), "perplexity", "utm_source wint zelfs van een AI-referrer - één bron per pageview, nooit twee");
});

test("bronprioriteit: zonder geldige utm_source valt terug op een bekende AI-referrer", () => {
  assert.equal(resolveAiSource({ referrerHost: "chatgpt.com", utmSource: null }), "chatgpt");
  assert.equal(resolveAiSource({ referrerHost: "chatgpt.com", utmSource: "nieuwsbrief" }), "chatgpt", "een onbekende utm_source blokkeert de referrer-fallback niet");
});

test("geen enkele AI-bron: gewoon bestaand, niet-AI-verkeer blijft ongemoeid", () => {
  assert.equal(resolveAiSource({ referrerHost: "www.google.com", utmSource: null }), null);
  assert.equal(resolveAiSource({ referrerHost: null, utmSource: null }), null, "direct verkeer blijft null");
});

// WEBSITE STATISTIEKEN 1.3 (AI-bezoeken) - isKnownAiSourceKey valideert een
// door de client gerapporteerde "sessie was al aan een AI-bron toegeschreven"
// -waarde (website-stats-beacon.tsx/route.ts), zonder de allowlist een
// tweede keer los te definiëren.

test("isKnownAiSourceKey herkent exact de 5 vaste sleutels, niets anders", () => {
  for (const key of ["chatgpt", "microsoft_copilot", "perplexity", "gemini", "claude"]) {
    assert.equal(isKnownAiSourceKey(key), true, `${key} moet een geldige sleutel zijn`);
  }
});

test("isKnownAiSourceKey wijst vrije tekst, null, en niet-stringwaarden af", () => {
  assert.equal(isKnownAiSourceKey("nieuwsbrief"), false);
  assert.equal(isKnownAiSourceKey("ChatGPT"), false, "hoofdlettergevoelig - alleen de exacte, al-genormaliseerde sleutel telt");
  assert.equal(isKnownAiSourceKey(""), false);
  assert.equal(isKnownAiSourceKey(null), false);
  assert.equal(isKnownAiSourceKey(undefined), false);
  assert.equal(isKnownAiSourceKey(42), false);
  assert.equal(isKnownAiSourceKey({ source: "chatgpt" }), false);
});
