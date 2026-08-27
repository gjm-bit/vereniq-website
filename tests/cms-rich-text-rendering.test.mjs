import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sanitizeRichText } from "../src/lib/sanitize-rich-text.ts";

test("editor-escaped paragraphs and emphasis become safe semantic HTML", () => {
  const html = sanitizeRichText("&lt;p&gt;Rustig &lt;strong&gt;samenwerken&lt;/strong&gt;.&lt;/p&gt;");
  assert.equal(html, "<p>Rustig <strong>samenwerken</strong>.</p>");
  assert.doesNotMatch(html, /&lt;(?:p|strong)/i);
});

test("safe rich-text links survive the shared renderer boundary", () => {
  assert.equal(
    sanitizeRichText('<p><a href="/contact">Neem contact op</a></p>'),
    '<p><a href="/contact">Neem contact op</a></p>',
  );
});

test("scripts, event handlers and unsafe links are removed by the shared boundary", () => {
  const html = sanitizeRichText('<p onclick="alert(1)">Veilig</p><script>alert(1)</script><a href="javascript:alert(1)">Nee</a>');
  assert.equal(html, '<p>Veilig</p><a>Nee</a>');
  assert.doesNotMatch(html, /script|onclick|javascript:/i);
});

test("all public rich-text fields share the same safe component while labels remain text nodes", async () => {
  const [publicPage, microdemo, component] = await Promise.all([
    readFile(new URL("../src/components/cms-public-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cms-microdemo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cms-rich-text.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(publicPage, /import \{ CmsRichText \}/);
  assert.match(microdemo, /import \{ CmsRichText \}/);
  assert.match(microdemo, /<p className="eyebrow">\{item\.label/);
  assert.match(microdemo, /<h3>\{item\.title/);
  assert.match(microdemo, /<li key=\{point\}>\{point\}<\/li>/);
  assert.match(component, /sanitizeRichText\(html\)/);
});

test("the product stage omits an empty media column instead of rendering a blank placeholder", async () => {
  const microdemo = await readFile(new URL("../src/components/cms-microdemo.tsx", import.meta.url), "utf8");
  assert.match(microdemo, /const hasMedia = Boolean\(video \|\| path\)/);
  assert.match(microdemo, /cms-microdemo-stage \$\{hasMedia \? "has-media" : "no-media"\}/);
  assert.match(microdemo, /\{hasMedia \? <div className="cms-microdemo-media">/);
});
