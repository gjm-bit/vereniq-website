import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Root cause (proven, not assumed): Websitebeheer's "Veilig voorbeeld"
// (master-beheer/src/app/org/[organizationId]/website/paginas/[pageId].tsx)
// embeds exactly this site's /_cms-preview (rewritten to /cms-preview) in an
// <iframe>, pointed at getPublicPreviewUrl() from master-beheer/src/services/
// website-preview.ts. Since Website P0 (proxy.ts), every route - including
// this one - sent `X-Frame-Options: DENY` (vercel.json) and
// `frame-ancestors 'none'` (proxy.ts), so that iframe was always blocked.
// The browser still fires the iframe's onLoad event for a refused frame,
// which is why Websitebeheer showed a false "Preview bijgewerkt" checkmark
// over a grey/broken pane instead of a failure state - a separate, UX-level
// bug fixed on the Websitebeheer side, not here.
//
// Fix here is intentionally narrow: exactly /cms-preview and /_cms-preview
// trust exactly https://beheer.meervereniging.nl to frame them (no
// wildcard, no parent-domain pattern) and drop the unconditional
// X-Frame-Options veto for those two paths only. Every other public route
// keeps `X-Frame-Options: DENY` + `frame-ancestors 'none'` unchanged.

const SUPABASE_URL = "https://dflaokbbcbzdvkjhqztk.supabase.co";
const TURNSTILE_SITE_KEY = "0x0000000000000000000AA"; // dummy test key, never submitted anywhere
const commonEnv = { NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_SITE_KEY };
const TRUSTED_ORIGIN = "https://beheer.meervereniging.nl";

async function render(path, env = commonEnv) {
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

function frameAncestors(response) {
  const csp = response.headers.get("content-security-policy");
  const directive = csp.split(";").map((part) => part.trim()).find((part) => part.startsWith("frame-ancestors"));
  return directive.replace(/^frame-ancestors\s*/, "");
}

test("proxy.ts scopes the trusted preview parent to the exact production Websitebeheer origin - no wildcard, no parent-domain pattern", async () => {
  const source = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.match(source, /CMS_PREVIEW_TRUSTED_PARENT_ORIGIN = "https:\/\/beheer\.meervereniging\.nl"/);
  assert.doesNotMatch(source, /\*\.meervereniging\.nl/, "no parent-domain wildcard for the trusted preview origin");
  assert.match(source, /CMS_PREVIEW_PATHS = new Set\(\["\/cms-preview", "\/_cms-preview"\]\)/);
});

test("regular public routes (/, /proefabonnement) stay non-frameable: frame-ancestors 'none'", async () => {
  for (const path of ["/", "/proefabonnement"]) {
    const response = await render(path);
    assert.equal(frameAncestors(response), "'none'", `${path} must keep frame-ancestors 'none'`);
  }
});

test("the CMS preview route trusts exactly the Websitebeheer origin to frame it - not 'none', not '*', not any other origin", async () => {
  for (const path of ["/cms-preview", "/_cms-preview"]) {
    const response = await render(path);
    assert.equal(frameAncestors(response), TRUSTED_ORIGIN, `${path} must scope frame-ancestors to exactly ${TRUSTED_ORIGIN}`);
  }
});

test("an unknown nested route is not mistaken for the preview route", async () => {
  const response = await render("/cms-preview-lookalike");
  assert.equal(frameAncestors(response), "'none'");
});

test("/cms-preview still enforces its own token handling: missing token fails cleanly with a Dutch, non-technical message, never renders live content", async () => {
  const source = await readFile(new URL("../src/components/cms-preview-page.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(!token\) return <PreviewError kind="missing-token" \/>;/);
  assert.match(source, /"Voorbeeld niet beschikbaar"/);
  assert.match(source, /"Dit conceptvoorbeeld is verlopen of niet toegankelijk\."/, "expired/invalid tokens must fail with a clear Dutch message, not a technical one");
  // Scoped to the user-visible copy block only - the surrounding source is allowed to
  // document the framing/CSP root cause in comments, just never show that jargon to the editor.
  const copyBlockStart = source.indexOf("const copy = {");
  const copyBlockEnd = source.indexOf("}[kind];");
  const copyBlock = source.slice(copyBlockStart, copyBlockEnd);
  assert.doesNotMatch(copyBlock, /CSP|frame-ancestors|X-Frame-Options|iframe/i, "the preview page's visible copy must never surface framing/CSP jargon to the editor");
});

test("/cms-preview HTTP response still succeeds (200) so the framing fix doesn't regress the route itself", async () => {
  const response = await render("/cms-preview");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Voorbeeld niet beschikbaar/, "no token in this test render, so the clean missing-token state is expected, not a crash");
});

test("preview status signal: a failure state posts ok:false to the trusted parent origin, with the nonce the browser will actually enforce", async () => {
  const response = await render("/cms-preview");
  const html = await response.text();
  const nonce = frameAncestors(response) && (response.headers.get("content-security-policy") ?? "").match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];
  assert.ok(nonce, "expected a nonce in the CSP header");
  const scriptMatch = html.match(/<script nonce="([^"]*)">try\{window\.parent\.postMessage\((\{[^)]*\}),("[^"]*")\);\}catch\(e\)\{\}<\/script>/);
  assert.ok(scriptMatch, "expected a postMessage status-signal script in the missing-token response");
  assert.equal(scriptMatch[1], nonce, "the signal script's nonce must match the CSP header nonce, or the browser blocks it");
  assert.equal(scriptMatch[3], JSON.stringify(TRUSTED_ORIGIN), "the signal must target exactly the trusted Websitebeheer origin, not '*'");
  const payload = JSON.parse(scriptMatch[2]);
  assert.equal(payload.ok, false);
  assert.equal(payload.reason, "missing-token");
  assert.equal(payload.source, "meer-vereniging-cms-preview");
});
