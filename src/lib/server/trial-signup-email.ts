// PROEFABONNEMENT FASE 3 — e-mailverzending via de `resend`-npm-SDK, letterlijk
// geport van de bewezen-werkende master-beheer/api/_lib/resend-invite-email.ts
// (die op zijn beurt weer een subset-duplicate is van api/_lib/resend-email.ts
// in de hoofdapp-repo — zie die bestanden voor de volledige uitleg/conventie).
// Dit bestand droeg voorheen een eigen, rauwe fetch()-implementatie (destijds
// bewust om geen nieuwe dependency toe te voegen); dat is losgelaten na een
// productie-incident (aanhoudende Resend-403) waarbij bleek dat "zo weinig
// mogelijk verschil met de bewezen backend" de veiligste weg was om verder te
// debuggen - zie het mailflow-vergelijkingsrapport in de PR-geschiedenis.
//
// GEEN dual-provider-selectie hier (in tegenstelling tot master-beheer): dit
// is een eigen, apart Vercel-project dat nooit namens "De Feestbende" mailt -
// er is dus maar één config-tak nodig, het equivalent van master-beheer se
// readGenericResendConfiguration(). Env-var-namen zijn daarom bewust
// RESEND_GENERIC_* (i.p.v. het oude RESEND_*), zodat in Vercel dezelfde
// bewezen waarden als master-beheer se generieke config gezet kunnen worden.
//
// Twee soorten mail:
//  - 'trial_verification': fase 1, direct na de publieke aanvraag - bevat
//    de meervereniging.nl-activatielink (bevestigt het e-mailadres).
//  - 'admin_bootstrap': fase 2, na succesvolle activatie - bevat de
//    bestaande Supabase-uitnodigingslink naar de wachtwoord-instellen-flow.

import { Resend } from 'resend';

import { assertServerOnly } from './server-only';

export class TrialSignupEmailError extends Error {
  constructor() {
    super('De e-mail kon niet worden verzonden. Probeer het later opnieuw.');
    this.name = 'TrialSignupEmailError';
  }
}

type ResendConfiguration = Readonly<{ apiKey: string; from: string; replyTo: string }>;
type ResendMessage = Readonly<{ from: string; replyTo: string; to: string[]; subject: string; text: string }>;
type ResendSend = (
  message: ResendMessage,
  options: { idempotencyKey: string; signal?: AbortSignal },
) => Promise<{ data: { id: string } | null; error: { name?: string; message?: string } | null }>;

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Bewuste, enige afwijking t.o.v. master-beheer se resend-invite-email.ts:
// die geeft geen signal/timeout mee aan de SDK. Deze AbortController is
// eerder empirisch bewezen nodig - zonder eigen timeout valt een stallende
// Resend-aanroep terug op undici's fetch()-standaard (headersTimeout/
// bodyTimeout = 300s), wat in combinatie met deze Vercel-runtime een
// functietimeout veroorzaakt in plaats van de nette foutrespons hieronder.
// De SDK's eigen post()-implementatie geeft `options` ongewijzigd door aan
// fetch(), dus `signal` werkt hier net zo goed als bij een rauwe fetch-call.
// Zelfde patroon/waarde-orde als turnstile.ts (8s) en supabase-admin.ts (12s)
// in dit project.
const RESEND_FETCH_TIMEOUT_MS = 10_000;

const DIAGNOSTIC_LOG_PREFIX = '[trial-signup-email]';

