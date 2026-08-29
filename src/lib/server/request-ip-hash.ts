// PROEFABONNEMENT FASE 3 — leidt een privacyvriendelijke, niet-omkeerbare
// hash van het bezoekers-IP af voor de rate-limit-kolom
// public_trial_signups.request_ip_hash (zie supabase/migrations/
// 20260827180000_..._foundation.sql). Het rauwe IP-adres wordt nooit
// opgeslagen, gelogd of doorgegeven - alleen deze hash (AVG-dataminimalisatie,
// zie AGENTS.md). Web Crypto (globalThis.crypto.subtle) i.p.v. node:crypto:
// dit project bouwt zowel voor de Vercel Node-runtime als voor Cloudflare
// Workers (worker/index.ts), en Web Crypto is de enige hash-API die op
// beide runtimes zonder extra compat-vlaggen werkt.

import { assertServerOnly } from './server-only';
import { sha256Hex } from './webcrypto';

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const [first] = value.split(',');
  const trimmed = first?.trim();
  return trimmed || null;
}

/** Best-effort: de eerste bekende proxy-header, geen garantie op het "echte" IP - voldoende voor rate-limiting. */
export function extractVisitorIp(request: Request): string | null {
  return (
    firstForwardedIp(request.headers.get('x-forwarded-for'))
    ?? request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? null
  );
}

/**
 * HMAC-achtige hash (secret || ip, dubbel gehasht) zodat de hash niet
 * simpelweg te herleiden is door alle mogelijke IP-adressen te hashen
 * (dictionary/rainbow-achtige aanval) zonder het geheim te kennen.
 */
export async function hashVisitorIp(ip: string): Promise<string> {
  assertServerOnly();
  const secret = process.env.TRIAL_SIGNUP_IP_HASH_SECRET;
  if (!secret) throw new Error('De proefabonnementdienst is niet geconfigureerd.');
  return sha256Hex(`${secret}:${await sha256Hex(ip)}`);
}
