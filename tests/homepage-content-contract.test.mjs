import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage visuals use the CMS content contract", async () => {
  const component = await readFile(new URL("../src/components/homepage-creative.tsx", import.meta.url), "utf8");
  const contract = await readFile(new URL("../src/lib/homepage-content.ts", import.meta.url), "utf8");
  assert.doesNotMatch(component, /\/assets\/product\//, "content asset paths must not be owned by the renderer");
  for (const field of ["mediaId", "mobileMediaId", "altText", "decorative", "focus", "fit", "zoom", "presentation", "sortOrder", "visible"]) {
    assert.match(contract, new RegExp(field), `missing CMS field: ${field}`);
  }
  assert.match(contract, /normalizeHomepageContent/);
  assert.match(component, /resolveHomepageMediaPresentation/);
  assert.match(component, /resolveHomepageMediaPresentation/);
  assert.match(component, /mv-scene-art \$\{presentation\.className\}/);
  assert.match(component, /mv-problem-solution-transition/);
  assert.match(component, /\{content\.productShowcase\.body\}/);
  assert.match(component, /Boolean\(mediaUrl\(item\.media\)\)/);
  assert.doesNotMatch(component, /drinkLines/);
  assert.doesNotMatch(component, /Media kiezen in Websitebeheer/);
});

test("Scene and ProductVisual share the CMS media presentation policy", async () => {
  const policy = await readFile(new URL("../src/lib/homepage-media-presentation.ts", import.meta.url), "utf8");
  const stylesheet = await readFile(new URL("../app/homepage-creative.css", import.meta.url), "utf8");
  assert.match(policy, /presentation === "browser" \|\| presentation === "phone" \|\| presentation === "plain"/);
  assert.match(policy, /\? "contain"/);
  assert.match(policy, /presentation === "full-bleed"/);
  assert.match(policy, /\? "cover"/);
  assert.match(policy, /fit === "contain" \? "center"/);
  assert.match(stylesheet, /\.mv-scene-art\.mv-presentation-browser \.mv-scene-cms-image/);
  assert.match(stylesheet, /\.mv-scene-art\.mv-presentation-full-bleed \.mv-scene-cms-image/);
  assert.match(stylesheet, /grid-template-rows:auto minmax\(190px,1fr\)/);
  assert.match(stylesheet, /\.mv-compressed-chaos \.mv-scene-art::after\{display:none\}/);
  assert.match(stylesheet, /@media\(max-width:480px\).*\.mv-scene-art\.mv-presentation-browser/s);
});

test("homepage editor exposes the content inspector and safe media picker", async () => {
  const editor = await readFile(new URL("../src/components/website-editor.tsx", import.meta.url), "utf8");
  for (const label of ["Inhoud", "Opmaak", "Media", "Bibliotheek", "Uploaden", "Alt-tekst", "Focus", "Fit", "Presentatie", "Zoom"]) {
    assert.match(editor, new RegExp(label));
  }
  assert.match(editor, /image\/jpeg,image\/png,image\/webp,image\/gif/);
  assert.match(editor, /10\*1024\*1024/);
});
