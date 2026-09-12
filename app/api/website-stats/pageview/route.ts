// WEBSITE STATISTIEKEN 1.1 (nightshift 2026-09-09/10) — paginaweergave-
// beacon. Cookieloos, first-party: de client (src/components/website-stats-
// beacon.tsx) stuurt bij elke paginaweergave uitsluitend pad + externe-
// verwijzer-hostnaam + grof apparaattype + een client-berekende "is dit een
// nieuwe sessie"-vlag. Deze route leest en bewaart NOOIT een IP-adres, een
// user-agent of enige andere bezoeker-identificerende waarde - vergelijk
// met app/api/proefabonnement/aanvraag/route.ts, dat voor dat andere
// (fraude-gevoelige) doel bewust wél een gehasht IP-adres gebruikt. Schrijft
// via de service_role-only RPC website_traffic_pageview_record (master-
// beheer-monorepo, supabase/migrations/20260910010000_website_statistics_
// 1_1_traffic.sql) - dezelfde vertrouwensgrens als de proefabonnement-
// aanvraagroute. Faalt altijd zacht: een mislukte telling mag de
// paginaweergave van een bezoeker nooit zichtbaar breken.
//
// WEBSITE STATISTIEKEN 1.2 (AI-vindbaarheid): de client mag daarnaast een
// `utmSource`-veld meesturen - de ENIGE querystring-waarde die deze route
// ooit leest (zie src/lib/ai-referral-source.ts). Die ruwe waarde wordt
// hier alleen gebruikt om aan de vaste AI-bron-allowlist te toetsen; wat
// wordt opgeslagen is uitsluitend een van de 5 vaste sleutels of niets -
// nooit de ruwe utm_source-tekst, nooit de querystring zelf.
//
// WEBSITE STATISTIEKEN 1.3 (AI-bezoeken): de client stuurt daarnaast
// `aiSessionSource` mee - de AI-bron waaraan déze browsersessie VÓÓR deze
// paginaweergave al was toegeschreven (sessionStorage, zie website-stats-
// beacon.tsx), of null. Deze route bepaalt hieruit `aiSource` (directe
// detectie op deze pageview, anders de al-lopende sessiebron - zodat een
// AI-sessie van meerdere pagina's ALLEMAAL als AI-paginaweergave tellen) en
// `aiVisitStart` (true alleen op de pageview waarmee de sessie voor het
// eerst aan een AI-bron wordt toegeschreven - hooguit 1 AI-bezoek per
// sessie, ongeacht latere platformwissels binnen diezelfde sessie). Cross-
// sessie nieuw/terugkerend wordt hier bewust NIET ingevuld (geen consent-
// basis, zie website-stats-beacon.tsx) - altijd `null` naar de RPC.

import { createServerSupabaseAdminClient } from '@/src/lib/server/supabase-admin';
import { resolveAiSource, isKnownAiSourceKey } from '@/src/lib/ai-referral-source';

export const runtime = 'nodejs';

const PATH_PATTERN = /^\/[a-z0-9/_-]{1,200}$/;
const HOST_PATTERN = /^[a-z0-9.-]{1,255}$/;
const DEVICE_TYPES = new Set(['mobile', 'desktop', 'unknown']);

function noStore(status = 204) {
  return new Response(null, { status, headers: { 'cache-control': 'no-store' } });
}

function normalizePath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const path = value.trim();
  if (path === '/') return '/';
  return PATH_PATTERN.test(path) ? path : null;
}

function normalizeReferrerHost(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const host = value.trim().toLowerCase();
  if (!host) return null;
  return HOST_PATTERN.test(host) ? host : null;
}

function normalizeDeviceType(value: unknown): 'mobile' | 'desktop' | 'unknown' {
  return typeof value === 'string' && DEVICE_TYPES.has(value) ? (value as 'mobile' | 'desktop' | 'unknown') : 'unknown';
}

export async function POST(request: Request) {
  // navigator.sendBeacon (de gebruikelijke aanroeper) leest geen response
  // body/status - elke uitkomst hieronder mag dus zacht falen (204), nooit
  // een fout laten zien aan de bezoeker.
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStore();
  }
  if (!body) return noStore();

  const path = normalizePath(body.path);
  if (!path) return noStore();
  const referrerHost = normalizeReferrerHost(body.referrerHost);
  const deviceType = normalizeDeviceType(body.deviceType);
  const newSession = body.newSession === true;
  // WEBSITE STATISTIEKEN 1.2: utm_source is de enige querystring-waarde die
  // ooit gelezen wordt (zie WebsiteStatsBeacon), en uitsluitend om te
  // toetsen aan de vaste AI-bron-allowlist in resolveAiSource - de ruwe
  // waarde wordt hierna nergens meer gebruikt, gelogd of opgeslagen.
  const rawUtmSource = typeof body.utmSource === 'string' ? body.utmSource : null;
  const directAiSource = resolveAiSource({ referrerHost, utmSource: rawUtmSource });
  // WEBSITE STATISTIEKEN 1.3: een sessie-brede AI-bron mag alleen worden
  // overgenomen als de client een van de 5 vaste sleutels rapporteert - nooit
  // vrije tekst (isKnownAiSourceKey is dezelfde allowlist als resolveAiSource
  // zelf gebruikt, zie ai-referral-source.ts).
  const priorAiSessionSource = isKnownAiSourceKey(body.aiSessionSource) ? body.aiSessionSource : null;
  const aiSource = directAiSource ?? priorAiSessionSource;
  const aiVisitStart = aiSource !== null && priorAiSessionSource === null;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://meervereniging.nl').replace(/\/$/, '');

  let admin;
  try {
    admin = createServerSupabaseAdminClient();
  } catch {
    return noStore();
  }

  try {
    await admin.rpc('website_traffic_pageview_record', {
      target_site_url: siteUrl,
      target_page_path: path,
      target_referrer_host: referrerHost,
      target_device_type: deviceType,
      target_new_session: newSession,
      target_ai_source: aiSource,
      target_ai_visit_start: aiVisitStart,
      // Cross-sessie nieuw/terugkerend: geen consentbasis, dus altijd null
      // (zie bestandskop) - de RPC ondersteunt dit al forward-compatible.
      target_ai_visit_kind: null,
    });
  } catch {
    // Nooit loggen met request-inhoud (geen IP/UA hier aanwezig om te
    // loggen - zie de bestandskop) en nooit een fout naar de bezoeker terug.
  }

  return noStore();
}
