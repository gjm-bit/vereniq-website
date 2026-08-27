"use client";

import { useId, useState } from "react";
import { CmsRichText } from "@/src/components/cms-rich-text";

type DemoVideo = Readonly<{ provider?: "youtube" | "vimeo"; videoId?: string; url?: string; controls?: boolean }>;
export type CmsMicrodemoItem = Readonly<{ id?: string; label?: string; title?: string; bodyHtml?: string; proofPoints?: readonly string[]; imageMediaPath?: string; mediaPath?: string; imageAltText?: string; imageDecorative?: boolean; demoVideo?: DemoVideo; children?: readonly CmsMicrodemoItem[]; visible?: boolean }>;

function safeVideoUrl(video: DemoVideo | undefined): string | null {
  if (!video?.provider || !video.videoId) return null;
  if (video.provider === "youtube") return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId)}?autoplay=0&rel=0&controls=${video.controls === false ? "0" : "1"}`;
  if (video.provider === "vimeo") return `https://player.vimeo.com/video/${encodeURIComponent(video.videoId)}?autoplay=0&controls=${video.controls === false ? "0" : "1"}`;
  return null;
}

function mediaUrl(path: string): string { return path.startsWith("http") ? path : `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/website-media/${path}`; }

/** A CMS-owned, keyboard-accessible product stage. It deliberately has no autoplay or external runtime. */
export function CmsMicrodemo({ heading, items }: { heading?: string; items: readonly CmsMicrodemoItem[] }) {
  const visible = items.filter((item) => item.visible !== false);
  const [active, setActive] = useState(0);
  const baseId = useId();
  if (!visible.length) return null;
  const activeIndex = Math.min(active, visible.length - 1);
  const item = visible[activeIndex];
  const path = item.imageMediaPath ?? item.mediaPath;
  const video = safeVideoUrl(item.demoVideo);
  const hasMedia = Boolean(video || path);
  return <section className="cms-microdemo" aria-label={heading ?? "Productshowcase"}>
    <div className="development-container">
      {heading ? <h2 className="cms-card-heading">{heading}</h2> : null}
      <div className="cms-microdemo-tabs" role="tablist" aria-label={heading ?? "Productonderdelen"}>{visible.map((entry, index) => <button key={entry.id ?? index} id={`${baseId}-tab-${index}`} type="button" role="tab" aria-selected={index === activeIndex} aria-controls={`${baseId}-panel-${index}`} tabIndex={index === activeIndex ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "Home" || event.key === "End") { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? visible.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + visible.length) % visible.length; setActive(next); document.getElementById(`${baseId}-tab-${next}`)?.focus(); } }}>{entry.label ?? entry.title ?? `Onderdeel ${index + 1}`}</button>)}</div>
      <div id={`${baseId}-panel-${activeIndex}`} role="tabpanel" aria-labelledby={`${baseId}-tab-${activeIndex}`} className={`cms-microdemo-stage ${hasMedia ? "has-media" : "no-media"}`}>
        <div className="cms-microdemo-copy"><p className="eyebrow">{item.label ?? "In de praktijk"}</p><h3>{item.title ?? "Meer Vereniging"}</h3><CmsRichText html={item.bodyHtml} />{item.proofPoints?.length ? <ul>{item.proofPoints.map((point) => <li key={point}>{point}</li>)}</ul> : null}</div>
        {hasMedia ? <div className="cms-microdemo-media">{video ? <iframe src={video} title={item.title ?? "Productdemo"} loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen /> : path ? <img src={mediaUrl(path)} alt={item.imageDecorative ? "" : item.imageAltText ?? ""} loading="lazy" /> : null}</div> : null}
      </div>
    </div>
  </section>;
}
