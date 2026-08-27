export type WebsiteVideoProvider = "youtube" | "vimeo";
export type WebsiteBackgroundVideoOverlay = "none" | "light" | "normal" | "strong";
export type WebsiteBackgroundVideoPosition = "left-top" | "center-top" | "right-top" | "left-center" | "center" | "right-center" | "left-bottom" | "center-bottom" | "right-bottom";
export type WebsiteVideoContent = Readonly<{
  provider: WebsiteVideoProvider;
  videoId: string;
  url: string;
  title?: string;
  description?: string;
  aspectRatio?: "16:9" | "4:3" | "9:16";
  width?: "normal" | "wide" | "full";
  alignment?: "left" | "center";
  controls?: boolean;
  startAt?: number;
  autoplay?: boolean;
  loop?: boolean;
}>;
export type WebsiteBackgroundVideoContent = WebsiteVideoContent & Readonly<{ autoplay: true; loop: boolean; controls: false }>;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);
const VIDEO_ID = /^[A-Za-z0-9_-]{6,64}$/;
const VIMEO_ID = /^[0-9]{1,20}$/;

function canonical(provider: WebsiteVideoProvider, id: string): string {
  return provider === "youtube" ? `https://www.youtube-nocookie.com/watch?v=${encodeURIComponent(id)}` : `https://vimeo.com/${encodeURIComponent(id)}`;
}

export function parseWebsiteVideoUrl(raw: string): Readonly<{ provider: WebsiteVideoProvider; videoId: string; startAt?: number; url: string }> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  let parsed: URL;
  try { parsed = new URL(raw.trim()); } catch { return null; }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) {
    const id = host === "youtu.be" ? parsed.pathname.split("/").filter(Boolean)[0] ?? "" : parsed.pathname === "/watch" ? parsed.searchParams.get("v") ?? "" : parsed.pathname.startsWith("/embed/") ? parsed.pathname.split("/").filter(Boolean)[1] ?? "" : "";
    if (!VIDEO_ID.test(id)) return null;
    const start = parsed.searchParams.get("start") ?? parsed.searchParams.get("t");
    const startAt = start && /^\d+$/.test(start) ? Math.min(Number(start), 86400) : undefined;
    return { provider: "youtube", videoId: id, ...(startAt === undefined ? {} : { startAt }), url: canonical("youtube", id) };
  }
  if (VIMEO_HOSTS.has(host)) {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = host === "player.vimeo.com" && parts[0] === "video" ? parts[1] ?? "" : parts[0] ?? "";
    return VIMEO_ID.test(id) ? { provider: "vimeo", videoId: id, url: canonical("vimeo", id) } : null;
  }
  return null;
}

export function normalizeWebsiteVideo(value: unknown): WebsiteVideoContent | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const parsed = parseWebsiteVideoUrl(String(input.url ?? ""));
  if (!parsed || (input.provider !== undefined && input.provider !== parsed.provider) || (input.videoId !== undefined && input.videoId !== parsed.videoId)) return null;
  if (input.autoplay === true || input.loop === true || input.embedUrl !== undefined || input.iframe !== undefined || input.html !== undefined) return null;
  const aspectRatio = input.aspectRatio === undefined ? "16:9" : input.aspectRatio;
  const width = input.width === undefined ? "normal" : input.width;
  const alignment = input.alignment === undefined ? "center" : input.alignment;
  if (!["16:9", "4:3", "9:16"].includes(String(aspectRatio)) || !["normal", "wide", "full"].includes(String(width)) || !["left", "center"].includes(String(alignment))) return null;
  const controls = input.controls === undefined ? true : input.controls;
  if (typeof controls !== "boolean") return null;
  const startAt = input.startAt === undefined ? parsed.startAt : input.startAt;
  if (startAt !== undefined && (typeof startAt !== "number" || !Number.isInteger(startAt) || startAt < 0 || startAt > 86400)) return null;
  const title = input.title === undefined ? undefined : String(input.title);
  const description = input.description === undefined ? undefined : String(input.description);
  if (title?.includes("<") || title?.includes(">") || description?.includes("<") || description?.includes(">")) return null;
  return { provider: parsed.provider, videoId: parsed.videoId, url: parsed.url, ...(title ? { title } : {}), ...(description ? { description } : {}), aspectRatio: aspectRatio as WebsiteVideoContent["aspectRatio"], width: width as WebsiteVideoContent["width"], alignment: alignment as WebsiteVideoContent["alignment"], controls, ...(startAt === undefined ? {} : { startAt }), autoplay: false, loop: false };
}

export function normalizeWebsiteBackgroundVideo(value: unknown): WebsiteBackgroundVideoContent | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (input.autoplay !== undefined && input.autoplay !== true) return null;
  if (input.loop !== undefined && typeof input.loop !== "boolean") return null;
  if (input.controls !== undefined && input.controls !== false) return null;
  const normalized = normalizeWebsiteVideo({ ...input, autoplay: false, loop: false, controls: false });
  return normalized ? { ...normalized, autoplay: true, loop: input.loop === undefined ? true : input.loop, controls: false } : null;
}

export function getWebsiteVideoEmbedUrl(content: WebsiteVideoContent): string {
  const params = new URLSearchParams({ controls: content.controls === false ? "0" : "1", autoplay: "0" });
  if (content.provider === "youtube") { params.set("rel", "0"); if (content.startAt !== undefined) params.set("start", String(content.startAt)); return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(content.videoId)}?${params.toString()}`; }
  return `https://player.vimeo.com/video/${encodeURIComponent(content.videoId)}?${params.toString()}`;
}

export function getWebsiteVideoBackgroundEmbedUrl(content: WebsiteBackgroundVideoContent): string {
  if (content.provider === "youtube") {
    const params = new URLSearchParams({ autoplay: "1", mute: "1", controls: "0", loop: content.loop ? "1" : "0", ...(content.loop ? { playlist: content.videoId } : {}), playsinline: "1", rel: "0" });
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(content.videoId)}?${params.toString()}`;
  }
  const params = new URLSearchParams({ autoplay: "1", muted: "1", background: "1", loop: content.loop ? "1" : "0", controls: "0" });
  return `https://player.vimeo.com/video/${encodeURIComponent(content.videoId)}?${params.toString()}`;
}
