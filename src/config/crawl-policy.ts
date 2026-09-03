/**
 * Eén gedeelde bron van waarheid voor "welke routes zijn nooit publiek/
 * indexeerbaar" - gebruikt door zowel `app/robots.ts` (crawlerregels) als
 * `src/lib/server/indexnow.ts` (welke URL's nooit naar IndexNow gestuurd
 * mogen worden). Vóór deze wijziging stond deze lijst alleen lokaal in
 * `app/robots.ts`; nu is er precies één plek om aan te passen, en kunnen de
 * twee nooit uit elkaar lopen.
 */
export const DISALLOWED_PATH_PREFIXES = ["/master", "/cms-preview", "/api/"] as const;

/**
 * True als `path` (bv. "/master/instellingen") onder een nooit-publieke
 * prefix valt. Vergelijkt op volledige padsegmenten, niet op kale
 * stringprefix: "/masterplan" mag NIET matchen op de "/master"-regel.
 */
export function isDisallowedPath(path: string): boolean {
  return DISALLOWED_PATH_PREFIXES.some((prefix) => {
    const boundary = prefix.endsWith("/") ? prefix : `${prefix}/`;
    return path === prefix || path.startsWith(boundary);
  });
}
