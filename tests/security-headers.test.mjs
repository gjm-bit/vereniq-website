import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SUPABASE_URL = "https://dflaokbbcbzdvkjhqztk.supabase.co";
const TURNSTILE_SITE_KEY = "0x0000000000000000000AA"; // dummy test key, never submitted anywhere

async function render(path, env = {}) {
  const previousValues = {};
  for (const [key, value] of Object.entries(env)) {
    previousValues[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `${Date.now()}-${path}`);
    const { default: worker } = await import(workerUrl.href);
    return await worker.fetch(
      new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
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

function parseCsp(header) {
  const directives = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [name, ...sources] = trimmed.split(/\s+/);
    directives[name] = sources;
  }
  return directives;
}

const commonEnv = { NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_SITE_KEY };

test("homepage CSP: Turnstile in script-src/frame-src, Supabase in img-src/connect-src, no wildcard", async () => {
  const response = await render("/", commonEnv);
  assert.equal(response.status, 200);
  const directives = parseCsp(response.headers.get("content-security-policy"));

  assert.ok(directives["script-src"].includes("https://challenges.cloudflare.com"));
  assert.ok(directives["frame-src"]?.includes("https://challenges.cloudflare.com"));
  assert.ok(directives["img-src"].includes(SUPABASE_URL));
  assert.ok(directives["connect-src"].includes(SUPABASE_URL));
  assert.ok(!directives["img-src"].includes("*"));
  assert.ok(!directives["connect-src"].includes("*"));
});

test("script-src stays closed: nonce present, no 'unsafe-inline', no 'unsafe-eval', no wildcard", async () => {
  const response = await render("/", commonEnv);
  const scriptSrc = parseCsp(response.headers.get("content-security-policy"))["script-src"];
  assert.ok(scriptSrc.includes("'self'"));
  assert.ok(scriptSrc.some((source) => /^'nonce-[A-Za-z0-9+/=]+'$/.test(source)), "script-src must carry a nonce token");
  assert.ok(!scriptSrc.includes("'unsafe-inline'"));
  assert.ok(!scriptSrc.includes("'unsafe-eval'"));
  assert.ok(!scriptSrc.includes("*"));
  assert.deepEqual(scriptSrc.filter((source) => source.startsWith("http")), ["https://challenges.cloudflare.com"]);
});

test("security posture that must survive unchanged: frame-ancestors/base-uri/form-action", async () => {
  const response = await render("/", commonEnv);
  const directives = parseCsp(response.headers.get("content-security-policy"));
  assert.deepEqual(directives["frame-ancestors"], ["'none'"]);
  assert.deepEqual(directives["base-uri"], ["'self'"]);
  assert.deepEqual(directives["form-action"], ["'self'"]);
});

test("each request gets a fresh nonce, and vinext stamps it onto its own inline scripts", async () => {
  const first = await render("/", commonEnv);
  const firstNonce = parseCsp(first.headers.get("content-security-policy"))["script-src"].find((s) => s.startsWith("'nonce-"))?.slice(7, -1);
  const second = await render("/", commonEnv);
  const secondNonce = parseCsp(second.headers.get("content-security-policy"))["script-src"].find((s) => s.startsWith("'nonce-"))?.slice(7, -1);
  assert.ok(firstNonce && secondNonce && firstNonce !== secondNonce, "nonce must be regenerated per request");

  const html = await first.text();
  const inlineScripts = (html.match(/<script(?![^>]*\ssrc=)[^>]*>/g) ?? []).filter((tag) => !tag.includes('type="application/ld+json"'));
  assert.ok(inlineScripts.length > 0, "expected at least one inline hydration script to check");
  for (const tag of inlineScripts) assert.ok(tag.includes(`nonce="${firstNonce}"`), `inline script missing nonce: ${tag}`);
});

test("without NEXT_PUBLIC_SUPABASE_URL configured, img-src/connect-src safely omit the Supabase origin instead of erroring", async () => {
  const response = await render("/", { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_SITE_KEY });
  assert.equal(response.status, 200);
  const directives = parseCsp(response.headers.get("content-security-policy"));
  assert.deepEqual(directives["img-src"], ["'self'", "data:"]);
  assert.deepEqual(directives["connect-src"], ["'self'"]);
});

test("/proefabonnement renders (no soft-404) and the Turnstile widget mounts with the same CSP", async () => {
  const response = await render("/proefabonnement", commonEnv);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /turnstile-slot/);
  assert.doesNotMatch(html, /Pagina niet gevonden/i);
  const directives = parseCsp(response.headers.get("content-security-policy"));
  assert.ok(directives["script-src"].includes("https://challenges.cloudflare.com"));
  assert.ok(directives["frame-src"]?.includes("https://challenges.cloudflare.com"));
});

test("vercel.json keeps X-Frame-Options/X-Content-Type-Options/Referrer-Policy as static platform headers", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const headerBlock = config.headers?.find((entry) => entry.source === "/(.*)");
  assert.ok(headerBlock, "vercel.json must still declare a catch-all headers rule");
  const byKey = Object.fromEntries(headerBlock.headers.map((h) => [h.key, h.value]));
  assert.equal(byKey["X-Frame-Options"], "DENY");
  assert.equal(byKey["X-Content-Type-Options"], "nosniff");
  assert.equal(byKey["Referrer-Policy"], "strict-origin-when-cross-origin");
  // CSP moved to proxy.ts (needs a per-request nonce, which a static vercel.json value can never provide) -
  // vercel.json must NOT also declare it, to avoid two conflicting Content-Security-Policy headers on the same response.
  assert.equal(byKey["Content-Security-Policy"], undefined);
});

test("security.txt (RFC 9116) remains published", async () => {
  const content = await readFile(new URL("../public/.well-known/security.txt", import.meta.url), "utf8");
  assert.match(content, /Contact:\s*mailto:/);
  assert.match(content, /Expires:/);
});
