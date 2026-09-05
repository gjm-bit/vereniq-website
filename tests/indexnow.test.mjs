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

async function render(path, { env = {}, method = "GET", headers = {}, body, duplex } = {}) {
  const previousValues = {};
  for (const [key, value] of Object.entries(env)) {
    previousValues[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `${Date.now()}-${path}-${method}`);
    const { default: worker } = await import(workerUrl.href);
    // `duplex: "half"` is alleen nodig (en alleen toegestaan) wanneer `body`
    // een `ReadableStream` is - exact zoals het echte, door vinext
    // gegenereerde `api/handler.mjs` dit voor iedere niet-GET/HEAD-request
    // opbouwt (`Readable.toWeb(req)` + `duplex: "half"`), zodat deze tests
    // hetzelfde streaming-bodygedrag nabootsen als productie.
    const init = duplex ? { method, headers, body, duplex } : { method, headers, body };
    return await worker.fetch(
      new Request(`http://localhost${path}`, init),
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

test("POST /api/indexnow/submit: ongeldige JSON in de body geeft 400 invalid_request, geen secretlekkage", async () => {
  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: "dit-is-geen-geldige-json",
  });
  assert.equal(response.status, 400);
  const bodyText = await response.text();
  assert.equal(JSON.parse(bodyText).code, "invalid_request");
  assert.doesNotMatch(bodyText, /correct-secret/, "het secret mag nergens in de responsbody voorkomen, ook niet bij een parse-fout");
});

test("FIX: een hangende requestbody (nooit sluitende stream) laat de respons NIET wachten tot Vercel's 300s-limiet - gecontroleerde 408 request_body_timeout, ruim binnen Websitebeheer se 8000ms-budget, external_fetch_start wordt NIET bereikt", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  // Nooit externe IndexNow-aanroepen mogen plaatsvinden in dit scenario -
  // een aanroep hier zou een testfout veroorzaken. Dit is de directe,
  // functionele manier om te bewijzen dat external_fetch_start nooit
  // bereikt wordt bij een body-timeout.
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.indexnow.org/indexnow") throw new Error("external_fetch_start had NOOIT bereikt mogen worden bij een body-timeout");
    return originalFetch(url, init);
  };

  // Simuleert exact het bewezen live scenario: een `ReadableStream` die
  // nooit `enqueue`/`close` aanroept - dus een `request.json()` die
  // permanent zou blijven hangen zonder de nieuwe timeout.
  //
  // Bewust GEEN assertie hier dat de `cancel()` van *deze* stream wordt
  // aangeroepen: vinext's eigen routing (`request-pipeline.js`,
  // `cloneRequestWithUrl`/`cloneRequestWithHeaders`, gebruikt voor de
  // interne `?path=`-herschrijving die ook de echte Vercel-adapter
  // toepast) bouwt de `Request` intern opnieuw op vóórdat de route hem
  // ziet - rechtstreeks tegen een kale `Request` bewezen dat
  // `readJsonBodyWithTimeout`'s `reader.cancel()` de onderliggende bron
  // wél daadwerkelijk aanspreekt (zie het commentaar in
  // `indexnow-body-read.ts`), maar via déze end-to-end pipeline is dat
  // niet meer op deze manier waarneembaar. Wat hier wél aantoonbaar en
  // doorslaggevend is: de respons zelf blokkeert niet.
  const neverClosingStream = new ReadableStream({
    start() {
      // Bewust leeg - de stream levert nooit data en sluit nooit.
    },
  });

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const startedAt = Date.now();
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: neverClosingStream,
    duplex: "half",
  });
  const elapsedMs = Date.now() - startedAt;
  const bodyText = await response.text();

  assert.equal(response.status, 408, "een hangende body moet een gecontroleerde 408 opleveren, geen 500 en geen hang");
  const data = JSON.parse(bodyText);
  assert.equal(data.success, false);
  assert.equal(data.code, "request_body_timeout");

  // De kern van de fix: ruim binnen de gekozen 2000ms-grens (met marge
  // voor testomgevingsjitter), en ver onder Websitebeheer se 8000ms-budget.
  assert.ok(elapsedMs < 2800, `body-read-timeout had rond 2000ms moeten afgaan, duurde ${elapsedMs}ms`);
  assert.ok(elapsedMs < 8000 - 1000, "moet aantoonbaar marge overlaten onder het 8000ms-timeoutbudget van Websitebeheer");
  assert.doesNotMatch(bodyText, /correct-secret/, "het secret mag nergens in de responsbody voorkomen bij een body-timeout");
});

