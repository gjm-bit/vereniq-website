import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { commercialCmsPathCandidates } from "../src/lib/commercial-cms-paths.mjs";

test("commercial CMS routes support exact and safe hierarchical CMS paths", () => {
  assert.deepEqual(commercialCmsPathCandidates(["mogelijkheden"]), ["/mogelijkheden"]);
  assert.deepEqual(commercialCmsPathCandidates(["sport"]), ["/sport"]);
  assert.deepEqual(commercialCmsPathCandidates(["sport", "voetbal"]), ["/sport/voetbal", "/sport-voetbal"]);
  assert.deepEqual(commercialCmsPathCandidates(["sport", "../other-tenant"]), []);
  assert.deepEqual(commercialCmsPathCandidates([]), []);
});

test("public commercial routes remain published-only, tenant-bound, and preserve secure preview", async () => {
  const route = await readFile(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8");
  const publicCms = await readFile(new URL("../src/lib/public-cms.ts", import.meta.url), "utf8");
  const preview = await readFile(new URL("../src/components/cms-preview-page.tsx", import.meta.url), "utf8");

  assert.match(route, /commercialCmsPathCandidates\(segments\)/);
  assert.match(route, /getPublishedCmsPage\(path\)/);
  assert.match(route, /if \(segments\.length !== 1\) notFound\(\)/);
  assert.match(publicCms, /website_public_page/);
  assert.match(publicCms, /org_slug: CMS_ORGANIZATION_SLUG/);
  assert.doesNotMatch(publicCms, /org_slug:\s*(?:path|segments|params)/);
  assert.match(preview, /getCmsPreviewPage\(token\)/);
  assert.doesNotMatch(route, /website_preview_page|website_save_draft|website_publish/);
});
