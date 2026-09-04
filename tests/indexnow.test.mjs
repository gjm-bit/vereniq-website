import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// INDEXNOW — dekt src/config/crawl-policy.ts (direct .ts-geïmporteerd, geen
// build nodig - dit bestand heeft zelf geen relatieve imports, zelfde
// patroon als tests/cms-rich-text-rendering.test.mjs) en
// src/lib/server/indexnow.ts + app/api/indexnow/submit/route.ts via de
// gebouwde worker (dist/server/index.js) - zelfde integratiepatroon als
// tests/security-headers.test.mjs, nodig omdat indexnow.ts (net als de
// andere src/lib/server/*-bestanden) extensieloze relatieve imports
// gebruikt die de vinext/vite-bundler wel maar node's kale ESM-resolver
// niet oplost.

const { isDisallowedPath, DISALLOWED_PATH_PREFIXES } = await import("../src/config/crawl-policy.ts");

const SITE = "https://meervereniging.nl";
const commonEnv = { NEXT_PUBLIC_SITE_URL: SITE };

test("isDisallowedPath matcht private routeprefixes maar geen toevallige lookalikes", () => {
  assert.equal(isDisallowedPath("/master"), true);
  assert.equal(isDisallowedPath("/master/instellingen"), true);
  assert.equal(isDisallowedPath("/cms-preview"), true);
  assert.equal(isDisallowedPath("/api/"), true);
  assert.equal(isDisallowedPath("/api/indexnow/submit"), true);
  // Geen kale-stringprefixmatch: "/masterplan" is geen private route.
  assert.equal(isDisallowedPath("/masterplan"), false);
  assert.equal(isDisallowedPath("/platform"), false);
  assert.deepEqual([...DISALLOWED_PATH_PREFIXES], ["/master", "/cms-preview", "/api/"]);
});

test("het IndexNow-sleutelbestand in public/ bevat exact de standaardsleutel, geen extra whitespace", async () => {
  const key = "1f34f0e5c1d3b6ebbfc1c09ab79cca80";
  assert.match(key, /^[a-f0-9]{32}$/, "sleutel moet 8-128 hex-tekens zijn per de IndexNow-spec");
  const content = await readFile(new URL(`../public/${key}.txt`, import.meta.url), "utf8");
  assert.equal(content, key);
});

async function render(path, { env = {}, method = "GET", headers = {}, body } = {}) {
  const previousValues = {};
  for (const [key, value] of Object.entries(env)) {
    previousValues[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `${Date.now()}-${path}-${method}`);
    const { default: worker } = await import(workerUrl.href);
    return await worker.fetch(
      new Request(`http://localhost${path}`, { method, headers, body }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
  } finally {
    for (const [key, value] of Object.entries(previousValues)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("POST /api/indexnow/submit: 503 als INDEXNOW_TRIGGER_SECRET niet is geconfigureerd", async () => {
  const response = await render("/api/indexnow/submit", {
    env: { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "" },
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`] }),
  });
  assert.equal(response.status, 503);
  const data = await response.json();
  assert.equal(data.code, "not_configured");
});

test("POST /api/indexnow/submit: 401 bij ontbrekend of onjuist secret", async () => {
  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const withoutHeader = await render("/api/indexnow/submit", { env, method: "POST", body: JSON.stringify({ urls: [`${SITE}/platform`] }) });
  assert.equal(withoutHeader.status, 401);

  const withWrongHeader = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "wrong-secret", "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`] }),
  });
  assert.equal(withWrongHeader.status, 401);
  assert.equal((await withWrongHeader.json()).code, "unauthorized");
});

test("POST /api/indexnow/submit: 400 bij ontbrekende/lege/ongeldige 'urls'", async () => {
  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const headers = { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" };

  const noBody = await render("/api/indexnow/submit", { env, method: "POST", headers });
  assert.equal(noBody.status, 400);

  const emptyArray = await render("/api/indexnow/submit", { env, method: "POST", headers, body: JSON.stringify({ urls: [] }) });
  assert.equal(emptyArray.status, 400);

  const notAnArray = await render("/api/indexnow/submit", { env, method: "POST", headers, body: JSON.stringify({ urls: "not-an-array" }) });
  assert.equal(notAnArray.status, 400);
});

test("POST /api/indexnow/submit: geldig secret + geldige urls stuurt correct door naar IndexNow en weigert private/vreemde-host-URL's stilzwijgend", async (t) => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.indexnow.org/indexnow") {
      calls.push(JSON.parse(init.body));
      return new Response(null, { status: 200 });
    }
    return originalFetch(url, init);
  };

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`, `${SITE}/master`, "https://evil.example/"] }),
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.requested, 3);
  assert.equal(data.submitted, 1);
  assert.equal(data.rejected, 2);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].host, "meervereniging.nl");
  assert.deepEqual(calls[0].urlList, [`${SITE}/platform`]);
  assert.match(calls[0].key, /^[a-f0-9]{32}$/);
  assert.equal(calls[0].keyLocation, `${SITE}/${calls[0].key}.txt`);
});

test("POST /api/indexnow/submit: een IndexNow-netwerkfout geeft een nette 200-samenvatting met submitted:0, geen 500", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, init) => (url === "https://api.indexnow.org/indexnow" ? Promise.reject(new Error("network down")) : originalFetch(url, init));

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`] }),
  });

  assert.equal(response.status, 200, "een IndexNow-storing mag de aanroep zelf niet laten falen");
  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.submitted, 0);
});

