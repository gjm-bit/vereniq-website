// PROEFABONNEMENT FASE 3 — publieke aanvraagroute. Draait uitsluitend
// server-side (Next.js/vinext Route Handler): valideert Turnstile, hasht
// het IP, roept de service_role-only RPC platform_trial_signup_request
// aan (zie supabase/migrations/20260827180000_..._foundation.sql in het
// master-beheer-monorepo) en verstuurt de verificatiemail. De
// service_role-sleutel verlaat deze functie nooit - de client krijgt altijd
// alleen een neutrale { success, code, message }-respons terug.
//
// ANTI-ENUMERATIE: een "deze aanvraag staat al open"-fout van de RPC
// (23505, stille dedupe) wordt hier vertaald naar exact dezelfde
// succesrespons als een verse aanvraag - een bezoeker kan zo nooit afleiden
// of een e-mailadres al bekend is. Rate-limiting (53400) is wel als eigen,
// herkenbare status zichtbaar: dat is IP-gebonden, niet e-mailadres-
// gebonden, en lekt dus geen accountinformatie.

import { AccountInvitationFlowError, withInvitationDeadline } from '@/src/lib/server/account-invitation-flow';
import { getPublicTrialColorPresets } from '@/src/lib/public-trial';
import { extractVisitorIp, hashVisitorIp } from '@/src/lib/server/request-ip-hash';
import { createServerSupabaseAdminClient } from '@/src/lib/server/supabase-admin';
import { sendTrialSignupVerificationEmail } from '@/src/lib/server/trial-signup-email';
import { verifyTurnstileToken } from '@/src/lib/server/turnstile';

export const runtime = 'nodejs';

const MAX_NAME_LENGTH = 160;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Zelfde waarde als master-beheer/api/organization-bootstrap-admin.ts en
// als deze routes eigen activeren/route.ts - bewuste, al bewezen deadline
// rond de mailprovider-aanroep (zie het mailflow-vergelijkingsrapport).
const EMAIL_PROVIDER_TIMEOUT_MS = 10_000;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function cleanString(value: unknown, maximum: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function rpcErrorMessage(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : '';
}

function correlationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `trial-signup-${Date.now().toString(36)}`;
}

// Diagnostische fase-logging (zelfde conventie/reden als phaseLog() in
// master-beheer/api/organization-bootstrap-admin.ts): logt VÓÓR en NA elke
// externe aanroep, zodat een Vercel-functietimeout die het proces hard
// afbreekt (geen catch/finally komt dan meer weg) toch een tijdstip-bewijs
// achterlaat van de laatst gestarte fase. Uitsluitend niet-herleidbare
// metadata - nooit e-mail/naam/token/IP/request-body/secrets.
function phaseLog(correlation: string, phase: string, requestStartedAt: number, extra?: Record<string, unknown>) {
  console.info(`[trial-signup-route] ${JSON.stringify({ correlationId: correlation, phase, elapsedMs: Date.now() - requestStartedAt, ...extra })}`);
}

function respond(
  correlation: string,
  requestStartedAt: number,
  body: { success: boolean; code?: string; [key: string]: unknown },
  status = 200,
) {
  phaseLog(correlation, 'request_done', requestStartedAt, { success: body.success, code: body.code ?? null, status });
  return json(body, status);
}

