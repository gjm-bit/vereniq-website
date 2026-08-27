import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// PROEFABONNEMENT FASE 3 (publieke website) - dekt de nieuwe /proefabonnement-
// en /proefabonnement/activeren-pagina's, de twee server-only API-routes en
// de bijbehorende server-libs. Controleert vooral de eigenschappen die niet
// door de rendered-html-suite (build-afhankelijk) gedekt worden: dat
// service_role/Resend/Turnstile-geheimen nooit in een 'use client'-bestand
// voorkomen, dat de nieuwe CTA's naar /proefabonnement wijzen, dat dedupe/
// rate-limit/verlopen/ongeldig/needs_review-statussen correct worden
// vertaald, en dat er geen hexcodes als zichtbare tekst worden getoond.

const read = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("service_role/Resend/Turnstile-geheimen verschijnen nooit in een client-bestand", async () => {
  const clientFiles = [
    "src/components/trial-signup-form.tsx",
    "src/components/trial-activation-status.tsx",
    "src/components/turnstile-widget.tsx",
    "app/proefabonnement/page.tsx",
  ];
  for (const path of clientFiles) {
    const source = await read(path);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|TURNSTILE_SECRET_KEY/, `${path} mag geen server-only geheim bevatten`);
  }
});

test("de twee nieuwe API-routes gebruiken uitsluitend de service_role-only RPC's, nooit een directe tabelschrijving", async () => {
  const aanvraag = await read("app/api/proefabonnement/aanvraag/route.ts");
  assert.match(aanvraag, /admin\.rpc\('platform_trial_signup_request', \{/);
  assert.doesNotMatch(aanvraag, /\.from\('public_trial_signups'\)/);
  assert.match(aanvraag, /verifyTurnstileToken\(turnstileToken, visitorIp\)/, "Turnstile wordt server-side geverifieerd, niet alleen vertrouwd vanaf de client");

  const activeren = await read("app/api/proefabonnement/activeren/route.ts");
  assert.match(activeren, /admin\.rpc\('platform_trial_signup_activate_create_org', \{/);
  assert.match(activeren, /admin\.rpc\('platform_trial_signup_begin_bootstrap_admin', \{/);
  assert.match(activeren, /admin\.rpc\('platform_trial_signup_bind_bootstrap_admin', /);
  assert.match(activeren, /admin\.rpc\('platform_trial_signup_prepare_bootstrap_admin', \{/);
});

test("stille dedupe: signup_already_pending wordt vertaald naar exact dezelfde succesrespons (geen enumeratie)", async () => {
  const source = await read("app/api/proefabonnement/aanvraag/route.ts");
  const dedupeBlockStart = source.indexOf("signup_already_pending");
  const dedupeBlock = source.slice(dedupeBlockStart, dedupeBlockStart + 300);
  assert.match(dedupeBlock, /success: true/, "dedupe geeft success:true terug, geen foutcode die het bestaan van het e-mailadres verklapt");
});

test("rate-limit krijgt een eigen, herkenbare status (IP-gebonden, geen e-mailenumeratie)", async () => {
  const source = await read("app/api/proefabonnement/aanvraag/route.ts");
  assert.match(source, /code: 'rate_limited'/);
  assert.match(source, /429/);
});

test("activeren: verlopen en ongeldig/al-gebruikt zijn twee verschillende, nette statussen - nooit een technische foutmelding", async () => {
  const route = await read("app/api/proefabonnement/activeren/route.ts");
  assert.match(route, /status: 'expired'/);
  assert.match(route, /status: 'invalid'/);
  assert.match(route, /status: 'already_active'/, "een al volledig geactiveerde omgeving krijgt een eigen 'log in'-status, niet dezelfde 'opnieuw aanvragen'-status als een kapotte link");

  const statusComponent = await read("src/components/trial-activation-status.tsx");
  assert.match(statusComponent, /Deze link is verlopen/);
  assert.match(statusComponent, /Deze link is ongeldig/);
  assert.match(statusComponent, /is al actief/);
  assert.match(statusComponent, /Opnieuw aanvragen/);
});

test("needs_review is structureel onzichtbaar voor de bezoeker - de RPC-respons bevat het veld niet, dus de website kan het nooit tonen", async () => {
  const route = await read("app/api/proefabonnement/aanvraag/route.ts");
  assert.doesNotMatch(route, /needs_review/i, "de aanvraagroute leest/toont needs_review niet - dat blijft uitsluitend zichtbaar voor een platformoperator in Master Beheer");
});

test("kleurpresets: geen hexcode wordt ooit als zichtbare tekst getoond, alleen als CSS-achtergrond van de swatch", async () => {
  const form = await read("src/components/trial-signup-form.tsx");
  assert.match(form, /style=\{\{ background: `linear-gradient\(135deg, \$\{preset\.primaryColor\}, \$\{preset\.secondaryColor\}\)` \}\}/, "hex-waarden worden alleen gebruikt om de achtergrondkleur van de swatch te zetten");
  assert.doesNotMatch(form, />#\{|\{preset\.primaryColor\}<|\{preset\.secondaryColor\}</, "geen hexcode wordt als platte tekstinhoud gerenderd");
});

test("logo-upload komt niet voor in het aanvraagformulier (pas na verificatie, niet in Fase 3)", async () => {
  const form = await read("src/components/trial-signup-form.tsx");
  assert.doesNotMatch(form, /logo|upload/i);
});

test("dynamische proefduur: geen hardcoded getal in de nieuwe websitecopy, altijd via website_public_trial_period()", async () => {
  const publicTrial = await read("src/lib/public-trial.ts");
  assert.match(publicTrial, /callPublicRpc<readonly \{ default_trial_period_days: number \}\[\]>\('website_public_trial_period'\)/);
  assert.match(publicTrial, /callPublicRpc<readonly \{[\s\S]*?\}\[\]>\('website_public_trial_color_presets'\)/);

  const formSource = await read("src/components/trial-signup-form.tsx");
  assert.doesNotMatch(formSource, /\b30\s*dagen\b/i, "de dagen-tekst is altijd afgeleid van initialTrialDays, nooit een letterlijk getal in de component");
});

test("veilige cache/fallback: een mislukte RPC-aanroep geeft null/lege lijst terug i.p.v. te crashen, en de CTA blijft dan dagen-neutraal werken", async () => {
  const publicTrial = await read("src/lib/public-trial.ts");
  assert.match(publicTrial, /return trialPeriodCache\?\.value \?\? null;/, "stale-while-error: een eerder bekende waarde overleeft een RPC-storing");
  assert.match(publicTrial, /return colorPresetsCache\?\.value \?\? \[\];/);

  const formSource = await read("src/components/trial-signup-form.tsx");
  assert.match(formSource, /const heroLabel = initialTrialDays \? `Probeer \$\{initialTrialDays\} dagen gratis` : "Probeer gratis";/, "zonder bekende proefduur toont de pagina een werkende, dagen-neutrale CTA i.p.v. te breken");
});

test("de homepage-CTA's ('Probeer gratis') wijzen naar /proefabonnement, niet meer naar /demo", async () => {
  const header = await read("src/components/site-shell.tsx");
  const mobileMenu = await read("src/components/mobile-menu.tsx");
  assert.match(header, /<Link className="btn btn-primary" href="\/proefabonnement">Probeer gratis<\/Link>/);
  assert.match(mobileMenu, /<Link href="\/proefabonnement" onClick=\{\(\)=>setOpen\(false\)\}>Probeer gratis<\/Link>/);
  // De aparte "Vraag een demo aan"-route (andere intentie: begeleide demo) blijft ongewijzigd bestaan.
  assert.match(await read("app/platform/page.tsx"), /href="\/demo">Vraag een demo aan<\/Link>/);
});

test("de activatielink in de verificatiemail wijst altijd naar meervereniging.nl (NEXT_PUBLIC_SITE_URL, met dat domein als harde fallback)", async () => {
  const route = await read("app/api/proefabonnement/aanvraag/route.ts");
  assert.match(route, /const siteUrl = process\.env\.NEXT_PUBLIC_SITE_URL \|\| 'https:\/\/meervereniging\.nl';/);
  assert.match(route, /new URL\('\/proefabonnement\/activeren', siteUrl\)/);
});

test("na activatie wordt doorverwezen naar de bestaande wachtwoord-instellen-flow (mijn.feestbende.nl/auth/reset-password), niet naar een nieuwe, nog niet gebouwde Fase 4-pagina", async () => {
  const route = await read("app/api/proefabonnement/activeren/route.ts");
  assert.match(route, /const INVITE_REDIRECT = 'https:\/\/mijn\.feestbende\.nl\/auth\/reset-password';/);
});
