// PROEFABONNEMENT FASE 3 — publieke activatieroute. Twee stappen, beide
// service_role, geen gebruikerssessie (die bestaat hier per definitie nog
// niet):
//  1) platform_trial_signup_activate_create_org - maakt de organisatie aan
//     (idempotent bij een herhaalde/dubbele klik op dezelfde link).
//  2) Dezelfde admin-bootstrap-RPC-keten als master-beheer/api/
//     organization-bootstrap-admin.ts (begin/bind/prepare), maar met de
//     trial-variant van die RPC's (platform_trial_signup_*_bootstrap_admin)
//     en zonder gebruikerssessie - autorisatie zit uitsluitend in de
//     service_role-GRANT. De uitnodigingslink wijst naar dezelfde,
//     bestaande wachtwoord-instellen-pagina (mijn.feestbende.nl/auth/
//     reset-password) die de operator-flow ook gebruikt - de nieuwe
//     /trial-setup-tenant-onboardingwizard daarna is Fase 4, niet dit
//     bestand.
//
// "Al gebruikte link" leest de bezoeker nooit als een technische fout: als
// begin_bootstrap_admin 'already_bootstrapped' teruggeeft (de eerste
// beheerder heeft zijn wachtwoord al ingesteld), toont de pagina een
// neutrale "je omgeving is al actief, log in"-status i.p.v. een foutmelding.

import {
  AccountInvitationFlowError,
  validateGeneratedAuthLink,
  withInvitationDeadline,
  type GeneratedAuthLink,
} from '@/src/lib/server/account-invitation-flow';
import { configuredSupabaseUrl, createServerSupabaseAdminClient } from '@/src/lib/server/supabase-admin';
import { sendTrialAdminBootstrapEmail } from '@/src/lib/server/trial-signup-email';
import { randomHex, sha256Hex } from '@/src/lib/server/webcrypto';

export const runtime = 'nodejs';

const INVITE_REDIRECT = 'https://mijn.feestbende.nl/auth/reset-password';
const EMAIL_PROVIDER_TIMEOUT_MS = 10_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[0-9a-f]{32,128}$/i;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function rpcErrorMessage(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : '';
}

