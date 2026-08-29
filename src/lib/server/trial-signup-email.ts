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

function readResendConfiguration() {
  assertServerOnly();
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  const fromName = process.env.RESEND_FROM_NAME?.trim() ?? '';
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? '';
  const replyTo = process.env.RESEND_REPLY_TO?.trim() ?? '';
  if (!apiKey) throw new Error('E-mailverzending is niet geconfigureerd.');
  if (!fromName || !validEmail(fromEmail) || !validEmail(replyTo)) throw new Error('E-mailafzender is niet correct geconfigureerd.');
  return { apiKey, from: `${fromName} <${fromEmail}>`, replyTo };
}

async function sendViaResend(message: { from: string; replyTo: string; to: string[]; subject: string; text: string }, apiKey: string, idempotencyKey: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify({ from: message.from, reply_to: message.replyTo, to: message.to, subject: message.subject, text: message.text }),
  });
  const data = (await response.json().catch(() => null)) as { id?: string } | null;
  if (!response.ok || !data?.id) throw new TrialSignupEmailError();
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
