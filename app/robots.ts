import type { MetadataRoute } from "next";
import { site } from "@/src/config/site";

/**
 * Niet-publieke routes: interne beheerportal, CMS-previewframe en de
 * form-post-only API-routes. Geen van deze routes bevat waardevolle,
 * indexeerbare content, en /master bevat mogelijk niet-publieke informatie.
 */
const DISALLOW_ALWAYS = ["/master", "/cms-preview", "/api/"];

/**
 * AI crawler policy - zie docs/ai-crawler-policy.md voor de volledige
 * onderbouwing. Samengevat: dit is een publieke marketingsite zonder
 * gevoelige of betaalmuur-content, dus er is geen beveiligingsreden om
 * enige crawler te blokkeren. We staan zowel de "live antwoord"-bots
 * (die een AI-assistent gebruikt om een concrete vraag te beantwoorden) als
 * de trainingscrawlers bewust en met naam toe, in plaats van dit stilzwijgend
 * aan het wildcard-record over te laten - zodat deze keuze zichtbaar,
 * bewust en makkelijk te herzien is.
 */
const AI_USER_AGENTS = [
  "GPTBot", // OpenAI, training
  "OAI-SearchBot", // OpenAI, ChatGPT-zoekresultaten
  "ChatGPT-User", // OpenAI, live antwoord op gebruikersvraag
  "ClaudeBot", // Anthropic, training
  "Claude-User", // Anthropic, live antwoord op gebruikersvraag
  "Claude-SearchBot", // Anthropic, zoekresultaatkwaliteit
  "Google-Extended", // Google, Gemini/Vertex AI training & grounding
  "PerplexityBot", // Perplexity, zoekresultaten
  "Perplexity-User", // Perplexity, live antwoord op gebruikersvraag
  "CCBot", // Common Crawl, open dataset
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW_ALWAYS },
      ...AI_USER_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW_ALWAYS })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
