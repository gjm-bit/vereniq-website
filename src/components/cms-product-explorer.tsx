"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CmsRichText } from "@/src/components/cms-rich-text";
import { CmsMicrodemo, type CmsMicrodemoItem } from "@/src/components/cms-microdemo";

export type CmsProductExplorerHighlight = Readonly<{ id?: string; title?: string; description?: string; bodyHtml?: string; text?: string; imageMediaPath?: string; imageAltText?: string; imageDecorative?: boolean; visible?: boolean }>;

const childrenOf = (items: readonly CmsMicrodemoItem[] | undefined) => (items ?? []).filter((item) => item.visible !== false);
const mediaUrl = (path: string) => path.startsWith("http") ? path : `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/website-media/${path}`;
const displayMediaPath = (item: CmsMicrodemoItem) => {
  const path = item.imageMediaPath ?? item.mediaPath;
  // This legacy account-management capture is an internal administration
  // surface, not a customer-facing product visual. The CMS record remains
  // untouched; the stage is intentionally media-free until it is replaced.
  return path?.includes("management-overview") ? undefined : path;
};
// Finds the first real, CMS-linked capture anywhere in this item's own
// subtree (itself, then depth-first through its children) - used so a
// category node with no capture of its own (e.g. "Voetbal", which only
// groups Wedstrijden/Opstellingen/... ) shows a real descendant's capture
// instead of a "no capture chosen" placeholder that isn't true: a capture
// does exist, just one or more levels deeper.
const firstMediaDescendant = (item: CmsMicrodemoItem): CmsMicrodemoItem | undefined => {
  if (displayMediaPath(item)) return item;
  for (const child of childrenOf(item.children)) {
    const found = firstMediaDescendant(child);
    if (found) return found;
  }
  return undefined;
};

const withAlpha = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};
// Sourced read-only from the real app's own tenant theme (feestbende-app
// src/theme/colors.ts MeerVerenigingColors + src/theme/tokens.ts semantic
// resolution + src/features/fos/apps/registry.ts accentTokens), verified in
// the "De app — product truth" audit: Agenda and Sport both carry the app's
// "primary" violet (both use the calendar tile in FOS_APPS), Communicatie
// carries the "info" cyan (Prikbord's real accentToken), and Muziek/Meer/
// "Musical & Theater" share "brandAccent" electric blue (Repertoire's,
// Boetepot's and Musical's real, registry-confirmed accentToken - see
// registry.ts's own `id: 'musical', accentToken: 'brandAccent'` entry). No
// approximated colors - these are the literal resolved hex values
// (MeerVerenigingColors.violet / StatusColors.info /
// MeerVerenigingColors.electricBlue).
const worldAccent = (label: string | undefined) => ({ Agenda: "#8B36E8", Sport: "#8B36E8", Communicatie: "#72DCD7", Muziek: "#2476F3", Meer: "#2476F3", "Musical & Theater": "#2476F3" }[label ?? ""] ?? "#8B36E8");
const worldAccentStyle = (label: string | undefined): CSSProperties => {
  const accent = worldAccent(label);
  return { "--accent": accent, "--accent-wash": withAlpha(accent, 0.16), "--accent-glow-soft": withAlpha(accent, 0.2), "--accent-glow": withAlpha(accent, 0.35) } as CSSProperties;
};

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

