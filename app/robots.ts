import type { MetadataRoute } from "next";
import { site } from "@/src/config/site";
import { DISALLOWED_PATH_PREFIXES } from "@/src/config/crawl-policy";

/**
 * Niet-publieke routes: interne beheerportal, CMS-previewframe en de
 * form-post-only API-routes. Geen van deze routes bevat waardevolle,
 * indexeerbare content, en /master bevat mogelijk niet-publieke informatie.
 * Gedeeld met `src/lib/server/indexnow.ts`, zie `src/config/crawl-policy.ts`.
 */
const DISALLOW_ALWAYS = [...DISALLOWED_PATH_PREFIXES];

/**
 * AI crawler policy - zie docs/ai-crawler-policy.md voor de volledige
 * onderbouwing en bronnen. Samengevat: het criterium is niet "kan het kwaad
 * om deze crawler toe te laten", maar "heeft deze crawler daadwerkelijk nut
 * voor vindbaarheid/citatie in zoekresultaten of live AI-antwoorden".
 *
 * Alleen search/discovery- en live user-answer-crawlers staan hieronder met
 * naam - crawlers die volgens de eigen documentatie van de aanbieder
 * (mede) voor modeltraining of datasetopbouw dienen (GPTBot, ClaudeBot,
 * Google-Extended, CCBot) krijgen bewust GEEN aparte, expliciete Allow-regel:
 * dat zou een aparte beleidskeuze zijn (training toestaan), losgekoppeld van
 * het doel van deze wijziging (vindbaarheid/citatie). Ze vallen terug op het
 * gewone wildcard-record hieronder, net als elke andere crawler - niet apart
 * geblokkeerd, maar ook niet apart en ten onrechte bestempeld als "nodig
 * voor AI-vindbaarheid".
 */
const AI_VISIBILITY_USER_AGENTS = [
  "OAI-SearchBot", // OpenAI: surfacet websites in ChatGPT-zoekresultaten
  "ChatGPT-User", // OpenAI: live paginabezoek op verzoek van een ChatGPT-gebruiker
  "Claude-SearchBot", // Anthropic: verbetert zoekresultaatkwaliteit/relevantie
  "Claude-User", // Anthropic: live paginabezoek op verzoek van een Claude-gebruiker
  "PerplexityBot", // Perplexity: surfacet/linkt websites in zoekresultaten, expliciet niet voor training
  "Perplexity-User", // Perplexity: live paginabezoek op verzoek van een Perplexity-gebruiker
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW_ALWAYS },
      ...AI_VISIBILITY_USER_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW_ALWAYS })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