// Diagnostiek (productie-incident: Resend-verzending faalde onzichtbaar) -
// logt uitsluitend niet-herleidbare metadata (categorie, veldnamen,
// HTTP-status, Resend-foutcode) - nooit secrets, adressen of aanvraaginhoud.
// `message` van Resend kan in theorie een opgegeven adres citeren, dus die
// wordt defensief geredact voordat hij gelogd wordt. Dit is een bewuste
// toevoeging bovenop master-beheer se aanpak (die logt hier niets) - het
// verandert niets aan wat de bezoeker ziet, alleen aan wat in de server-log
// verschijnt.
function redactEmailLike(value: string): string {
  return value.replace(/[^\s"'<>]+@[^\s"'<>]+/g, '[redacted]');
}

function logDiagnostic(event: string, details: Record<string, unknown>) {
  console.error(`${DIAGNOSTIC_LOG_PREFIX} ${JSON.stringify({ event, ...details, timestamp: new Date().toISOString() })}`);
}

// Equivalent van master-beheer se readGenericResendConfiguration() - zelfde
// env-var-namen, zelfde validatiestijl.
function readResendConfiguration(): ResendConfiguration {
  assertServerOnly();
  const apiKey = process.env.RESEND_GENERIC_API_KEY?.trim() ?? '';
  const fromName = process.env.RESEND_GENERIC_FROM_NAME?.trim() ?? '';
  const fromEmail = process.env.RESEND_GENERIC_FROM_EMAIL?.trim() ?? '';
  const replyTo = process.env.RESEND_GENERIC_REPLY_TO?.trim() ?? '';

  const invalidFields: string[] = [];
  if (!apiKey) invalidFields.push('RESEND_GENERIC_API_KEY');
  if (!fromName) invalidFields.push('RESEND_GENERIC_FROM_NAME');
  if (!validEmail(fromEmail)) invalidFields.push('RESEND_GENERIC_FROM_EMAIL');
  if (!validEmail(replyTo)) invalidFields.push('RESEND_GENERIC_REPLY_TO');

  if (invalidFields.length > 0) {
    logDiagnostic('config_invalid', { category: 'configuration', invalidFields });
    throw new Error('E-mailconfiguratie is niet correct.');
  }

  return { apiKey, from: `${fromName} <${fromEmail}>`, replyTo };
}

function audit(emailType: 'trial_verification' | 'admin_bootstrap', result: 'sent' | 'failed', messageId?: string) {
  // Nooit e-mail/naam/actionLink loggen - zelfde conventie als master-beheer.
  console.info(JSON.stringify({ emailType, result, messageId: messageId ?? null, timestamp: new Date().toISOString() }));
}

// Zelfde verzendpad/responscontract als master-beheer se
// sendAccountInvitationEmail: SDK-transport, idempotency-key per mailsoort,
// { data, error }-vorm van de SDK bepaalt succes/mislukking. `send` is
// injecteerbaar voor tests (zelfde aanpak als master-beheer's `send?`-param).
async function sendViaResend(message: ResendMessage, apiKey: string, idempotencyKey: string, send?: ResendSend) {
  const transport: ResendSend = send ?? ((msg, options) => new Resend(apiKey).emails.send(
    { from: msg.from, replyTo: msg.replyTo, to: msg.to, subject: msg.subject, text: msg.text },
    options,
  ));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESEND_FETCH_TIMEOUT_MS);
  let response: Awaited<ReturnType<ResendSend>>;
  try {
    response = await transport(message, { idempotencyKey, signal: controller.signal });
  } catch (error) {
    logDiagnostic('fetch_failed', {
      category: 'network',
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message.slice(0, 200) : 'Onbekende netwerkfout.',
    });
    throw new TrialSignupEmailError();
  } finally {
    clearTimeout(timer);
  }

  if (response.error || !response.data?.id) {
    logDiagnostic('resend_rejected', {
      category: 'resend_api',
      errorName: typeof response.error?.name === 'string' ? response.error.name.slice(0, 100) : null,
      errorMessage: typeof response.error?.message === 'string' ? redactEmailLike(response.error.message).slice(0, 200) : null,
    });
    throw new TrialSignupEmailError();
  }
  return { messageId: response.data.id };
}

export async function sendTrialSignupVerificationEmail(input: { recipient: string; organizationName: string; activationLink: string; signupId: string }) {
  assertServerOnly();
  if (!validEmail(input.recipient)) throw new TrialSignupEmailError();
  try {
    const configuration = readResendConfiguration();
    const text = [
      `Je hebt een proefabonnement aangevraagd voor "${input.organizationName}".`,
      '',
      'Bevestig je e-mailadres via deze link om je proefomgeving te activeren:',
      input.activationLink,
      '',
      'Deze link is 48 uur geldig.',
      '',
      'Heb je dit niet aangevraagd? Negeer deze e-mail, er gebeurt dan niets.',
    ].join('\n');
    const result = await sendViaResend(
      { from: configuration.from, replyTo: configuration.replyTo, to: [input.recipient], subject: 'Bevestig je proefabonnement — Meer Vereniging', text },
      configuration.apiKey,
      `trial-signup-verification-${input.signupId}`,
    );
    audit('trial_verification', 'sent', result.messageId);
    return result;
  } catch {
    audit('trial_verification', 'failed');
    throw new TrialSignupEmailError();
  }
}

export async function sendTrialAdminBootstrapEmail(input: { recipient: string; organizationName: string; actionLink: string; deliveryAttemptId: string }) {
  assertServerOnly();
  if (!validEmail(input.recipient)) throw new TrialSignupEmailError();
  try {
    const configuration = readResendConfiguration();
    const text = [
      `Je proefomgeving voor "${input.organizationName}" staat klaar.`,
      '',
      'Stel via deze beveiligde link zelf je wachtwoord in:',
      input.actionLink,
      '',
      'Heb je dit niet verwacht? Negeer deze e-mail.',
    ].join('\n');
    const result = await sendViaResend(
      { from: configuration.from, replyTo: configuration.replyTo, to: [input.recipient], subject: `Je proefomgeving voor ${input.organizationName} staat klaar`, text },
      configuration.apiKey,
      `trial-admin-bootstrap-${input.deliveryAttemptId}`,
    );
    audit('admin_bootstrap', 'sent', result.messageId);
    return result;
  } catch {
    audit('admin_bootstrap', 'failed');
    throw new TrialSignupEmailError();
  }
}
