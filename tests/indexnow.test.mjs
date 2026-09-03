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
