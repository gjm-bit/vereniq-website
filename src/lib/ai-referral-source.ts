// WEBSITE STATISTIEKEN 1.2 — AI-vindbaarheid (AI-referrals)
//
// De ENE centrale plek in dit repository die bepaalt of een paginaweergave
// aan een bekend AI-platform mag worden toegeschreven. Geen los-hardcoded
// domeinlijstje in losse componenten (zie WebsiteStatsBeacon en
// app/api/website-stats/pageview/route.ts - beide roepen uitsluitend de
// functies hieronder aan). De database (supabase/migrations/2026091121
// 0000_website_statistics_1_2_ai_referrals.sql, feestbende-app-repo) kent
// dezelfde 5 sleutels + weergavelabels - geen gedeeld package tussen de
// twee repo's, dus bewust op beide plekken hetzelfde, klein en stabiel
// gehouden (zelfde patroon als eerder bij de app-explorer-iconen).
//
// Privacy: dit bestand bepaalt UITSLUITEND een van de 5 vaste sleutels
// hieronder, of `null`. Er wordt nergens vrije tekst, een querystring, een
// IP-adres of een user-agent doorgegeven aan de aanroeper - zie de
// aanroepers zelf voor die garantie.

export type AiSourceKey = "chatgpt" | "microsoft_copilot" | "perplexity" | "gemini" | "claude";

const AI_SOURCE_KEYS: ReadonlySet<string> = new Set<AiSourceKey>(["chatgpt", "microsoft_copilot", "perplexity", "gemini", "claude"]);

/**
 * WEBSITE STATISTIEKEN 1.3: bewijst dat een waarde exact een van de 5 vaste
 * sleutels is - gebruikt om een door de client meegestuurde "sessie was al
 * aan een AI-bron toegeschreven"-waarde server-side te valideren (zie
 * website-stats-beacon.tsx/route.ts) zonder de allowlist een tweede keer los
 * te definiëren.
 */
export function isKnownAiSourceKey(value: unknown): value is AiSourceKey {
  return typeof value === "string" && AI_SOURCE_KEYS.has(value);
}

const AI_REFERRER_HOSTS: Readonly<Record<string, AiSourceKey>> = {
  "chatgpt.com": "chatgpt",
  "www.chatgpt.com": "chatgpt",
  "copilot.microsoft.com": "microsoft_copilot",
  "perplexity.ai": "perplexity",
  "www.perplexity.ai": "perplexity",
  "gemini.google.com": "gemini",
  "claude.ai": "claude",
};

const AI_UTM_SOURCE_ALIASES: Readonly<Record<string, AiSourceKey>> = {
  "chatgpt.com": "chatgpt",
  "chatgpt": "chatgpt",
  "openai": "chatgpt",
  "copilot": "microsoft_copilot",
  "copilot.microsoft.com": "microsoft_copilot",
  "perplexity": "perplexity",
  "perplexity.ai": "perplexity",
  "gemini": "gemini",
  "gemini.google.com": "gemini",
  "claude": "claude",
  "claude.ai": "claude",
};

/** Alleen een van de 5 bekende AI-hostnamen levert een sleutel op - al het overige (inclusief www.google.com, een lege string, etc.) geeft null. */
export function resolveAiSourceFromReferrerHost(host: string | null | undefined): AiSourceKey | null {
  if (!host) return null;
  return AI_REFERRER_HOSTS[host.trim().toLowerCase()] ?? null;
}

/**
 * utm_source is de ENIGE querystring-waarde die deze codebase ooit leest.
 * Nooit de rest van de querystring, nooit vrije tekst opslaan: een waarde
 * die niet exact op de allowlist staat, levert null op - punt, geen
 * fallback naar de ruwe tekst.
 */
export function resolveAiSourceFromUtmSource(utmSource: string | null | undefined): AiSourceKey | null {
  if (!utmSource) return null;
  const normalized = utmSource.trim().toLowerCase();
  if (!normalized || normalized.length > 64) return null;
  return AI_UTM_SOURCE_ALIASES[normalized] ?? null;
}

/**
 * Bronprioriteit (voorkomt dubbeltelling, FASE 4):
 * 1. een geldige AI-utm_source
 * 2. anders een bekende AI-referrer_host
 * 3. anders geen AI-bron (null)
 * Eén pageview krijgt hierdoor altijd hooguit één ai_source-waarde, nooit
 * twee separate tellingen voor dezelfde weergave.
 */
export function resolveAiSource(input: { referrerHost?: string | null; utmSource?: string | null }): AiSourceKey | null {
  return resolveAiSourceFromUtmSource(input.utmSource) ?? resolveAiSourceFromReferrerHost(input.referrerHost) ?? null;
}
