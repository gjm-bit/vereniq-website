// PROEFABONNEMENT FASE 3 — server-only Supabase service_role-client.
// Uitsluitend gebruikt door app/api/proefabonnement/*/route.ts. De
// service_role-sleutel leeft alleen in server-omgevingsvariabelen
// (SUPABASE_SERVICE_ROLE_KEY) en wordt nooit als NEXT_PUBLIC_ blootgesteld
// - zie .env.example en AGENTS.md ("Plaats nooit een Supabase
// service-role-sleutel in clientcode."). @supabase/supabase-js wordt hier
// bewust toegevoegd (i.p.v. rauwe fetch, zoals src/lib/public-cms.ts doet
// voor de anon-RPC's): auth.admin.generateLink/deleteUser zijn
// veiligheidskritiek en master-beheer gebruikt dezelfde library voor
// exact dezelfde operaties (api/_lib/supabase-admin.ts) - hergebruik van
// een bewezen, onderhouden client verkleint het risico op een subtiele
// contractfout t.o.v. zelf de Auth Admin REST-API narekenen.

import { createClient } from '@supabase/supabase-js';

import { assertServerOnly } from './server-only';

const FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function createServerSupabaseAdminClient() {
  assertServerOnly();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('De proefabonnementdienst is niet geconfigureerd.');
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchWithTimeout },
  });
}

export function configuredSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('De proefabonnementdienst is niet geconfigureerd.');
  return url;
}
