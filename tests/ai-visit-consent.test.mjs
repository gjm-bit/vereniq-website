import assert from "node:assert/strict";
import test from "node:test";

// WEBSITE STATISTIEKEN 1.4 (AI-bezoeken productmatig afronden) - dekt
// src/lib/ai-visit-consent.ts. Echte functie-aanroepen tegen een
// minimale, in-memory localStorage-nabootsing (Node heeft geen
// localStorage zonder extra flags) - dit is pure logica zonder overige
// browserafhankelijkheden, dus een faked storage-object volstaat.

function createFakeLocalStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
  };
}

globalThis.localStorage = createFakeLocalStorage();

const { resolveConsentState, grantConsent, denyConsent, revokeConsent, resolveAndMarkVisitedBefore } = await import("../src/lib/ai-visit-consent.ts");

test.beforeEach(() => {
  globalThis.localStorage = createFakeLocalStorage();
});

test("resolveConsentState: zonder eerdere keuze is de staat undecided", () => {
  assert.equal(resolveConsentState(), "undecided");
});

test("grantConsent/denyConsent: de keuze wordt onthouden voor volgende aanroepen", () => {
  grantConsent();
  assert.equal(resolveConsentState(), "granted");
  denyConsent();
  assert.equal(resolveConsentState(), "denied");
});

test("revokeConsent: staat keert terug naar undecided", () => {
  grantConsent();
  assert.equal(resolveConsentState(), "granted");
  revokeConsent();
  assert.equal(resolveConsentState(), "undecided");
});

test("resolveAndMarkVisitedBefore: zonder toestemming (undecided) altijd null, nooit gelezen/geschreven", () => {
  assert.equal(resolveAndMarkVisitedBefore("undecided"), null);
  assert.equal(localStorage.getItem("mv_stats_visited_before"), null, "er mag niets geschreven zijn zonder toestemming");
});

test("resolveAndMarkVisitedBefore: bij geweigerde toestemming (denied) altijd null, nooit gelezen/geschreven", () => {
  assert.equal(resolveAndMarkVisitedBefore("denied"), null);
  assert.equal(localStorage.getItem("mv_stats_visited_before"), null);
});

test("resolveAndMarkVisitedBefore: eerste aanroep met toestemming geeft false (nog niet eerder gezien) en markeert voor de volgende keer", () => {
  const first = resolveAndMarkVisitedBefore("granted");
  assert.equal(first, false, "eerste keer: nog niet eerder bezocht");
  assert.equal(localStorage.getItem("mv_stats_visited_before"), "1", "wordt nu gemarkeerd voor een volgende sessie");
});

test("resolveAndMarkVisitedBefore: tweede aanroep (nieuwe sessie) met toestemming geeft true (eerder gezien)", () => {
  resolveAndMarkVisitedBefore("granted");
  const second = resolveAndMarkVisitedBefore("granted");
  assert.equal(second, true, "tweede keer: browser was al eerder gezien");
});

test("resolveAndMarkVisitedBefore: meerdere aanroepen binnen dezelfde sessie blijven consistent (geen dubbele markering, geen foutieve terugval naar false)", () => {
  assert.equal(resolveAndMarkVisitedBefore("granted"), false);
  assert.equal(resolveAndMarkVisitedBefore("granted"), true);
  assert.equal(resolveAndMarkVisitedBefore("granted"), true);
});

test("revokeConsent: verwijdert ook het herkenningssignaal zelf - een volgende classificatie start weer bij 'nog niet eerder gezien'", () => {
  resolveAndMarkVisitedBefore("granted");
  assert.equal(localStorage.getItem("mv_stats_visited_before"), "1");
  revokeConsent();
  assert.equal(localStorage.getItem("mv_stats_visited_before"), null, "het herkenningssignaal moet weg zijn na intrekken");
  // Hernieuwde toestemming zonder enige voorkennis: weer "nog niet eerder bezocht".
  grantConsent();
  assert.equal(resolveAndMarkVisitedBefore("granted"), false, "na intrekken + opnieuw toestemming geven telt de volgende AI-sessie weer als nieuw, niet als terugkerend");
});

test("elke functie faalt zacht als localStorage een fout gooit (bv. privénavigatie) - nooit een onafgevangen throw", () => {
  globalThis.localStorage = {
    getItem() { throw new Error("localStorage niet beschikbaar"); },
    setItem() { throw new Error("localStorage niet beschikbaar"); },
    removeItem() { throw new Error("localStorage niet beschikbaar"); },
  };
  assert.doesNotThrow(() => resolveConsentState());
  assert.equal(resolveConsentState(), "undecided");
  assert.doesNotThrow(() => grantConsent());
  assert.doesNotThrow(() => denyConsent());
  assert.doesNotThrow(() => revokeConsent());
  assert.doesNotThrow(() => resolveAndMarkVisitedBefore("granted"));
  assert.equal(resolveAndMarkVisitedBefore("granted"), null);
});
