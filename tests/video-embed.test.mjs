import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { getWebsiteVideoBackgroundEmbedUrl, getWebsiteVideoEmbedUrl, normalizeWebsiteBackgroundVideo, normalizeWebsiteVideo } = await import("../src/lib/website-video.ts");

test("public video renderer contract emits only allowlisted provider embeds", () => {
  const content = normalizeWebsiteVideo({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Demo", aspectRatio: "16:9", controls: true });
  assert.ok(content);
  assert.match(getWebsiteVideoEmbedUrl(content), /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
  assert.match(getWebsiteVideoEmbedUrl(content), /autoplay=0/);
  assert.equal(normalizeWebsiteVideo({ url: "https://example.com/frame", embedUrl: "https://example.com/frame" }), null);
  assert.equal(normalizeWebsiteVideo({ url: "javascript:alert(1)" }), null);
});

test("background video embeds are muted, autoplaying and allowlisted", () => {
  const youtube = normalizeWebsiteBackgroundVideo({ url: "https://youtu.be/dQw4w9WgXcQ", loop: true, controls: false, autoplay: true });
  assert.ok(youtube);
  const youtubeEmbed = getWebsiteVideoBackgroundEmbedUrl(youtube);
  assert.match(youtubeEmbed, /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
  assert.match(youtubeEmbed, /autoplay=1/);
  assert.match(youtubeEmbed, /mute=1/);
  assert.match(youtubeEmbed, /loop=1/);
  assert.match(youtubeEmbed, /playlist=dQw4w9WgXcQ/);
  const vimeo = normalizeWebsiteBackgroundVideo({ url: "https://vimeo.com/76979871" });
  assert.ok(vimeo);
  assert.equal(vimeo.loop, true);
  assert.match(getWebsiteVideoBackgroundEmbedUrl(vimeo), /muted=1/);
  assert.equal(normalizeWebsiteBackgroundVideo({ url: "https://example.com/video", autoplay: true }), null);
  assert.equal(normalizeWebsiteBackgroundVideo({ url: "https://youtu.be/dQw4w9WgXcQ", controls: true }), null);
});

test("background video honors reduced motion with a poster fallback", () => {
  const css = readFileSync(new URL("../app/cms-video.css", import.meta.url), "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /cms-background-video iframe \{ display: none; \}/);
  assert.match(css, /cms-background-video-poster \{ z-index: 2; \}/);
});
