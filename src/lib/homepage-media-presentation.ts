import type { CSSProperties } from "react";
import type { HomepageMedia, HomepageMediaFit, HomepageMediaPresentation } from "@/src/lib/homepage-content";

type ResolvedPresentation = Readonly<{
  className: `mv-presentation-${HomepageMediaPresentation}`;
  fit: HomepageMediaFit;
  objectPosition: string;
}>;

const focusCoordinates: Record<string, string> = {
  "left-top": "left top", "center-top": "center top", "right-top": "right top",
  "left-center": "left center", "right-center": "right center",
  "left-bottom": "left bottom", "center-bottom": "center bottom", "right-bottom": "right bottom",
  "top-left": "left top", "top-right": "right top", "bottom-left": "left bottom", "bottom-right": "right bottom",
};

/**
 * The CMS token is the single source of truth for each image's framing.
 * Interface presets always preserve the whole UI; photographic full-bleed
 * media retains its CMS focus for an intentional crop.
 */
export function resolveHomepageMediaPresentation(media: HomepageMedia): ResolvedPresentation {
  const presentation = media.presentation ?? media.layoutVariant ?? "plain";
  const fit = presentation === "browser" || presentation === "phone" || presentation === "plain"
    ? "contain"
    : presentation === "full-bleed"
      ? "cover"
      : media.fit ?? "cover";

  return {
    className: `mv-presentation-${presentation}`,
    fit,
    objectPosition: fit === "contain" ? "center" : focusCoordinates[media.focus ?? "center"] ?? "center",
  };
}

export function homepageMediaStyle(media: HomepageMedia): CSSProperties {
  const presentation = resolveHomepageMediaPresentation(media);
  return {
    objectFit: presentation.fit,
    objectPosition: presentation.objectPosition,
    transform: `scale(${(media.zoom ?? 100) / 100})`,
  };
}
