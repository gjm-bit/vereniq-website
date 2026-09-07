// PROEFABONNEMENT FASE 3 — e-mailverzending via de Resend HTTP-API
// rechtstreeks (fetch), zonder de `resend` npm-dependency toe te voegen:
// dit is een enkele POST-aanroep en dit project heeft nog geen
// e-mailverzending, dus een nieuwe dependency toevoegen voor twee
// tekstmails is niet nodig (AGENTS.md: "Voeg geen dependency toe zonder
// noodzaak"). Twee soorten mail:
//  - 'trial_verification': fase 1, direct na de publieke aanvraag - bevat
//    de meervereniging.nl-activatielink (bevestigt het e-mailadres).
//  - 'admin_bootstrap': fase 2, na succesvolle activatie - bevat de
//    bestaande Supabase-uitnodigingslink naar de wachtwoord-instellen-flow
//    (zelfde tekst/vorm als master-beheer/api/_lib/resend-invite-email.ts,
//    bewust gedupliceerd - zie dat bestand voor de uitleg).

import { assertServerOnly } from './server-only';

export class TrialSignupEmailError extends Error {
  constructor() {
    super('De e-mail kon niet worden verzonden. Probeer het later opnieuw.');
    this.name = 'TrialSignupEmailError';
  }
}

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const DIAGNOSTIC_LOG_PREFIX = '[trial-signup-email]';

// Tijdelijke diagnosepatch (productie-incident: Resend-verzending faalt
// zonder zichtbare oorzaak): logt uitsluitend niet-herleidbare metadata
// (categorie, veldnamen, HTTP-status, Resend-foutcode) - nooit secrets,
// adressen of aanvraaginhoud. `message` van Resend kan in theorie een
// opgegeven adres citeren, dus die wordt hier defensief geredact voordat
// hij gelogd wordt.
function redactEmailLike(value: string): string {
  return value.replace(/[^\s"'<>]+@[^\s"'<>]+/g, '[redacted]');
}

function logDiagnostic(event: string, details: Record<string, unknown>) {
  console.error(`${DIAGNOSTIC_LOG_PREFIX} ${JSON.stringify({ event, ...details, timestamp: new Date().toISOString() })}`);
}

function readResendConfiguration() {
  assertServerOnly();
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  const fromName = process.env.RESEND_FROM_NAME?.trim() ?? '';
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? '';
  const replyTo = process.env.RESEND_REPLY_TO?.trim() ?? '';

  const invalidFields: string[] = [];
  if (!apiKey) invalidFields.push('RESEND_API_KEY');
  if (!fromName) invalidFields.push('RESEND_FROM_NAME');
  if (!validEmail(fromEmail)) invalidFields.push('RESEND_FROM_EMAIL');
  if (!validEmail(replyTo)) invalidFields.push('RESEND_REPLY_TO');

  if (invalidFields.length > 0) {
    logDiagnostic('config_invalid', { category: 'configuration', invalidFields });
    throw new Error('E-mailconfiguratie is niet correct.');
  }

  return { apiKey, from: `${fromName} <${fromEmail}>`, replyTo };
}

async function sendViaResend(message: { from: string; replyTo: string; to: string[]; subject: string; text: string }, apiKey: string, idempotencyKey: string) {
  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({ from: message.from, reply_to: message.replyTo, to: message.to, subject: message.subject, text: message.text }),
    });
  } catch (error) {
    logDiagnostic('fetch_failed', {
      category: 'network',
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message.slice(0, 200) : 'Onbekende netwerkfout.',
    });
    throw new TrialSignupEmailError();
  }

  const data = (await response.json().catch(() => null)) as { id?: string; name?: string; message?: string } | null;

  if (!response.ok || !data?.id) {
    logDiagnostic('resend_rejected', {
      category: 'resend_api',
      httpStatus: response.status,
      errorName: typeof data?.name === 'string' ? data.name.slice(0, 100) : null,
      errorMessage: typeof data?.message === 'string' ? redactEmailLike(data.message).slice(0, 200) : null,
    });
    throw new TrialSignupEmailError();
  }
  return { messageId: data.id };
}

function audit(emailType: 'trial_verification' | 'admin_bootstrap', result: 'sent' | 'failed', messageId?: string) {
  // Nooit e-mail/naam/actionLink loggen - zelfde conventie als master-beheer.
  console.info(JSON.stringify({ emailType, result, messageId: messageId ?? null, timestamp: new Date().toISOString() }));
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