test("POST /api/indexnow/submit: geldig secret + snel antwoordende IndexNow-call geeft een vlotte succesvolle ontvangstrespons", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, init) => (url === "https://api.indexnow.org/indexnow" ? new Response(null, { status: 200 }) : originalFetch(url, init));

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const startedAt = Date.now();
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`] }),
  });
  const elapsedMs = Date.now() - startedAt;

  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  // Ruime marge (1s) - dit bewijst alleen dat een normale, snel antwoordende
  // aanroep niet zelf al traag is; de eigenlijke timeout-race zit in de
  // hierna volgende test.
  assert.ok(elapsedMs < 1000, `verwacht een vlotte respons, duurde ${elapsedMs}ms`);
});

test("POST /api/indexnow/submit: een IndexNow-call die blijft hangen laat de ontvangstrespons NIET langer wachten dan de interne timeout, en blijft ruim binnen het 8000ms-budget van Websitebeheer (geen 500, fail-open)", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  // Simuleert een IndexNow-call die permanent blijft hangen totdat de
  // AbortSignal van submitToIndexNow zelf afgaat - exact hoe een echte
  // `fetch` met een AbortSignal zich gedraagt. Zonder de fix in
  // src/lib/server/indexnow.ts (REQUEST_TIMEOUT_MS omlaag naar 5000ms, ruim
  // onder de eigen 8000ms round-trip-timeout van Websitebeheer) zou deze test
  // nooit binnen een redelijke tijd resolven.
  globalThis.fetch = (url, init) => {
    if (url !== "https://api.indexnow.org/indexnow") return originalFetch(url, init);
    return new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        const error = new Error("The operation was aborted.");
        error.name = "AbortError";
        reject(error);
      });
    });
  };

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const startedAt = Date.now();
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`] }),
  });
  const elapsedMs = Date.now() - startedAt;
  const bodyText = await response.text();

  assert.equal(response.status, 200, "een hangende IndexNow-call mag nooit een 500 opleveren");
  const data = JSON.parse(bodyText);
  assert.equal(data.success, false);
  assert.equal(data.submitted, 0);

  // De kern van de fix: de respons moet rond de interne 5000ms-timeout
  // vallen (met wat marge voor testomgevingsjitter), en - het echte
  // contract - ruim binnen het 8000ms-budget van Websitebeheer blijven,
  // zodat de aanroeper niet zelf al getimeout is vóórdat dit antwoord er is.
  assert.ok(elapsedMs < 6500, `interne timeout had moeten afgaan rond 5000ms, duurde ${elapsedMs}ms`);
  assert.ok(elapsedMs < 8000 - 1000, "moet aantoonbaar marge overlaten onder het 8000ms-timeoutbudget van Websitebeheer");

  // Geen secretlekkage: het geconfigureerde secret mag nergens in de
  // (foutieve of succesvolle) responsbody voorkomen.
  assert.doesNotMatch(bodyText, /correct-secret/);
});