// Faithful vector reproductions of the real app's own glyphs (feestbende-app
// src/features/fos/icons/icons/*.tsx), not approximated lookalikes. There is
// no shared package between the two repos, so each shape below is copied
// primitive-for-primitive (same viewBox 0 0 24 24, same coordinates, same
// strokeWidth 1.75 from FosIcon's fixed call-site value) from the source
// react-native-svg component into plain web SVG - CalendarGlyph, PushPinGlyph,
// MusicGlyph, FinanceGlyph and MasksGlyph respectively. Only the worlds the
// audit confirmed as real, member-facing product areas get an icon; there is
// no generic fallback glyph because every launcher world must resolve to one
// of these exactly-reproduced shapes.
// Also used for nested drill-down cards (e.g. Sport -> Voetbal): the real app
// has no icon of its own for any sub-screen (confirmed - Sport's match/lineup/
// stats/team screens render no app-tile icon at all), so every card inside a
// world's subtree reuses that world's own verified glyph, keyed by the root
// world label (trail[0]) rather than the card's own label.
function WorldIcon({ label }: { label?: string }) {
  // Agenda + Sport: CalendarGlyph (both use the same real app icon - the app
  // itself has no separate sport icon, see icons/calendar.tsx).
  if (label === "Agenda" || label === "Sport") return <Icon><rect x="3.5" y="4.5" width="17" height="16" rx="3" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="16" y1="2.5" x2="16" y2="6.5" /><path d="M8 13.5H8.01M12 13.5H12.01M16 13.5H16.01M8 17H8.01M12 17H12.01" strokeWidth={2.5} /></Icon>;
  // Communicatie: PushPinGlyph (Prikbord's real icon).
  if (label === "Communicatie") return <Icon><circle cx="14" cy="7.5" r="4" /><path d="M12.5 5.5L15.5 8.5" /><path d="M11.5 10.8L6.5 21" /></Icon>;
  // Muziek: MusicGlyph (Repertoire's real icon).
  if (label === "Muziek") return <Icon><circle cx="7.5" cy="17" r="3" /><path d="M10.5 17V5.5L18 4V13" /><circle cx="15" cy="14.5" r="3" /><path d="M10.5 8.5L18 7" /></Icon>;
  // Meer: FinanceGlyph (Boetepot's real icon - the one confirmed real icon
  // among Meer's bundled features).
  if (label === "Meer") return <Icon><path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 17.2467 6.75329 21.5 12 21.5Z" /><path d="M14.8 8.3C14.1 7.7 13.1 7.4 12.2 7.5C10.3 7.7 9 9.3 9 11.2V12.8C9 14.7 10.3 16.3 12.2 16.5C13.1 16.6 14.1 16.3 14.8 15.7" /><path d="M7.5 10.6H12.5" /><path d="M7.5 13.2H12.5" /></Icon>;
  // Musical & Theater: MasksGlyph (registry.ts confirms icon: 'masks' for
  // this exact world). Two overlapping, fully closed theatre masks -
  // deliberately no connecting "bridge" between them (the app's own icon
  // file documents that an earlier version read as a diving mask/goggles
  // once a bridge was added; this reproduction keeps both ovals separate).
  if (label === "Musical & Theater") return <Icon><ellipse cx="14.5" cy="9.5" rx="5" ry="6" /><circle cx="13" cy="7.8" r="0.6" fill="currentColor" stroke="none" /><circle cx="16" cy="7.8" r="0.6" fill="currentColor" stroke="none" /><path d="M12.2 13.2C13.2 11.2 15.8 11.2 16.8 13.2" /><ellipse cx="9.5" cy="14.5" rx="5" ry="6" /><circle cx="8" cy="13.3" r="0.6" fill="currentColor" stroke="none" /><circle cx="11" cy="13.3" r="0.6" fill="currentColor" stroke="none" /><path d="M7.2 17.2C8.2 19.5 10.8 19.5 11.8 17.2" /></Icon>;
  return null;
}

