import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

// TRANSPORTFIX-REGRESSIE — dekt de laag die de statische
// proefabonnement-tests bewust NIET dekken: `api/handler.mjs` zelf (de
// echte Vercel Node-adapter), met een ECHTE socket-backed
// `http.IncomingMessage` in plaats van een in-memory `new Request(...)`.
// Dit is precies de laag waarin eerder, voor de IndexNow-route op dezelfde
// adapter, is aangetoond dat een streamende `Readable.toWeb(req)`-body de
// route nooit voorbij het lezen van de body liet komen (consistente 300s
// Vercel-functietimeout) - zie commit 03a7f23 "fix(indexnow): buffer
// request body in Vercel Node adapter instead of streaming". Deze suite
// bewijst dat diezelfde structurele fix (bufferen i.p.v. streamen) ook de
// proefabonnement-aanvraagroute via een echte `http.Server` zonder hangen
// doorloopt.
//
// Draait uitsluitend tegen validatiepaden die geen Supabase/Turnstile/
// Resend nodig hebben, zodat deze test omgevingsonafhankelijk en snel is.

let server;
let baseUrl;

test.before(async () => {
  const { default: handler } = await import(new URL("../api/handler.mjs", import.meta.url));
  server = http.createServer((req, res) => handler(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/handler`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function postAanvraag(body, { timeoutMs = 5000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}?path=%2Fapi%2Fproefabonnement%2Faanvraag`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: controller.signal,
    });
    const json = await response.json().catch(() => null);
    return { status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
}

test("echte socket-backed POST via api/handler.mjs: een geldig-gevormde body bereikt de route en krijgt een gecontroleerde 400 terug, geen hang/timeout", async () => {
  const { status, json } = await postAanvraag(JSON.stringify({ organizationName: "", contactName: "", contactEmail: "", colorPresetKey: "" }));
  assert.equal(status, 400, JSON.stringify(json));
  assert.equal(json.code, "invalid_request", JSON.stringify(json));
});

test("echte socket-backed lege POST-body: geen hang/timeout, gecontroleerde fout i.p.v. server crash", async () => {
  const { status, json } = await postAanvraag("");
  assert.equal(status, 400, JSON.stringify(json));
  assert.equal(json.code, "invalid_request");
});

test("echte socket-backed ongeldige JSON-body: geen hang/timeout, gecontroleerde 400", async () => {
  const { status, json } = await postAanvraag("{ dit is geen json");
  assert.equal(status, 400, JSON.stringify(json));
  assert.equal(json.code, "invalid_request");
});

test("echte socket-backed GET blijft ongewijzigd werken (geen body aan de request gehangen)", async () => {
  const response = await fetch(`${baseUrl}?path=%2Fsite-icon`, { method: "GET", redirect: "manual" });
  assert.ok(response.status < 500, `onverwachte serverfout: ${response.status}`);
});

test("drie opeenvolgende echte socket-backed POSTs: allemaal een prompte, gecontroleerde respons, geen enkele timeout", async () => {
  for (let i = 0; i < 3; i += 1) {
    const startedAt = Date.now();
    const { status, json } = await postAanvraag(JSON.stringify({ organizationName: `Test ${i}`, contactName: "", contactEmail: "", colorPresetKey: "" }));
    const elapsedMs = Date.now() - startedAt;
    assert.equal(status, 400, `poging ${i}: ${JSON.stringify(json)}`);
    assert.ok(elapsedMs < 5000, `poging ${i} duurde ${elapsedMs}ms - verdacht traag voor een pure validatiefout`);
  }
});
