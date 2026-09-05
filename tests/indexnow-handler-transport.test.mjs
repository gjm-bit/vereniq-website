import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

// INDEXNOW TRANSPORTFIX — dekt de laag die tests/indexnow.test.mjs bewust
// NIET dekt: `api/handler.mjs` zelf (de echte Vercel Node-adapter), met een
// ECHTE socket-backed `http.IncomingMessage` in plaats van een in-memory
// `new Request(...)`. Dit is precies de laag waarin drie afzonderlijke,
// first-party productiemetingen (een geïsoleerde, buiten-vinext
// transportdiagnose-endpoint + een tijdelijke Beheer-trigger, inmiddels
// beide opgeruimd) hebben aangetoond dat de kale Node-`IncomingMessage` een
// POST-body altijd volledig/tijdig ontving, terwijl exact dezelfde body via
// de oude `Readable.toWeb(req)`-brug in `api/handler.mjs` de bestaande
// route nooit voorbij het lezen van de body liet komen (consistent 408
// `request_body_timeout` na de bestaande body-read-veiligheidstimeout van
// 2000ms).
//
// De externe IndexNow-aanroep (`https://api.indexnow.org/indexnow`) wordt
// hier ALTIJD gemockt via `globalThis.fetch` - deze test verstuurt nooit een
// echte IndexNow-notificatie. Het bereiken van die (gemockte) externe call
// is zelf het bewijs dat de volledige route - inclusief het volledig lezen
// van de body - succesvol werd doorlopen, zonder afhankelijk te zijn van
// tijdelijke diagnose-instrumentatie.

const SECRET = "test-only-transport-fix-secret";
const REAL_INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

let server;
let baseUrl;
let realFetch;
let mockCallCount = 0;

test.before(async () => {
  process.env.INDEXNOW_TRIGGER_SECRET = SECRET;
  process.env.NEXT_PUBLIC_SITE_URL = "https://meervereniging.nl";

  realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url === REAL_INDEXNOW_ENDPOINT) {
      mockCallCount += 1;
      return new Response(null, { status: 202 });
    }
    return realFetch(input, init);
  };

  const { default: handler } = await import(new URL("../api/handler.mjs", import.meta.url));
  server = http.createServer((req, res) => handler(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/handler`;
});

test.after(async () => {
  globalThis.fetch = realFetch;
  await new Promise((resolve) => server.close(resolve));
});

async function postIndexNow(body, headers = {}) {
  const callsBefore = mockCallCount;
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}?path=%2Fapi%2Findexnow%2Fsubmit`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-indexnow-trigger-secret": SECRET, ...headers },
    body,
  });
  const elapsedMs = Date.now() - startedAt;
  const json = await response.json().catch(() => null);
  return { status: response.status, json, elapsedMs, reachedExternalFetch: mockCallCount > callsBefore };
}

test("echte socket-backed POST via api/handler.mjs: bereikt de (gemockte) externe IndexNow-aanroep en antwoordt snel - bewijst dat de volledige body werd gelezen zonder hang/timeout", async () => {
  const { status, json, elapsedMs, reachedExternalFetch } = await postIndexNow(JSON.stringify({ urls: ["https://meervereniging.nl/transport-fix-test"] }));
  assert.equal(status, 200, JSON.stringify(json));
  assert.equal(json.success, true, JSON.stringify(json));
  assert.ok(reachedExternalFetch, "de route moet de (gemockte) externe IndexNow-aanroep hebben bereikt - dat kan alleen als de body volledig gelezen is");
  assert.ok(elapsedMs < 1000, `verwacht een vlotte respons (geen 2000ms body-read-timeout), duurde ${elapsedMs}ms`);
});

test("echte socket-backed lege POST-body: geen hang/timeout, gecontroleerde 400", async () => {
  const { status, json, elapsedMs } = await postIndexNow("");
  assert.equal(status, 400);
  assert.equal(json.code, "invalid_request");
  assert.ok(elapsedMs < 1000, `verwacht een vlotte 400, geen timeout-wachttijd, duurde ${elapsedMs}ms`);
});

test("echte socket-backed ongeldige JSON-body: geen hang/timeout, gecontroleerde 400", async () => {
  const { status, json, elapsedMs } = await postIndexNow("{ dit is geen json");
  assert.equal(status, 400);
  assert.equal(json.code, "invalid_request");
  assert.ok(elapsedMs < 1000, `verwacht een vlotte 400, geen timeout-wachttijd, duurde ${elapsedMs}ms`);
});

test("echte socket-backed GET blijft ongewijzigd werken (geen body aan de request gehangen)", async () => {
  const response = await fetch(`${baseUrl}?path=%2Frobots.txt`, { method: "GET" });
  assert.equal(response.status, 200);
});

test("drie opeenvolgende echte socket-backed POSTs: allemaal snel succesvol, geen enkele hang/timeout", async () => {
  for (let i = 0; i < 3; i += 1) {
    const { status, json, elapsedMs, reachedExternalFetch } = await postIndexNow(JSON.stringify({ urls: [`https://meervereniging.nl/transport-fix-test-${i}`] }));
    assert.equal(status, 200, JSON.stringify(json));
    assert.ok(reachedExternalFetch, `request ${i}: moet de externe aanroep bereiken`);
    assert.ok(elapsedMs < 1000, `request ${i}: verwacht een vlotte respons, duurde ${elapsedMs}ms`);
  }
});

test("de externe IndexNow-aanroep werd tijdens deze hele testfile altijd gemockt (geen echte notificatie verstuurd)", () => {
  assert.ok(mockCallCount > 0, "er moet minstens één (gemockte) IndexNow-aanroep hebben plaatsgevonden om deze check zinvol te maken");
  assert.notEqual(globalThis.fetch, realFetch);
});