/** A generic, CMS-backed product explorer layered on the existing microdemo contract. */
export function CmsProductExplorer({ heading, items, highlights = [] }: { heading?: string; items: readonly CmsMicrodemoItem[]; highlights?: readonly CmsProductExplorerHighlight[] }) {
  const roots = childrenOf(items);
  const [trail, setTrail] = useState<readonly CmsMicrodemoItem[]>([]);
  const active = trail.at(-1);
  const level = active ? childrenOf(active.children) : roots;
  const activeMediaSource = active ? firstMediaDescendant(active) : undefined;
  // The hero visual isn't pinned to any single world label — the first world
  // in CMS order carrying a real, customer-facing capture leads, and a second
  // one (once published) overlaps it the same way. No visual here is invented.
  const heroCaptures = roots.filter((item) => displayMediaPath(item));
  const primaryCapture = heroCaptures[0];
  const secondaryCapture = heroCaptures[1];
  const practiceWorld = roots.find((item) => childrenOf(item.children).length > 0);
  const practiceEntry = practiceWorld ? childrenOf(practiceWorld.children)[0] : undefined;
  const practiceItems = practiceEntry ? childrenOf(practiceEntry.children) : [];
  const open = (item: CmsMicrodemoItem) => setTrail([...trail, item]);
  if (!roots.length) return null;
  return <section className="cms-product-explorer" aria-label={heading ?? "De app"}>
    <div className="cms-explorer-hero-container">
      <header className="cms-explorer-intro">
        <div>
          <p className="eyebrow">De app</p>
          <h1>{heading ?? "Kijk zelf maar."}</h1>
          <p>What you see is what you get.</p>
        </div>
        {primaryCapture ? <figure className="cms-explorer-visual">
          <span className="cms-explorer-visual-glow" aria-hidden="true" />
          <div className="cms-explorer-device">
            <img className="cms-explorer-visual-primary" src={mediaUrl(displayMediaPath(primaryCapture)!)} alt={primaryCapture.imageDecorative ? "" : primaryCapture.imageAltText ?? "Productinterface van Meer Vereniging"} />
          </div>
          {secondaryCapture ? <img className="cms-explorer-visual-secondary" src={mediaUrl(displayMediaPath(secondaryCapture)!)} alt={secondaryCapture.imageDecorative ? "" : secondaryCapture.imageAltText ?? ""} /> : null}
        </figure> : null}
      </header>
      {trail.length === 0 ? <div className="cms-explorer-launcher-heading"><p className="eyebrow">Verken de app</p><h2>Kies een wereld</h2></div> : null}
      {trail.length === 0 ? <div className="cms-explorer-launcher" role="tablist" aria-label="Productwerelden">{level.map((item, index) => <button key={item.id ?? index} type="button" role="tab" style={worldAccentStyle(item.label)} onClick={() => open(item)}><span className="cms-explorer-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="cms-explorer-icon" aria-hidden="true"><WorldIcon label={item.label} /></span><strong>{item.label ?? item.title ?? `Onderdeel ${index + 1}`}</strong><small>{item.title ?? "Ontdek deze wereld"}</small><span className="cms-explorer-arrow" aria-hidden="true">↗</span></button>)}</div> : null}
    </div>
    <div className="development-container">
      {trail.length ? <button className="cms-explorer-back" type="button" onClick={() => setTrail(trail.slice(0, -1))}>← De app / {trail.map((item) => item.label ?? item.title).join(" / ")}</button> : null}
      {trail.length ? <div className="cms-explorer-children" role="tablist" aria-label={active?.label ?? "Onderdeel"}>{level.map((item, index) => <button key={item.id ?? index} type="button" role="tab" style={worldAccentStyle(trail[0]?.label)} onClick={() => open(item)}><span className="cms-explorer-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="cms-explorer-icon" aria-hidden="true"><WorldIcon label={trail[0]?.label} /></span><strong>{item.label ?? item.title ?? `Onderdeel ${index + 1}`}</strong><small>{item.title ?? "Ontdek deze wereld"}</small><span className="cms-explorer-arrow" aria-hidden="true">↗</span></button>)}</div> : null}
      {trail.length === 0 && highlights.length ? <section className="cms-explorer-highlights" aria-label="Uitgelicht"><p className="eyebrow">Uitgelicht</p><h2>Ontdek wat het verschil maakt</h2><div>{highlights.filter((item) => item.visible !== false).map((item, index) => <article key={item.id ?? index}>{item.imageMediaPath ? <img src={mediaUrl(item.imageMediaPath)} alt={item.imageDecorative ? "" : item.imageAltText ?? ""} /> : null}<span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title ?? "Meer Vereniging"}</h3><CmsRichText html={item.bodyHtml} />{!item.bodyHtml && (item.description ?? item.text) ? <p>{item.description ?? item.text}</p> : null}</article>)}</div></section> : null}
      {active ? <article className="cms-explorer-stage"><div><p className="eyebrow">{active.label ?? "In de app"}</p><h2>{active.title}</h2><CmsRichText html={active.bodyHtml} />{active.proofPoints?.length ? <ul>{active.proofPoints.map((point) => <li key={point}>{point}</li>)}</ul> : null}</div>{activeMediaSource ? <img src={mediaUrl(displayMediaPath(activeMediaSource)!)} alt={activeMediaSource.imageDecorative ? "" : activeMediaSource.imageAltText ?? ""} /> : <p className="cms-explorer-capture-note">Voor deze wereld kiest je contentteam een passende productcapture.</p>}</article> : null}
    </div>
    {trail.length === 0 && practiceWorld && practiceEntry && practiceItems.length ? <CmsMicrodemo heading={`${practiceWorld.label} → ${practiceEntry.label}`} items={practiceItems} /> : null}
  </section>;
}
