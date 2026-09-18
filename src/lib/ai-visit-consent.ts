// WEBSITE STATISTIEKEN 1.4 (AI-bezoeken productmatig afronden) — de ENE
// centrale plek die de minimale first-party toestemming en het bijbehorende
// herkenningssignaal beheert. Gebruikt door zowel de toestemmingsmelding
// (src/components/consent-banner.tsx), de intrekknop op /cookies
// (app/[...slug]/page.tsx) als de paginaweergave-beacon (website-stats-
// beacon.tsx).
//
// Precies twee localStorage-sleutels, allebei uitsluitend een korte tekst-
// waarde, nooit een gegenereerde ID:
// - CONSENT_KEY: "granted" | "denied" - het bezoekerskeuze zelf, nodig om
//   niet elke paginaweergave opnieuw te hoeven vragen.
// - VISITED_BEFORE_KEY: "1" - het ENE minimale signaal dat nodig is om
//   "deze browser is hier eerder geweest" vast te stellen. Geen timestamp,
//   geen UUID: een geldig/ongeldig-boolean volstaat voor nieuw/terugkerend.
//
// Zonder toestemming ("denied" of nog "undecided") wordt hier NOOIT
// gelezen of geschreven - de bestaande, cookieloze/sessiegebonden
// AI-bezoek-uniciteit uit 1.3 (sessionStorage, zie website-stats-beacon.tsx)
// blijft in dat geval het enige mechanisme, en nieuw/terugkerend blijft
// bewust unknown (null). Zie /cookies voor de toelichting aan bezoekers.

export type ConsentState = "granted" | "denied" | "undecided";

const CONSENT_KEY = "mv_stats_consent";
const VISITED_BEFORE_KEY = "mv_stats_visited_before";

export function resolveConsentState(): ConsentState {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (value === "granted") return "granted";
    if (value === "denied") return "denied";
    return "undecided";
  } catch {
    // localStorage onbeschikbaar (bv. privénavigatie) - dan kunnen we sowieso
    // niets onthouden, dus functioneel identiek aan "nog geen keuze".
    return "undecided";
  }
}

export function grantConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, "granted");
  } catch {
    // Kon niet opgeslagen worden - de toestemmingsmelding verschijnt dan
    // gewoon opnieuw bij de volgende paginaweergave. Nooit een fout tonen.
  }
}

export function denyConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, "denied");
  } catch {
    // Zie grantConsent() - zacht falen.
  }
}

/**
 * Trekt eerder gegeven toestemming in: verwijdert zowel de keuze zelf als
 * het herkenningssignaal. Na intrekken verschijnt de toestemmingsmelding
 * weer, en telt de eerstvolgende AI-sessie (zelfs met hernieuwde
 * toestemming) weer als "nieuw" - er is dan immers geen geldig signaal meer
 * dat deze browser ooit eerder is gezien.
 */
export function revokeConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(VISITED_BEFORE_KEY);
  } catch {
    // Zie grantConsent() - zacht falen.
  }
}

/**
 * Leest of dit apparaat VÓÓR deze aanroep al als eerder-bezocht bekend was,
 * en markeert het (indien nog niet zo) voor toekomstige bezoeken - maar
 * uitsluitend wanneer toestemming is gegeven. Zonder toestemming wordt hier
 * nooit gelezen of geschreven, en retourneert deze functie altijd `null`
 * (onbekend - nooit stilzwijgend als "nieuw" geraden).
 *
 * Wordt op ELKE paginaweergave aangeroepen (niet alleen AI-paginaweergaven):
 * "eerder bezocht" is een algemeen, sitebreed herkenningssignaal - een
 * bezoeker die al maanden direct binnenkomt en op een dag voor het eerst via
 * ChatGPT klikt, is voor de site geen nieuwe bezoeker.
 */
export function resolveAndMarkVisitedBefore(consentState: ConsentState): boolean | null {
  if (consentState !== "granted") return null;
  try {
    const wasVisitedBefore = localStorage.getItem(VISITED_BEFORE_KEY) === "1";
    if (!wasVisitedBefore) localStorage.setItem(VISITED_BEFORE_KEY, "1");
    return wasVisitedBefore;
  } catch {
    return null;
  }
}
