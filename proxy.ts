import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * WEBSITE P0 (production CSP reconciliation): the Content-Security-Policy
 * used to live as a fixed string in vercel.json's `headers` (see
 * 867a48e "security(headers): add Internet.nl security headers +
 * security.txt"). That's fine for X-Frame-Options/X-Content-Type-Options/
 * Referrer-Policy (still in vercel.json, unchanged), but not for CSP here:
 * this app renders ~20 inline <script> tags per page (vinext's RSC
 * bootstrap/hydration payload - framework-owned, not something app code
 * can remove), and `script-src 'self'` with no nonce/hash blocks every one
 * of them (proven: node dist/server/index.js render, 21 inline <script>
 * tags on the homepage, 0 with any nonce attribute). A static vercel.json
 * value can never carry a fresh per-request nonce, so CSP generation moves
 * here instead.
 *
 * vinext already ships getScriptNonceFromHeaderSources()
 * (node_modules/vinext/dist/server/csp.js, called from
 * app-rsc-handler.js) specifically to read a nonce back out of the
 * request's Content-Security-Policy header and stamp it onto every inline
 * script it renders - this is the standard Next.js CSP-nonce recipe,
 * which vinext mirrors; it was simply never being fed a nonce.
 *
 * Beyond the nonce, two additions - both proven necessary, nothing
 * broader:
 * - script-src + frame-src get https://challenges.cloudflare.com: the
 *   Turnstile widget on /proefabonnement (src/components/turnstile-widget.tsx)
 *   loads challenges.cloudflare.com/turnstile/v0/api.js client-side and
 *   renders its challenge in an iframe from the same origin. There was no
 *   frame-src directive at all before (falls back to default-src 'self',
 *   also blocking the iframe).
 * - img-src gets https://<supabase-project>.supabase.co (derived from
 *   NEXT_PUBLIC_SUPABASE_URL, the same origin already trusted in
 *   connect-src, and the same origin every CmsImage/mediaUrl helper in
 *   this repo already builds public asset URLs from - src/components/
 *   cms-public-page.tsx, cms-microdemo.tsx, cms-product-explorer.tsx,
 *   src/lib/homepage-content.ts). Without it every CMS-served image is
 *   blocked; only same-origin static assets load.
 *
 * No 'unsafe-inline', no wildcard, no other directive removed or widened.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const supabaseOrigin = (() => {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!raw) return null;
    try {
      return new URL(raw).origin;
    } catch {
      return null;
    }
  })();

  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    `font-src 'self'`,
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    `frame-src https://challenges.cloudflare.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];
  const cspHeader = cspDirectives.join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}
