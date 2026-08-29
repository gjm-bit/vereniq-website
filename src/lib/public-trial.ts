/**
 * Public trial-instellingen read-adapter (Fase 3). Zelfde patroon als
 * src/lib/public-cms.ts: alleen de twee narrow anonieme RPC's, nooit een
 * service-sleutel, nooit een directe tabel. In tegenstelling tot CMS-
 * content (die `cache:'no-store'` gebruikt omdat publiceren instant moet
 * zijn) mag deze data een korte tijd gecachet worden - een operator wijzigt
 * de proefduur/kleurpresets zelden - en dat cachen is hier juist bewust
 * ingezet als veerkracht: als de RPC tijdelijk niet reageert, blijft de
 * laatst bekende, geldige waarde beschikbaar in plaats van dat de pagina of
 * CTA breekt (zie ook de UI-fallback in trial-signup-form.tsx die zelfs
 * zonder enige eerdere waarde nog een werkende, dagen-neutrale CTA toont).
 */

const CACHE_TTL_MS = 60_000;

export type TrialColorPreset = Readonly<{
  key: string;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}>;

type CacheEntry<T> = { value: T; fetchedAt: number };
let trialPeriodCache: CacheEntry<number> | null = null;
let colorPresetsCache: CacheEntry<readonly TrialColorPreset[]> | null = null;

function getPublicConfig(): Readonly<{ url: string; key: string }> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}

async function callPublicRpc<T>(name: string): Promise<T | null> {
  const config = getPublicConfig();
  if (!config) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: config.key, authorization: `Bearer ${config.key}`, 'content-type': 'application/json' },
      body: '{}',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Actuele standaard proefduur in dagen. `null` betekent: op dit moment
 * onbekend (RPC/backend niet bereikbaar én geen eerder gecachete waarde) -
 * de aanroeper toont dan bewust GEEN getal (nooit een geraden/verouderd
 * aantal dagen), maar wel een werkende, dagen-neutrale CTA/pagina.
 */
export async function getPublicTrialPeriodDays(): Promise<number | null> {
  if (trialPeriodCache && Date.now() - trialPeriodCache.fetchedAt < CACHE_TTL_MS) return trialPeriodCache.value;
  const rows = await callPublicRpc<readonly { default_trial_period_days: number }[]>('website_public_trial_period');
  const days = rows?.[0]?.default_trial_period_days;
  if (typeof days === 'number' && days > 0) {
    trialPeriodCache = { value: days, fetchedAt: Date.now() };
    return days;
  }
  // Stale-while-error: een eerdere, ooit geldige waarde is beter dan niets.
  return trialPeriodCache?.value ?? null;
}

export async function getPublicTrialColorPresets(): Promise<readonly TrialColorPreset[]> {
  if (colorPresetsCache && Date.now() - colorPresetsCache.fetchedAt < CACHE_TTL_MS) return colorPresetsCache.value;
  const rows = await callPublicRpc<readonly {
    key: string; label: string; primary_color: string; secondary_color: string; accent_color: string;
  }[]>('website_public_trial_color_presets');
  if (rows && rows.length > 0) {
    const presets = rows.map((row) => ({ key: row.key, label: row.label, primaryColor: row.primary_color, secondaryColor: row.secondary_color, accentColor: row.accent_color }));
    colorPresetsCache = { value: presets, fetchedAt: Date.now() };
    return presets;
  }
  return colorPresetsCache?.value ?? [];
}
