const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Maps a public commercial route to the existing CMS slug contract.
 *
 * Pages with a future path-aware CMS slug resolve through the exact path. The
 * second candidate keeps a single-slug schema useful for a nested route such
 * as /sport/voetbal, where the CMS record can safely use `sport-voetbal`.
 * Route segments are deliberately validated here: no request value can ever
 * influence the CMS organisation or broaden the public RPC query.
 */
export function commercialCmsPathCandidates(segments) {
  if (!Array.isArray(segments) || segments.length === 0 || !segments.every((segment) => SEGMENT.test(segment))) {
    return [];
  }

  const exactPath = `/${segments.join("/")}`;
  if (segments.length === 1) return [exactPath];

  return [exactPath, `/${segments.join("-")}`];
}