test("FIX: als de hangende body ALSNOG (ná de timeoutrespons) alsnog geldige JSON oplevert, veroorzaakt dat geen unhandled rejection, geen tweede respons en geen alsnog uitgevoerde IndexNow-submit", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  let externalFetchCalled = false;
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.indexnow.org/indexnow") {
      externalFetchCalled = true;
      return new Response(null, { status: 200 });
    }
    return originalFetch(url, init);
  };

  const unhandledRejections = [];
  const onUnhandledRejection = (reason) => {
    unhandledRejections.push(reason);
  };
  process.on("unhandledRejection", onUnhandledRejection);
  t.after(() => {
    process.off("unhandledRejection", onUnhandledRejection);
  });

  // Levert pas ná de 2000ms-body-read-timeout alsnog een geldige body -
  // simuleert een trage/vertraagd binnenkomende stream die uiteindelijk
  // wél voltooit, ruim nadat de route al heeft geantwoord.
  //
  // De `try/catch` hier is zelf onderdeel van het bewijs (vinext-
  // upgradeproef, PR #2741): vóór de upgrade tee'de vinext's eigen
  // `NextRequest`-constructor de body, waardoor `reader.cancel()` in
  // `readJsonBodyWithTimeout` nooit echt bij DEZE teststream aankwam - een
  // late `enqueue()` op een "gecancelde" stream faalde dus nooit. Ná de
  // upgrade wordt de body overgedragen i.p.v. getee'd, dus cancellatie
  // bereikt nu wél de echte controller, en een late `enqueue()` gooit
  // terecht "Controller is already closed". Dat is precies het gedrag dat
  // een reële streambron sowieso zelf zou moeten afvangen (nooit enqueuen
  // op een gecancelde stream) - vandaar de vangst hier, niet als
  // work-around maar als correcte streambron-implementatie.
  const encoder = new TextEncoder();
  const lateStream = new ReadableStream({
    start(controller) {
      setTimeout(() => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify({ urls: [`${SITE}/platform`] })));
          controller.close();
        } catch {
          // Verwacht ná de vinext-upgrade: de stream is dan al echt
          // gecanceld (zie toelichting hierboven) - geen actie nodig.
        }
      }, 2500);
    },
  });

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: lateStream,
    duplex: "half",
  });

  assert.equal(response.status, 408);
  assert.equal((await response.json()).code, "request_body_timeout");

  // Wacht ruim voorbij het moment waarop de late stream alsnog voltooit,
  // om te bewijzen dat dat geen alsnog-effecten meer heeft.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  assert.equal(externalFetchCalled, false, "een later alsnog voltooide body mag nooit alsnog tot een IndexNow-submit leiden");
  assert.deepEqual(unhandledRejections, [], "een later alsnog resolvende/rejectende request.json()-promise mag nooit een unhandled rejection veroorzaken");
});

test("FIX: geldige, snel beschikbare body blijft de bestaande flow volgen - external_fetch_start wordt bereikt, ongewijzigd 200-contract", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  let externalFetchCalled = false;
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.indexnow.org/indexnow") {
      externalFetchCalled = true;
      return new Response(null, { status: 200 });
    }
    return originalFetch(url, init);
  };

  const env = { ...commonEnv, INDEXNOW_TRIGGER_SECRET: "correct-secret" };
  const response = await render("/api/indexnow/submit", {
    env,
    method: "POST",
    headers: { "x-indexnow-trigger-secret": "correct-secret", "content-type": "application/json" },
    body: JSON.stringify({ urls: [`${SITE}/platform`] }),
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(externalFetchCalled, true, "een geldige, snelle body moet de bestaande IndexNow-flow gewoon bereiken");
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
