import type { CmsBlock, CmsPublicPage } from "@/src/lib/public-cms";
import { SiteLink as Link } from "@/src/components/site-link";
import { PublicShell } from "@/src/components/site-shell";
import { CmsRichText } from "@/src/components/cms-rich-text";
import { getWebsiteVideoBackgroundEmbedUrl, getWebsiteVideoEmbedUrl, normalizeWebsiteBackgroundVideo, normalizeWebsiteVideo, type WebsiteBackgroundVideoPosition, type WebsiteVideoContent } from "@/src/lib/website-video";
import { HomepageCreative } from "@/src/components/homepage-creative";
import { normalizeHomepageContent } from "@/src/lib/homepage-content";
import { CmsMicrodemo, type CmsMicrodemoItem } from "@/src/components/cms-microdemo";
import { CmsProductExplorer, type CmsProductExplorerHighlight } from "@/src/components/cms-product-explorer";

type StyleTokens = Readonly<{ background?: "default" | "dark" | "light" | "accent"; spacing?: "compact" | "normal" | "spacious"; contentWidth?: "narrow" | "normal" | "wide"; textAlign?: "left" | "center"; textStyle?: "body" | "lead" | "small" | "h1" | "h2" | "h3" | "quote"; textSize?: "small" | "normal" | "large"; headingSize?: "normal" | "large" | "xlarge"; bodySize?: "normal" | "large"; fontWeight?: "normal" | "medium" | "bold"; textColor?: "auto" | "light" | "dark" | "accent" }>;
type ImageContent = Readonly<{ mediaId?: string; mediaPath?: string; altText?: string; caption?: string; decorative?: boolean; alignment?: "left" | "center" | "right"; width?: "small" | "medium" | "large" | "full"; objectFit?: "cover" | "contain"; focus?: string; styles?: StyleTokens }>;
type TextContent = Readonly<{ heading?: string; paragraphs?: readonly string[]; bodyHtml?: string; columns?: 1 | 2; imageAltText?: string; imageDecorative?: boolean; styles?: StyleTokens; mediaPath?: string; imageMediaPath?: string }>;
type BackgroundMediaContent = Readonly<{ mediaType?: "none" | "image" | "video"; backgroundVideo?: unknown; backgroundOverlay?: "none" | "light" | "normal" | "strong"; backgroundPosition?: WebsiteBackgroundVideoPosition; backgroundLoop?: boolean; imageMediaPath?: string; mediaPath?: string; imageAltText?: string; imageDecorative?: boolean; imageFocus?: string }>;
type HeroContent = Readonly<{ title?: string; subtitle?: string; eyebrow?: string; bodyHtml?: string; ctaLabel?: string; ctaDestination?: string; imageAltText?: string; imageDecorative?: boolean; imageFocus?: string; mediaPath?: string; imageMediaPath?: string; styles?: StyleTokens } & BackgroundMediaContent>;
type CtaContent = Readonly<{ label?: string; heading?: string; bodyHtml?: string; destinationType?: string; destinationUrl?: string; style?: string; styles?: StyleTokens } & BackgroundMediaContent>;
type Card = Readonly<{ id?: string; title?: string; description?: string; bodyHtml?: string; text?: string; imageMediaId?: string; imageMediaPath?: string; imageAltText?: string; imageDecorative?: boolean; visible?: boolean; link?: { destinationUrl?: string; label?: string } }>;
type CardGridContent = Readonly<{ heading?: string; presentation?: "grid" | "microdemo"; explorer?: boolean; cards?: readonly Card[]; columns?: 2 | 3 | 4; styles?: StyleTokens }>;
type FaqContent = Readonly<{ heading?: string; items?: readonly { id?: string; question?: string; answer?: string; answerHtml?: string; visible?: boolean }[]; styles?: StyleTokens }>;