export async function POST(request: Request) {
  const correlation = correlationId();
  const requestStartedAt = Date.now();
  phaseLog(correlation, 'request_started', requestStartedAt);

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return respond(correlation, requestStartedAt, { success: false, code: 'invalid_request', message: 'Ongeldige aanvraag.' }, 400);
  }
  if (!body) return respond(correlation, requestStartedAt, { success: false, code: 'invalid_request', message: 'Ongeldige aanvraag.' }, 400);

  const organizationName = cleanString(body.organizationName, MAX_NAME_LENGTH);
  const contactName = cleanString(body.contactName, MAX_NAME_LENGTH);
  const contactEmail = cleanString(body.contactEmail, 320).toLowerCase();
  const colorPresetKey = cleanString(body.colorPresetKey, 60);
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

  if (organizationName.length < 2) {
    return respond(correlation, requestStartedAt, { success: false, code: 'invalid_request', field: 'organizationName', message: 'Vul de naam van je vereniging in (minimaal 2 tekens).' }, 400);
  }
  if (contactName.length < 2) {
    return respond(correlation, requestStartedAt, { success: false, code: 'invalid_request', field: 'contactName', message: 'Vul je naam in (minimaal 2 tekens).' }, 400);
  }
  if (!EMAIL_PATTERN.test(contactEmail)) {
    return respond(correlation, requestStartedAt, { success: false, code: 'invalid_request', field: 'contactEmail', message: 'Vul een geldig e-mailadres in.' }, 400);
  }
  if (!colorPresetKey) {
    return respond(correlation, requestStartedAt, { success: false, code: 'invalid_request', field: 'colorPresetKey', message: 'Kies een kleurstijl.' }, 400);
  }

  // Defensieve, publiek-leesbare controle vooraf (de RPC controleert dit
  // ook zelf, maar zo krijgt een gemanipuleerd/verouderd preset direct een
  // duidelijke veldfout i.p.v. een generieke serverfout).
  phaseLog(correlation, 'color_presets_start', requestStartedAt);
  const knownPresets = await getPublicTrialColorPresets();
  phaseLog(correlation, 'color_presets_done', requestStartedAt, { count: knownPresets.length });
  if (knownPresets.length > 0 && !knownPresets.some((preset) => preset.key === colorPresetKey)) {
    return respond(correlation, requestStartedAt, { success: false, code: 'invalid_request', field: 'colorPresetKey', message: 'Kies een geldige kleurstijl.' }, 400);
  }
  if (!turnstileToken) {
    return respond(correlation, requestStartedAt, { success: false, code: 'turnstile_failed', message: 'Verificatie ontbreekt. Probeer het opnieuw.' }, 400);
  }

  const visitorIp = extractVisitorIp(request);
  phaseLog(correlation, 'turnstile_start', requestStartedAt);
  const turnstileOk = await verifyTurnstileToken(turnstileToken, visitorIp);
  phaseLog(correlation, 'turnstile_done', requestStartedAt, { ok: turnstileOk });
  if (!turnstileOk) {
    return respond(correlation, requestStartedAt, { success: false, code: 'turnstile_failed', message: 'Verificatie is mislukt. Probeer het opnieuw.' }, 400);
  }

  let ipHash: string;
  try {
    ipHash = await hashVisitorIp(visitorIp ?? 'onbekend');
  } catch {
    return respond(correlation, requestStartedAt, { success: false, code: 'unexpected_failure', message: 'De proefabonnementdienst is niet beschikbaar. Probeer het later opnieuw.' }, 503);
  }

  let admin;
  try {
    admin = createServerSupabaseAdminClient();
  } catch {
    return respond(correlation, requestStartedAt, { success: false, code: 'unexpected_failure', message: 'De proefabonnementdienst is niet beschikbaar. Probeer het later opnieuw.' }, 503);
  }

  phaseLog(correlation, 'rpc_start', requestStartedAt);
  const requested = await admin.rpc('platform_trial_signup_request', {
    p_organization_name: organizationName,
    p_contact_name: contactName,
    p_contact_email: contactEmail,
    p_color_preset_key: colorPresetKey,
    p_request_ip_hash: ipHash,
  });
  phaseLog(correlation, 'rpc_done', requestStartedAt, { ok: !requested.error });

  if (requested.error) {
    const message = rpcErrorMessage(requested.error);
    if (/signup_already_pending/i.test(message)) {
      // Stille dedupe: exact dezelfde succesrespons als een verse aanvraag,
      // geen nieuwe mail (die is bij de eerdere aanvraag al verstuurd).
      return respond(correlation, requestStartedAt, { success: true, message: 'Bijna klaar - controleer je e-mail om je proefabonnement te activeren.' });
    }
    if (/rate_limited/i.test(message)) {
      return respond(correlation, requestStartedAt, { success: false, code: 'rate_limited', message: 'Je hebt dit net al geprobeerd. Wacht even en probeer het straks opnieuw.' }, 429);
    }
    if (/invalid_organization_name|invalid_contact_name|invalid_contact_email|invalid_color_preset|invalid_request_ip_hash/i.test(message)) {
      return respond(correlation, requestStartedAt, { success: false, code: 'invalid_request', message: 'Controleer je gegevens en probeer het opnieuw.' }, 400);
    }
    console.error(JSON.stringify({ scope: 'proefabonnement-aanvraag', errorMessage: message.slice(0, 220) }));
    return respond(correlation, requestStartedAt, { success: false, code: 'unexpected_failure', message: 'Je aanvraag kon niet worden verwerkt. Probeer het later opnieuw.' }, 500);
  }

  const row = (requested.data as readonly { signup_id: string; raw_activation_token: string; expires_at: string }[] | null)?.[0];
  if (!row) {
    return respond(correlation, requestStartedAt, { success: false, code: 'unexpected_failure', message: 'Je aanvraag kon niet worden verwerkt. Probeer het later opnieuw.' }, 500);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meervereniging.nl';
  const activationLink = new URL('/proefabonnement/activeren', siteUrl);
  activationLink.searchParams.set('signup', row.signup_id);
  activationLink.searchParams.set('token', row.raw_activation_token);

  phaseLog(correlation, 'email_start', requestStartedAt);
  try {
    await withInvitationDeadline(
      sendTrialSignupVerificationEmail({
        recipient: contactEmail,
        organizationName,
        activationLink: activationLink.toString(),
        signupId: row.signup_id,
      }),
      EMAIL_PROVIDER_TIMEOUT_MS,
      new AccountInvitationFlowError('trial_signup_email_provider_timeout', 'De mailprovider reageert niet op tijd.', 504, 'unknown'),
    );
    phaseLog(correlation, 'email_done', requestStartedAt, { ok: true });
  } catch {
    phaseLog(correlation, 'email_done', requestStartedAt, { ok: false });
    // De aanvraag zelf staat al onomkeerbaar klaar (token bestaat) - een
    // mislukte mail hier is een zachte fout die de bezoeker moet weten
    // (er is nu geen manier om dezelfde aanvraag opnieuw te laten mailen -
    // zie het Fase 3-rapport, bekend openstaand punt).
    return respond(correlation, requestStartedAt, { success: false, code: 'email_delivery_failed', message: 'Je aanvraag is opgeslagen, maar de e-mail kon niet worden verzonden. Probeer het over enkele minuten opnieuw.' }, 502);
  }

  return respond(correlation, requestStartedAt, { success: true, message: 'Bijna klaar - controleer je e-mail om je proefabonnement te activeren.' });
}
