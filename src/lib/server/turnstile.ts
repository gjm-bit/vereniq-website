// PROEFABONNEMENT FASE 3 — server-side Cloudflare Turnstile-verificatie.
// De widget levert een eenmalig token in de browser; dat token bewijst
// NIETS totdat het hier, server-side, met het geheime sleutel tegen
// Cloudflare wordt geverifieerd. Nooit alleen op de client vertrouwen.

import { assertServerOnly } from './server-only';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 8_000;

export async function verifyTurnstileToken(token: string, visitorIp: string | null): Promise<boolean> {
  assertServerOnly();
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) throw new Error('De proefabonnementdienst is niet geconfigureerd.');
  if (!token || typeof token !== 'string' || token.length > 4000) return false;

  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (visitorIp) body.set('remoteip', visitorIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body, signal: controller.signal });
    if (!response.ok) return false;
    const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
    return result?.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