function string(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function safeHref(value: unknown, fallback = "/contact"): string {
  const href = string(value);
  return href && (/^https?:\/\//.test(href) || href.startsWith("/")) ? href : fallback;
}

function tokenClass(styles: StyleTokens | undefined): string {
  if (!styles) return '';
  const allow = <T extends string>(value: T | undefined, values: readonly T[]) => value && values.includes(value) ? value : undefined;
  return [allow(styles.background, ['default', 'dark', 'light', 'accent']) && `cms-bg-${allow(styles.background, ['default', 'dark', 'light', 'accent'])}`, allow(styles.spacing, ['compact', 'normal', 'spacious']) && `cms-spacing-${allow(styles.spacing, ['compact', 'normal', 'spacious'])}`, allow(styles.contentWidth, ['narrow', 'normal', 'wide']) && `cms-width-${allow(styles.contentWidth, ['narrow', 'normal', 'wide'])}`, allow(styles.textAlign, ['left', 'center']) && `cms-align-${allow(styles.textAlign, ['left', 'center'])}`, allow(styles.textStyle, ['body', 'lead', 'small', 'h1', 'h2', 'h3', 'quote']) && `mv-text-${allow(styles.textStyle, ['body', 'lead', 'small', 'h1', 'h2', 'h3', 'quote'])}`, allow(styles.textSize, ['small', 'normal', 'large']) && `mv-size-${allow(styles.textSize, ['small', 'normal', 'large'])}`, allow(styles.headingSize, ['normal', 'large', 'xlarge']) && `cms-hero-heading-${allow(styles.headingSize, ['normal', 'large', 'xlarge'])}`, allow(styles.bodySize, ['normal', 'large']) && `cms-hero-body-${allow(styles.bodySize, ['normal', 'large'])}`, allow(styles.fontWeight, ['normal', 'medium', 'bold']) && `mv-weight-${allow(styles.fontWeight, ['normal', 'medium', 'bold'])}`, allow(styles.textColor, ['auto', 'light', 'dark', 'accent']) && `mv-color-${allow(styles.textColor, ['auto', 'light', 'dark', 'accent'])}`].filter(Boolean).join(' ');
}

function CmsImage({ image, mediaPath }: { image: ImageContent; mediaPath?: string }) {
  const path = mediaPath ?? image.mediaPath;
  if (!path) return null;
  const alt = image.decorative ? '' : image.altText ?? '';
  const publicUrl = path.startsWith('http') ? path : `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')}/storage/v1/object/public/website-media/${path}`;
  return <figure className={`cms-image cms-image-${image.alignment ?? 'center'} cms-image-width-${image.width ?? 'full'}`}><img src={publicUrl} alt={alt} loading="lazy" style={{ objectFit: image.objectFit ?? 'cover', objectPosition: image.focus?.replace('-', ' ') ?? 'center' }} />{image.caption ? <figcaption>{image.caption}</figcaption> : null}</figure>;
}

function CmsBackgroundVideo({ content }: { content: BackgroundMediaContent }) {
  if (content.mediaType !== "video" && !(content.mediaType === undefined && content.backgroundVideo)) return null;
  const source = content.backgroundVideo && typeof content.backgroundVideo === "object" && !Array.isArray(content.backgroundVideo)
    ? content.backgroundVideo as Record<string, unknown>
    : {};
  const video = normalizeWebsiteBackgroundVideo({ ...source, ...(content.backgroundLoop === undefined ? {} : { loop: content.backgroundLoop }), autoplay: true, controls: false });
  if (!video) return null;
  const posterPath = content.imageMediaPath ?? content.mediaPath;
  const posterUrl = posterPath ? (posterPath.startsWith("http") ? posterPath : `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/website-media/${posterPath}`) : undefined;
  const position = String(content.backgroundPosition ?? "center").replace("-", " ");
  const overlay = content.backgroundOverlay ?? "normal";
  return <div className="cms-background-video" data-testid="cms-background-video" aria-hidden="true">
    {posterUrl ? <img className="cms-background-video-poster" src={posterUrl} alt="" loading="lazy" style={{ objectPosition: position }} /> : null}
    <div className={`cms-background-video-overlay cms-overlay-${overlay}`} />
    <iframe src={getWebsiteVideoBackgroundEmbedUrl(video)} title="Achtergrondvideo" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" />
  </div>;
}

function CmsBlockView({ block }: { block: CmsBlock }) {
  if (block.blockType === "hero") {
    const content = block.content as HeroContent;
    return <section className={`development-hero cms-background-video-host ${tokenClass(content.styles)}`}><CmsBackgroundVideo content={content} /><div className="development-grid" aria-hidden="true" /><div className="development-monogram" aria-hidden="true">MV</div><div className="development-container development-hero-content"><div className="development-copy">{content.eyebrow ? <p className="eyebrow">{content.eyebrow}</p> : <p className="eyebrow">Meer Vereniging</p>}<h1 className={`cms-hero-heading-${content.styles?.headingSize ?? 'normal'}`}>{string(content.title) ?? "Meer Vereniging"}</h1>{string(content.subtitle) ? <h2>{content.subtitle}</h2> : null}<CmsRichText html={content.bodyHtml} className={`cms-hero-body-${content.styles?.bodySize ?? 'normal'}`} />{string(content.ctaLabel) ? <div className="development-actions"><Link className="btn btn-primary" href={safeHref(content.ctaDestination)}>{content.ctaLabel}</Link></div> : null}</div><div className="development-stage"><CmsImage image={{ mediaPath: content.imageMediaPath ?? content.mediaPath, altText: content.imageAltText, decorative: content.imageDecorative, focus: content.imageFocus }} /><div className="development-orb" aria-hidden="true" /><div className="development-plinth" aria-hidden="true"><span>MEER VERENIGING</span></div><div className="development-mark" aria-hidden="true" /><div className="development-lines" aria-hidden="true" /></div></div></section>;
  }

  if (block.blockType === "text") {
    const content = block.content as TextContent;
    return <section className={`section ${tokenClass(content.styles)}`}><div className="container"><div className={`cms-copy cms-columns-${content.columns ?? 1}`}>{string(content.heading) ? <h2>{content.heading}</h2> : null}<CmsRichText html={content.bodyHtml} />{!content.bodyHtml ? (content.paragraphs ?? []).filter((paragraph): paragraph is string => typeof paragraph === "string").map((paragraph, index) => <p className="lede" key={index}>{paragraph}</p>) : null}<CmsImage image={{ mediaPath: content.imageMediaPath ?? content.mediaPath, altText: content.imageAltText, decorative: content.imageDecorative }} /></div></div></section>;
  }

  if (block.blockType === "card_grid") {
    const content = block.content as CardGridContent;
    if (content.presentation === "microdemo") return content.explorer ? <CmsProductExplorer heading={content.heading} items={(content.cards ?? []) as readonly CmsMicrodemoItem[]} /> : <CmsMicrodemo heading={content.heading} items={(content.cards ?? []) as readonly CmsMicrodemoItem[]} />;
    return <section className={`development-principles ${tokenClass(content.styles)}`}><div className="development-container">{string(content.heading) ? <h2 className="cms-card-heading">{content.heading}</h2> : null}<div className={`development-principle-grid cms-card-grid-columns-${content.columns ?? 3}`}>{(content.cards ?? []).filter((card) => card.visible !== false).map((card, index) => <article className="development-principle" key={card.id ?? `${card.title ?? "card"}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{string(card.title) ?? "Meer Vereniging"}</h2><CmsRichText html={card.bodyHtml} />{!card.bodyHtml && (string(card.description) || string(card.text)) ? <p>{string(card.description) ?? string(card.text)}</p> : null}<CmsImage image={{ mediaPath: card.imageMediaPath, altText: card.imageAltText, decorative: card.imageDecorative }} />{card.link?.destinationUrl ? <Link className="text-link" href={safeHref(card.link.destinationUrl)}>{card.link.label ?? "Meer informatie"}</Link> : null}</div></article>)}</div></div></section>;
  }

  if (block.blockType === "faq") {
    const content = block.content as FaqContent;
    return <section className={`section ${tokenClass(content.styles)}`}><div className="container"><div className="faq">{content.heading ? <h2>{content.heading}</h2> : null}{(content.items ?? []).filter((item) => item.visible !== false).map((item, index) => <details key={item.id ?? index}><summary>{item.question}</summary><CmsRichText html={item.answerHtml} />{!item.answerHtml && item.answer ? <p>{item.answer}</p> : null}</details>)}</div></div></section>;
  }

  if (block.blockType === "cta") {
    const content = block.content as CtaContent;
    const href = content.destinationType === "contact" ? "/contact" : safeHref(content.destinationUrl);
    return <section className={`section cms-background-video-host ${tokenClass(content.styles)}`}><CmsBackgroundVideo content={content} /><div className="container"><div className="cta-band"><div><p className="eyebrow">Meer Vereniging</p><h2>{string(content.heading) ?? string(content.label) ?? "Meer weten?"}</h2><CmsRichText html={content.bodyHtml} /></div><Link className={`btn btn-${content.style ?? 'primary'}`} href={href}>{string(content.label) ?? "Meer weten?"}</Link></div></div></section>;
  }

  if (block.blockType === "video") {
    const content = normalizeWebsiteVideo(block.content) as WebsiteVideoContent | null;
    if (!content) return null;
    const ratioClass = content.aspectRatio === "4:3" ? "cms-video-ratio-4-3" : content.aspectRatio === "9:16" ? "cms-video-ratio-9-16" : "cms-video-ratio-16-9";
    return <section className="section"><div className={`container cms-video cms-video-width-${content.width ?? "normal"} cms-video-align-${content.alignment ?? "center"}`}><div className={`cms-video-frame ${ratioClass}`}><iframe src={getWebsiteVideoEmbedUrl(content)} title={content.title ?? "Video"} loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen /></div>{content.title ? <h2>{content.title}</h2> : null}{content.description ? <p>{content.description}</p> : null}</div></section>;
  }

  // Unknown/future block types are intentionally ignored rather than being
  // rendered as arbitrary HTML. The CMS remains the validation boundary.
  return null;
}

/** Uses the exact public shell and design system, with published CMS data. */
export function CmsPublicPageView({ page }: { page: CmsPublicPage }) {
  // The creative treatment is opt-in through its actual CMS block. This keeps
  // the currently published Home snapshot isolated until a content admin has
  // saved and page-scoped-published a homepage_creative draft.
  const isCreativeHome = page.blocks.some((block) => block.blockType === "homepage_creative");
  const homepageBlock = page.blocks.find((block) => block.blockType === "homepage_creative");
  const explorerBlock = page.blocks.find((block) => {
    const content = block.content as CardGridContent;
    return block.blockType === "card_grid" && content.presentation === "microdemo" && content.explorer === true;
  });
  const explorerHighlights = explorerBlock ? page.blocks.filter((block) => {
    const content = block.content as CardGridContent;
    return block.blockType === "card_grid" && content.presentation !== "microdemo" && content.heading === "Uitgelicht";
  }) : [];
  const highlightCards = explorerHighlights.flatMap((block) => ((block.content as CardGridContent).cards ?? [])) as readonly CmsProductExplorerHighlight[];
  return <PublicShell>{isCreativeHome ? <HomepageCreative content={homepageBlock ? normalizeHomepageContent(homepageBlock.content) : undefined} /> : page.blocks.map((block) => {
    if (block === explorerBlock) {
      const content = block.content as CardGridContent;
      return <CmsProductExplorer heading={content.heading} items={(content.cards ?? []) as readonly CmsMicrodemoItem[]} highlights={highlightCards} key={`${block.blockType}-${block.sortOrder}`} />;
    }
    if (explorerHighlights.includes(block)) return null;
    return <CmsBlockView block={block} key={`${block.blockType}-${block.sortOrder}`} />;
  })}</PublicShell>;
}
