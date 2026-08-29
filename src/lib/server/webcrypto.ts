// PROEFABONNEMENT FASE 3 — kleine Web Crypto-helpers (globalThis.crypto),
// bewust NIET node:crypto: dit project bouwt voor zowel de Vercel
// Node-runtime als Cloudflare Workers (worker/index.ts), en Web Crypto is
// de enige API die op beide zonder extra compat-instellingen werkt.

export function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