test("INDEXNOW DIAGNOSE: de tijdelijke faseinstrumentatie logt de verwachte fasen met een consistente correlation-id, lekt nergens het secret, en het functionele 401/200-contract blijft ongewijzigd", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.info = originalInfo;
  });
  globalThis.fetch = async (url, init) => (url === "https://api.indexnow.org/indexnow" ? new Response(null, { status: 200 }) : originalFetch(url, init));

  const traceLines = [];
  console.info = (...args) => {
    traceLines.push(String(args[0]));
  };

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`] }),
  });
  assert.equal(response.status, 200, "functioneel 200-contract mag niet veranderen door instrumentatie");
  const data = await response.json();
  assert.equal(data.success, true);

  const traces = traceLines.filter((line) => line.includes('"scope":"indexnow_trace"')).map((line) => JSON.parse(line));
  assert.ok(traces.length > 0, "verwacht minstens één indexnow_trace-logregel");

  const correlationIds = new Set(traces.map((entry) => entry.correlationId));
  assert.equal(correlationIds.size, 1, "alle trace-events van één request moeten dezelfde correlation-id delen");
  const [correlationId] = correlationIds;
  assert.match(correlationId, /^[a-f0-9]{16}$/, "correlation-id moet een willekeurige hexstring zijn, geen gebruikersinfo");

  const events = traces.map((entry) => entry.event);
  for (const expected of ["route_start", "auth_complete", "validation_complete", "external_fetch_start", "external_fetch_end", "response_return"]) {
    assert.ok(events.includes(expected), `verwacht event '${expected}' in de trace, kreeg: ${events.join(", ")}`);
  }
  // Volgorde moet chronologisch kloppen (elapsedMs niet-dalend binnen de trace).
  for (let index = 1; index < traces.length; index += 1) {
    assert.ok(traces[index].elapsedMs >= traces[index - 1].elapsedMs, "elapsedMs moet niet-dalend zijn binnen één request-trace");
  }

  const allTraceText = traceLines.join("\n");
  assert.doesNotMatch(allTraceText, /correct-secret/, "het secret mag nergens in de trace-logregels voorkomen");
  assert.doesNotMatch(allTraceText, /x-indexnow-trigger-secret/i, "geen headernamen/-waarden in de trace-logregels");
  assert.doesNotMatch(allTraceText, new RegExp(SITE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/platform"), "geen volledige request-URL's in de trace-logregels");
});

test("INDEXNOW DIAGNOSE: bij een hangende externe call logt de trace apart wanneer de AbortSignal afgaat én wanneer de fetch-promise daadwerkelijk settled, zonder secretlekkage, met ongewijzigd fail-open 200-contract", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.info = originalInfo;
  });
  globalThis.fetch = (url, init) => {
    if (url !== "https://api.indexnow.org/indexnow") return originalFetch(url, init);
    return new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        const error = new Error("The operation was aborted.");
        error.name = "AbortError";
        reject(error);
      });
    });
  };

  const traceLines = [];
  console.info = (...args) => {
    traceLines.push(String(args[0]));
  };

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`] }),
  });
  assert.equal(response.status, 200, "fail-open-contract mag niet veranderen door instrumentatie");
  const data = await response.json();
  assert.equal(data.success, false);

  const traces = traceLines.filter((line) => line.includes('"scope":"indexnow_trace"')).map((line) => JSON.parse(line));
  const events = traces.map((entry) => entry.event);
  assert.ok(events.includes("external_fetch_abort_signal_fired"), "verwacht dat het moment van abort() apart gelogd wordt");
  assert.ok(events.includes("external_fetch_error"), "verwacht dat het moment waarop de fetch-promise settled apart gelogd wordt");

  const abortEvent = traces.find((entry) => entry.event === "external_fetch_abort_signal_fired");
  const settleEvent = traces.find((entry) => entry.event === "external_fetch_error");
  assert.ok(abortEvent.elapsedMs >= 4900 && abortEvent.elapsedMs <= 5500, `abort-signaal had rond 5000ms moeten afgaan, was ${abortEvent.elapsedMs}ms`);
  assert.ok(
    settleEvent.elapsedMs >= abortEvent.elapsedMs,
    "de fetch-promise kan pas ná (of gelijktijdig met) het abort-signaal settlen",
  );

  const allTraceText = traceLines.join("\n");
  assert.doesNotMatch(allTraceText, /correct-secret/, "het secret mag nergens in de trace-logregels voorkomen, ook niet bij een fout");
});

test("POST /api/indexnow/submit?mode=full dient de volledige actuele sitemap in, geen aparte body nodig", async (t) => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.indexnow.org/indexnow") {
      calls.push(JSON.parse(init.body));
      return new Response(null, { status: 200 });
    }
    return originalFetch(url, init);
  };

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const response = await render("/api/indexnow/submit?mode=full", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret" },
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.submitted > 5, "volledige sitemap moet ruim meer dan een handvol URL's opleveren");
  assert.equal(calls.length, 1);
  assert.ok(calls[0].urlList.includes(`${SITE}/platform`));
  assert.ok(calls[0].urlList.every((entry) => entry.startsWith(SITE)));
});

test("/api/indexnow/submit valt al onder de bestaande robots.txt Disallow: /api/", async () => {
  const response = await render("/robots.txt", { env: commonEnv });
  const body = await response.text();
  assert.match(body, /Disallow: \/api\//);
});
