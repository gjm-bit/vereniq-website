import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("header and footer render the exact same official, transparent logo source (single Brand component)", async () => {
  const html = await (await render()).text();
  const brandBlocks = html.match(/<a class="brand"[^>]*>[\s\S]*?<\/a>/g) ?? [];
  assert.ok(brandBlocks.length >= 2, "verwacht minstens een header- en een footer-brandblok");
  for (const block of brandBlocks) {
    assert.match(block, /src="\/brand\/meer-vereniging-symbol\.png"/, "moet het officiële, uitsluitend-transparant-gemaakte M-symbool gebruiken, geen andere asset");
    assert.match(block, /alt=""/, "het icoon is decoratief; de zichtbare wordmark-tekst en aria-label dragen de betekenis");
  }
});

test("no white logo box: header/footer never fall back to the old opaque full lockup or a background-filter hack", async () => {
  const shellSource = await readFile(new URL("../src/components/site-shell.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(shellSource, /meer-vereniging-brand-lockup\.png/, "de opaque bronafbeelding (geen alphakanaal) mag niet meer als zichtbaar logo worden gebruikt");
  const brandCss = await readFile(new URL("../app/header-footer-branding.css", import.meta.url), "utf8");
  const brandDirectionCss = await readFile(new URL("../app/brand-direction.css", import.meta.url), "utf8");
  assert.doesNotMatch(brandCss + brandDirectionCss, /brightness\(0\)\s*invert\(1\)/, "geen filter-truc die op een niet-transparante asset een dichtgeverfd wit vlak oplevert");
});

test("wordmark and tagline are real HTML text (not baked into the logo raster), for contrast independent of the source asset's own colors", async () => {
  const html = await (await render()).text();
  assert.match(html, /<span class="brand-word">Meer Vereniging<\/span>/);
  assert.match(html, /<span class="brand-tagline">Minder regelen\. Meer verenigen\.<\/span>/);
  const css = await readFile(new URL("../app/header-footer-branding.css", import.meta.url), "utf8");
  assert.match(css, /\.brand-word\s*{[^}]*color:\s*var\(--brand-white\)/, "wordmark moet de lichte huisstijlkleur gebruiken, niet de eigen (op navy onleesbare) logo-kleur");
});

test("footer falls back cleanly to the official Brand when no CMS logo is configured (no broken/empty box)", async () => {
  const html = await (await render()).text();
  const footerHtml = html.slice(html.indexOf("<footer"));
  assert.match(footerHtml, /class="brand"/, "zonder CMS-logo (huidige productiestatus) toont de footer het officiële Brand-component");
  assert.doesNotMatch(footerHtml, /src=""/, "geen lege/kapotte src");
});

test("social platform config: exactly Facebook, Instagram, YouTube, LinkedIn in that order — WhatsApp intentionally deferred", async () => {
  const shellSource = await readFile(new URL("../src/components/site-shell.tsx", import.meta.url), "utf8");
  const socialIconsBlock = shellSource.match(/export const SOCIAL_ICONS[\s\S]*?\n};/)?.[0] ?? "";
  const declaredKeys = [...socialIconsBlock.matchAll(/^\s*(\w+):\s*{\s*label:\s*"([^"]+)"/gm)].map(([, key, label]) => ({ key, label }));
  assert.deepEqual(declaredKeys.map((entry) => entry.key), ["facebook", "instagram", "youtube", "linkedin"]);
  assert.deepEqual(declaredKeys.map((entry) => entry.label), ["Facebook", "Instagram", "YouTube", "LinkedIn"]);
  assert.doesNotMatch(shellSource, /whatsapp/i, "WhatsApp is bewust uitgesteld naar een apart, in feestbende-app (master-beheer/foundation) te autoriseren stuk werk — zie EINDRAPPORT");
});

test("social links only ever render for platforms with a configured URL, always with safe target/rel and an aria-label", async () => {
  const shellSource = await readFile(new URL("../src/components/site-shell.tsx", import.meta.url), "utf8");
  assert.match(shellSource, /\.filter\(\(entry\) => entry\.url\)/, "footer-social moet platformen zonder URL wegfilteren, niet als kapotte/lege knop tonen");
  assert.match(shellSource, /target="_blank" rel="noreferrer noopener"/);
  assert.match(shellSource, /aria-label=\{icon\.label\}/);
  assert.match(shellSource, /aria-hidden="true"/, "het svg-icoon zelf moet decoratief zijn voor screenreaders");
});

test("footer legal/information links remain present", async () => {
  const html = await (await render()).text();
  for (const path of ["/privacy", "/cookies", "/algemene-voorwaarden", "/beveiliging", "/data-opslag"]) {
    assert.match(html, new RegExp(`href="${path}"`));
  }
});

test("footer bottom bar has a subtle divider, the exact copyright line, and repeats the core legal links", async () => {
  const html = await (await render()).text();
  const bottomMatch = html.match(/<div class="footer-bottom container">([\s\S]*?)<\/div>/);
  assert.ok(bottomMatch, "verwacht een footer-bottom bar in de gerenderde HTML");
  const bottom = bottomMatch[1];
  assert.match(bottom, /© 2026 Meer Vereniging\. Alle rechten voorbehouden\./);
  assert.match(bottom, /href="\/privacy"/);
  assert.match(bottom, /href="\/cookies"/);
  assert.match(bottom, /href="\/algemene-voorwaarden"/);
  const css = await readFile(new URL("../app/header-footer-branding.css", import.meta.url), "utf8");
  assert.match(css, /\.footer-bottom\s*{[^}]*border-top:/, "verwacht een subtiele divider boven de onderste balk");
});

test("public branding read path stays on the existing narrow anon RPC/storage route — no widened access introduced", async () => {
  const publicCms = await readFile(new URL("../src/lib/public-cms.ts", import.meta.url), "utf8");
  assert.match(publicCms, /website_public_organization_footer/);
  assert.match(publicCms, /storage\/v1\/object\/sign\/organization-branding\//, "logo blijft via een verse signed URL, geen publieke bucket-listing");
  assert.doesNotMatch(publicCms, /SUPABASE_SERVICE_ROLE_KEY/, "de publieke website mag nooit de service-role key gebruiken");
});