function splitContactName(contactName: string): { firstName: string; lastName: string } {
  const parts = contactName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: contactName.trim() || 'Beheerder', lastName: contactName.trim() || 'Beheerder' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, status: 'invalid', message: 'Deze activatielink is ongeldig.' }, 400);
  }
  const signupId = typeof body?.signupId === 'string' ? body.signupId : '';
  const token = typeof body?.token === 'string' ? body.token : '';
  if (!UUID_PATTERN.test(signupId) || !TOKEN_PATTERN.test(token)) {
    return json({ success: false, status: 'invalid', message: 'Deze activatielink is ongeldig.' }, 400);
  }

  let admin;
  try {
    admin = createServerSupabaseAdminClient();
  } catch {
    return json({ success: false, status: 'unexpected_failure', message: 'De proefabonnementdienst is niet beschikbaar. Probeer het later opnieuw.' }, 503);
  }

  // --- Stap 1: organisatie aanmaken (idempotent) ---
  const activated = await admin.rpc('platform_trial_signup_activate_create_org', { p_signup_id: signupId, p_raw_token: token });
  if (activated.error) {
    const message = rpcErrorMessage(activated.error);
    if (/token_expired/i.test(message)) {
      return json({ success: false, status: 'expired', message: 'Deze activatielink is verlopen.' }, 410);
    }
    if (/invalid_token|signup_not_found/i.test(message)) {
      return json({ success: false, status: 'invalid', message: 'Deze activatielink is ongeldig of al gebruikt.' }, 400);
    }
    console.error(JSON.stringify({ scope: 'proefabonnement-activeren', phase: 'activate', errorMessage: message.slice(0, 220) }));
    return json({ success: false, status: 'unexpected_failure', message: 'Activeren is niet gelukt. Probeer het later opnieuw.' }, 500);
  }
  const activatedRow = (activated.data as readonly {
    organization_id: string | null; already_provisioned: boolean; needs_review: boolean; contact_name: string; contact_email: string; organization_name: string; organization_slug: string | null;
  }[] | null)?.[0];
  if (!activatedRow) {
    return json({ success: false, status: 'unexpected_failure', message: 'Activeren is niet gelukt. Probeer het later opnieuw.' }, 500);
  }

  // RECONCILIATIE - expliciete operator-review: een sterk gelijkende
  // organisatienaam wordt WEL geverifieerd (activated_at is al gezet door
  // de RPC hierboven) maar krijgt bewust geen organisatie/admin-bootstrap
  // totdat een Master Beheer-operator dit goedkeurt (platform_trial_signup_
  // review_approve, zie organizations/review.tsx in het beheer-project).
  // De aanvrager ziet uitsluitend een nette, niet-technische status - geen
  // verwijzing naar beheer.meervereniging.nl, geen enkele provisioning-
  // /bootstrap-actie vanuit de browser.
  if (activatedRow.needs_review) {
    return json({ success: true, status: 'held_for_review', organizationName: activatedRow.organization_name, message: 'Je aanvraag wordt beoordeeld. Je ontvangt bericht zodra je omgeving klaarstaat.' });
  }

  const { organization_id: organizationId, contact_name: contactName, contact_email: contactEmail, organization_name: organizationName } = activatedRow;
  if (!organizationId) {
    return json({ success: false, status: 'unexpected_failure', message: 'Activeren is niet gelukt. Probeer het later opnieuw.' }, 500);
  }

  // --- Stap 2: eerste beheerder provisionen (idempotent/hervatbaar) ---
  const bindingSecret = randomHex(32);
  const bindingSecretHash = await sha256Hex(bindingSecret);
  const freshAttemptId = globalThis.crypto.randomUUID();

  const begin = await admin.rpc('platform_trial_signup_begin_bootstrap_admin', {
    p_organization_id: organizationId,
    p_attempt_id: freshAttemptId,
    p_admin_email: contactEmail,
    p_binding_secret_hash: bindingSecretHash,
  });
  if (begin.error) {
    const message = rpcErrorMessage(begin.error);
    if (/already_bootstrapped/i.test(message)) {
      return json({ success: true, status: 'already_active', organizationName, message: 'Deze proefomgeving is al actief. Log in met je bestaande account.' });
    }
    console.error(JSON.stringify({ scope: 'proefabonnement-activeren', phase: 'begin', errorMessage: message.slice(0, 220) }));
    return json({ success: false, status: 'unexpected_failure', message: 'Je beheerdersaccount kon niet worden aangemaakt. Probeer het later opnieuw.' }, 500);
  }
  const beginRow = (begin.data as readonly { attempt_id: string; user_id: string | null; attempt_state: string }[] | null)?.[0];
  if (!beginRow) {
    return json({ success: false, status: 'unexpected_failure', message: 'Je beheerdersaccount kon niet worden aangemaakt. Probeer het later opnieuw.' }, 500);
  }
  const attemptId = beginRow.attempt_id;
  let userId = beginRow.user_id;
  let actionLink: string | null = null;
  let generatedNewAuthUser = false;

  {
    const expectedType: 'invite' | 'recovery' = userId ? 'recovery' : 'invite';
    const { firstName, lastName } = splitContactName(contactName);
    let generated: { data: GeneratedAuthLink; error: { message?: string } | null };
    try {
      generated = expectedType === 'invite'
        ? await admin.auth.admin.generateLink({
          type: 'invite',
          email: contactEmail,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              invitation_attempt_id: attemptId,
              invitation_binding_secret: bindingSecret,
              invitation_origin: 'mijn_feestbende',
            },
            redirectTo: INVITE_REDIRECT,
          },
        })
        : await admin.auth.admin.generateLink({ type: 'recovery', email: contactEmail, options: { redirectTo: INVITE_REDIRECT } });
    } catch {
      return json({ success: false, status: 'unexpected_failure', message: 'De accountdienst reageert niet op tijd. Probeer het opnieuw.' }, 504);
    }
    if (generated.error) {
      console.error(JSON.stringify({ scope: 'proefabonnement-activeren', phase: 'auth_link', errorMessage: (generated.error.message ?? '').slice(0, 220) }));
      return json({ success: false, status: 'unexpected_failure', message: 'Je beheerdersaccount kon niet worden aangemaakt. Probeer het later opnieuw.' }, 502);
    }

    let validated;
    try {
      validated = validateGeneratedAuthLink(generated.data, {
        email: contactEmail,
        expectedType,
        redirectTo: INVITE_REDIRECT,
        supabaseUrl: configuredSupabaseUrl(),
        targetUserId: userId ?? undefined,
      });
    } catch (error) {
      const flowError = error instanceof AccountInvitationFlowError ? error : new AccountInvitationFlowError('trial_signup_auth_link_invalid', 'De activatielink kon niet veilig worden aangemaakt.', 502);
      return json({ success: false, status: 'unexpected_failure', message: flowError.message }, flowError.status);
    }

    if (expectedType === 'invite' && generated.data.user?.id === validated.userId) generatedNewAuthUser = true;
    userId = validated.userId;
    actionLink = validated.actionLink;

    const bind = await admin.rpc('platform_trial_signup_bind_bootstrap_admin', { p_attempt_id: attemptId, p_user_id: userId });
    if (bind.error) {
      if (generatedNewAuthUser) await admin.auth.admin.deleteUser(userId).catch(() => undefined);
      console.error(JSON.stringify({ scope: 'proefabonnement-activeren', phase: 'bind', errorMessage: rpcErrorMessage(bind.error).slice(0, 220) }));
      return json({ success: false, status: 'unexpected_failure', message: 'Je beheerdersaccount kon niet worden aangemaakt. Probeer het later opnieuw.' }, 500);
    }
  }

  const { firstName, lastName } = splitContactName(contactName);
  const prepare = await admin.rpc('platform_trial_signup_prepare_bootstrap_admin', {
    p_attempt_id: attemptId,
    p_user_id: userId,
    p_first_name: firstName,
    p_middle_name: null,
    p_last_name: lastName,
    p_display_name: null,
  });
  if (prepare.error) {
    // Vanaf hier nooit meer de Auth-gebruiker verwijderen - bind is al
    // bevestigd (of dit was een hervatte, al bestaande gebruiker).
    console.error(JSON.stringify({ scope: 'proefabonnement-activeren', phase: 'prepare', errorMessage: rpcErrorMessage(prepare.error).slice(0, 220) }));
    return json({ success: false, status: 'unexpected_failure', message: 'Je beheerdersaccount kon niet worden aangemaakt. Probeer het later opnieuw.' }, 500);
  }
  const prepareRow = (prepare.data as readonly { user_id: string; membership_id: string }[] | null)?.[0];
  if (!prepareRow?.membership_id) {
    return json({ success: false, status: 'unexpected_failure', message: 'Je beheerdersaccount kon niet worden bevestigd. Probeer het later opnieuw.' }, 500);
  }

  try {
    await withInvitationDeadline(
      sendTrialAdminBootstrapEmail({ recipient: contactEmail, organizationName, actionLink: actionLink as string, deliveryAttemptId: attemptId }),
      EMAIL_PROVIDER_TIMEOUT_MS,
      new AccountInvitationFlowError('trial_signup_email_provider_timeout', 'De mailprovider reageert niet op tijd.', 504, 'unknown'),
    );
    return json({ success: true, status: 'activated', organizationName, emailSent: true });
  } catch {
    // De organisatie en het beheerderslidmaatschap zijn al onomkeerbaar
    // aangemaakt - een mislukte mail hier is een zachte fout, geen reden om
    // iets terug te draaien.
    return json({ success: true, status: 'activated', organizationName, emailSent: false });
  }
}
