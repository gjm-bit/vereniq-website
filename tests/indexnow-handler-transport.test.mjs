import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

// INDEXNOW TRANSPORTFIX — dekt de laag die tests/indexnow.test.mjs bewust
// NIET dekt: `api/handler.mjs` zelf (de echte Vercel Node-adapter), met een
// ECHTE socket-backed `http.IncomingMessage` in plaats van een in-memory
// `new Request(...)`. Dit is precies de laag waarin drie afzonderlijke,
// first-party productiemetingen (zie PR #17/#100 - een geïsoleerde,
// buiten-vinext transportdiagnose-endpoint + een tijdelijke Beheer-trigger)
// hebben aangetoond dat de kale Node-`IncomingMessage` een POST-body altijd
// volledig/tijdig ontving, terwijl exact dezelfde body via de oude
// `Readable.toWeb(req)`-brug in `api/handler.mjs` de bestaande route nooit
// voorbij `body_read_start` liet komen (consistent 408
// `request_body_timeout` na de PR #15-veiligheidstimeout van 2000ms).
//
// De externe IndexNow-aanroep (`https://api.indexnow.org/indexnow`) wordt
// hier ALTIJD gemockt via `globalThis.fetch` - deze test verstuurt nooit een
// echte IndexNow-notificatie.

const SECRET = "test-only-transport-fix-secret";
const REAL_INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

let server;
let baseUrl;
let realFetch;
let mockCallCount = 0;
let traceBuffer = null;
let realConsoleInfo;

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

  realConsoleInfo = console.info;
  console.info = (...args) => {
    if (traceBuffer) {
      try {
        const parsed = JSON.parse(args[0]);
        if (parsed.scope === "indexnow_trace") traceBuffer.push(parsed.event);
      } catch {
        // niet-JSON console.info - negeren voor deze test
      }
    }
  };

  const { default: handler } = await import(new URL("../api/handler.mjs", import.meta.url));
  server = http.createServer((req, res) => handler(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/handler`;
});

test.after(async () => {
  globalThis.fetch = realFetch;
  console.info = realConsoleInfo;
  await new Promise((resolve) => server.close(resolve));
});

async function postIndexNow(body, headers = {}) {
  traceBuffer = [];
  const response = await fetch(`${baseUrl}?path=%2Fapi%2Findexnow%2Fsubmit`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-indexnow-trigger-secret": SECRET, ...headers },
    body,
  });
  const json = await response.json().catch(() => null);
  const events = traceBuffer;
  traceBuffer = null;
  return { status: response.status, json, events };
}

test("echte socket-backed POST via api/handler.mjs: body_read_complete, validation_complete, external_fetch_start/end en response_return worden allemaal bereikt, geen body_read_timeout", async () => {
  const { status, json, events } = await postIndexNow(JSON.stringify({ urls: ["https://meervereniging.nl/transport-fix-test"] }));
  assert.equal(status, 200, JSON.stringify(json));
  assert.equal(json.success, true, JSON.stringify(json));
  for (const expected of ["body_read_start", "body_read_complete", "validation_complete", "external_fetch_start", "external_fetch_end", "response_return"]) {
    assert.ok(events.includes(expected), `verwacht event "${expected}" ontbreekt: ${events.join(" -> ")}`);
  }
  assert.ok(!events.includes("body_read_timeout"), `body_read_timeout mag nooit voorkomen: ${events.join(" -> ")}`);
});

test("echte socket-backed lege POST-body: geen hang/timeout, gecontroleerde 400", async () => {
  const { status, json, events } = await postIndexNow("");
  assert.equal(status, 400);
  assert.equal(json.code, "invalid_request");
  assert.ok(!events.includes("body_read_timeout"));
});

test("echte socket-backed ongeldige JSON-body: geen hang/timeout, gecontroleerde 400", async () => {
  const { status, json, events } = await postIndexNow("{ dit is geen json");
  assert.equal(status, 400);
  assert.equal(json.code, "invalid_request");
  assert.ok(!events.includes("body_read_timeout"));
});

test("echte socket-backed GET blijft ongewijzigd werken (geen body aan de request gehangen)", async () => {
  const response = await fetch(`${baseUrl}?path=%2Frobots.txt`, { method: "GET" });
  assert.equal(response.status, 200);
});

test("drie opeenvolgende echte socket-backed POSTs: allemaal body_read_complete, geen enkele timeout", async () => {
  for (let i = 0; i < 3; i += 1) {
    const { status, json, events } = await postIndexNow(JSON.stringify({ urls: [`https://meervereniging.nl/transport-fix-test-${i}`] }));
    assert.equal(status, 200, JSON.stringify(json));
    assert.ok(events.includes("body_read_complete"), `request ${i}: ${events.join(" -> ")}`);
    assert.ok(!events.includes("body_read_timeout"), `request ${i}: ${events.join(" -> ")}`);
  }
});

test("de externe IndexNow-aanroep werd tijdens deze hele testfile altijd gemockt (geen echte notificatie verstuurd)", () => {
  assert.ok(mockCallCount > 0, "er moet minstens één (gemockte) IndexNow-aanroep hebben plaatsgevonden om deze check zinvol te maken");
  assert.notEqual(globalThis.fetch, realFetch);
});
