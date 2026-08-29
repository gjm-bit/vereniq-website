// PROEFABONNEMENT FASE 3 — DELIBERATE DUPLICATE van master-beheer/api/_lib/
// account-invitation-flow.ts (op zijn beurt al een gedocumenteerde
// duplicate van de hoofdapp-versie). Zelfde reden: dit is een derde, apart
// Vercel-project zonder gedeelde TypeScript-broncode. Dit is de
// veiligheidskritieke validatie van een door Supabase gegenereerde
// invite/recovery-link (voorkomt dat een vervalste/onvolledige link ooit
// als geldig wordt geaccepteerd) - een wijziging hier moet ook in de twee
// andere versies worden doorgevoerd, en andersom.

export type GeneratedAuthLink = Readonly<{
  properties: Readonly<{
    action_link: string;
    email_otp: string;
    hashed_token: string;
    redirect_to: string;
    verification_type: string;
  }> | null;
  user: Readonly<{ id: string; email?: string | null }> | null;
}>;

export type ValidatedAuthLink = Readonly<{ actionLink: string; userId: string }>;

export class AccountInvitationFlowError extends Error {
  readonly code: string;
  readonly failureState: 'failed' | 'unknown';
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status: number,
    failureState: 'failed' | 'unknown' = 'failed',
  ) {
    super(message);
    this.code = code;
    this.failureState = failureState;
    this.name = 'AccountInvitationFlowError';
    this.status = status;
  }
}

type ValidateAuthLinkInput = Readonly<{
  email: string;
  expectedType: 'invite' | 'recovery';
  redirectTo: string;
  supabaseUrl: string;
  targetUserId?: string;
}>;

export function validateGeneratedAuthLink(
  generated: GeneratedAuthLink,
  input: ValidateAuthLinkInput,
): ValidatedAuthLink {
  const properties = generated.properties;
  const user = generated.user;
  const reject = () => {
    throw new AccountInvitationFlowError(
      'trial_signup_auth_link_invalid',
      'De activatielink kon niet veilig worden aangemaakt.',
      502,
    );
  };

  if (
    !properties
    || !user?.id
    || !user.email
    || user.email.trim().toLowerCase() !== input.email.trim().toLowerCase()
    || properties.verification_type !== input.expectedType
    || properties.redirect_to !== input.redirectTo
    || (input.targetUserId && user.id !== input.targetUserId)
  ) {
    return reject();
  }

  let action: URL;
  let supabase: URL;
  try {
    action = new URL(properties.action_link);
    supabase = new URL(input.supabaseUrl);
  } catch {
    return reject();
  }

  if (
    action.protocol !== 'https:'
    || action.origin !== supabase.origin
    || action.pathname !== '/auth/v1/verify'
    || action.username
    || action.password
    || action.hash
    || action.searchParams.get('type') !== input.expectedType
    || action.searchParams.get('redirect_to') !== input.redirectTo
    || !properties.hashed_token
    || action.searchParams.get('token') !== properties.hashed_token
  ) {
    return reject();
  }

  // E-mail de app se eigen pagina, niet Supabase se rauwe /auth/v1/verify -
  // die is GET-consumeerbaar, dus een e-mailscanner die links prefetcht kan
  // het eenmalige token verbranden vóórdat de echte ontvanger klikt.
  const safeLink = new URL(input.redirectTo);
  safeLink.searchParams.set('token_hash', properties.hashed_token);
  safeLink.searchParams.set('type', input.expectedType);

  return { actionLink: safeLink.toString(), userId: user.id };
}

export async function withInvitationDeadline<T>(
  operation: Promise<T>,
  timeoutMs: number,
  error: AccountInvitationFlowError,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(error), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
