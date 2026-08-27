"use client";

import { useMemo, useState } from "react";
import { SiteLink as Link } from "@/src/components/site-link";
import { defaultHomepageContent, mediaUrl, mobileMediaUrl, normalizeHomepageContent, type HomepageContent, type HomepageMedia, type HomepageProblemItem, type HomepageProductItem } from "@/src/lib/homepage-content";
import { homepageMediaStyle, resolveHomepageMediaPresentation } from "@/src/lib/homepage-media-presentation";

type SurfaceVariant = "dashboard" | "mobile" | "agenda" | "members" | "beheer" | "organization" | "automation" | "fortissimo";

function ProductVisual({ variant, label, media }: { variant: SurfaceVariant; label: string; media: HomepageMedia }) {
  const src = mediaUrl(media);
  const mobile = mobileMediaUrl(media);
  if (!src) return null;
  const presentation = resolveHomepageMediaPresentation(media);
  return <figure className={`mv-interface mv-product-visual mv-interface-${variant} ${presentation.className}`} aria-label={label} data-media-id={media.mediaId}>
    <picture>{mobile ? <source media="(max-width: 640px)" srcSet={mobile} /> : null}<img className="mv-product-visual-image" src={src} alt={media.decorative ? "" : media.altText} width={1312} height={640} loading="lazy" decoding="async" style={homepageMediaStyle(media)} /></picture>
  </figure>;
}

function Scene({ item, kind }: { item: HomepageProblemItem; kind: "board" | "team" | "list" }) {
  const src = mediaUrl(item.media);
  if (!src) return null;
  const presentation = resolveHomepageMediaPresentation(item.media);
  return <article className={`mv-scene mv-scene-${kind}`}>
    <div className={`mv-scene-art ${presentation.className}`}>
      <img className="mv-scene-cms-image" src={src} alt={item.media.decorative ? "" : item.media.altText} loading="lazy" decoding="async" style={homepageMediaStyle(item.media)} />
    </div>
    <div className="mv-scene-copy"><span className="mv-scene-rule" />{item.eyebrow ? <p className="mv-scene-eyebrow">{item.eyebrow}</p> : null}<h3>{item.title}</h3><p>{item.body}</p></div>
  </article>;
}

function SectionIntro({ id, kicker, title, body }: { id?: string; kicker: string; title: string; body?: string }) {
  return <div className="mv-section-intro"><p className="mv-kicker">{kicker}</p><div><h2 id={id}>{title}</h2>{body ? <p className="mv-section-body">{body}</p> : null}</div></div>;
}

function visibleItems(items: readonly HomepageProductItem[]): HomepageProductItem[] {
  return items.filter((item) => item.visible && Boolean(mediaUrl(item.media))).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function HomepageCreative({ content: rawContent }: { content?: HomepageContent }) {
  const content = useMemo(() => normalizeHomepageContent(rawContent ?? defaultHomepageContent), [rawContent]);
  const products = useMemo(() => visibleItems(content.productShowcase.items), [content.productShowcase.items]);
  const smartItems = useMemo(() => visibleItems(content.smartWork.items), [content.smartWork.items]);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [smartId, setSmartId] = useState(smartItems[0]?.id ?? "");
  // Content can hide or reorder tabs while this component is mounted. Derive a
  // safe visible fallback during render instead of synchronously resetting
  // state in an effect; the next click then records the selected id normally.
  const product = products.find((item) => item.id === productId) ?? products[0];
  const smart = smartItems.find((item) => item.id === smartId) ?? smartItems[0];

  return <div className="mv-homepage mv-compressed-home">
    <section className="mv-compressed-hero" aria-labelledby="mv-hero-title"><div className="mv-page-width mv-hero-grid">
      <div className="mv-hero-copy"><p className="mv-kicker">{content.hero.eyebrow}</p><h1 id="mv-hero-title"><span className="mv-hero-title-desktop">{content.hero.title}</span><span className="mv-hero-title-mobile">{content.hero.title}</span><br /><em>{content.hero.accentTitle}</em></h1><p className="mv-hero-lede">{content.hero.body}</p><div className="mv-actions"><Link className="mv-button mv-button-primary" href={content.hero.primaryCtaHref}>{content.hero.primaryCtaLabel} <span aria-hidden="true">↗</span></Link><Link className="mv-text-link" href={content.hero.secondaryCtaHref}>{content.hero.secondaryCtaLabel} <span aria-hidden="true">→</span></Link></div></div>
      <div className="mv-hero-product"><ProductVisual variant="dashboard" label="Productoverzicht van de verenigingsapp" media={content.hero.mainMedia} />{content.hero.mobileMedia ? <div className="mv-device"><ProductVisual variant="mobile" label="Compact productoverzicht" media={content.hero.mobileMedia} /></div> : null}</div>
    </div></section>

    <section className="mv-compressed-chaos" aria-labelledby="mv-chaos-title"><div className="mv-page-width"><SectionIntro id="mv-chaos-title" kicker={content.problemEyebrow} title={content.problemTitle} /><div className="mv-scenes">{content.problems.filter((item) => item.visible).map((item, index) => <Scene key={item.id} item={item} kind={index === 1 ? "team" : index === 2 ? "list" : "board"} />)}</div></div></section>
    <section className="mv-problem-solution-transition" aria-label="Van herkenning naar oplossing"><div className="mv-page-width"><p>{content.productShowcase.body}</p></div></section>

    <section className="mv-compressed-showcase" aria-labelledby="mv-showcase-title"><div className="mv-page-width"><SectionIntro id="mv-showcase-title" kicker={content.productShowcase.eyebrow} title={content.productShowcase.title} />{products.length > 0 ? <><div className="mv-tabs" role="tablist" aria-label="Platformonderdelen">{products.map((item) => <button type="button" key={item.id} role="tab" aria-selected={product?.id === item.id} aria-controls="mv-product-panel" tabIndex={product?.id === item.id ? 0 : -1} className={product?.id === item.id ? "is-active" : ""} onClick={() => setProductId(item.id)}>{item.label}</button>)}</div>{product ? <div id="mv-product-panel" className="mv-tab-panel" role="tabpanel" aria-live="polite"><div><p className="mv-kicker">{product.label}</p><h3>{product.heading}</h3><p>{product.body}</p><Link className="mv-text-link" href="/modules">Meer over {product.label} <span aria-hidden="true">→</span></Link></div><ProductVisual variant={product.id as SurfaceVariant} label={`${product.label} productvisual`} media={product.media} /></div> : null}</> : null}{mediaUrl(content.productShowcase.callout.media) ? <div className="mv-small-callout"><ProductVisual variant="automation" label={content.productShowcase.callout.label} media={content.productShowcase.callout.media} /><div><b>{content.productShowcase.callout.label}</b><span>{content.productShowcase.callout.body}</span></div><Link href={content.productShowcase.callout.href}>Bekijk modules <span aria-hidden="true">→</span></Link></div> : null}</div></section>

    <section className="mv-compressed-account" aria-labelledby="mv-account-title"><div className="mv-page-width mv-account-grid"><div><p className="mv-kicker">{content.account.eyebrow}</p><h2 id="mv-account-title">{content.account.title}<br /><em>{content.account.accentTitle}</em></h2><p className="mv-section-body">{content.account.body}</p></div><ProductVisual variant="organization" label="Organisatie-wisselaar in Meer Vereniging" media={content.account.media} /></div></section>

    <section className="mv-compressed-smart" aria-labelledby="mv-smart-title"><div className="mv-page-width"><SectionIntro id="mv-smart-title" kicker={content.smartWork.eyebrow} title={content.smartWork.title} /><div className="mv-tabs" role="tablist" aria-label="Slimmer werken">{smartItems.map((item) => <button type="button" key={item.id} role="tab" aria-selected={smart?.id === item.id} aria-controls="mv-smart-panel" tabIndex={smart?.id === item.id ? 0 : -1} className={smart?.id === item.id ? "is-active" : ""} onClick={() => setSmartId(item.id)}>{item.label}</button>)}</div>{smart ? <div id="mv-smart-panel" className="mv-tab-panel mv-tab-panel-smart" role="tabpanel" aria-live="polite"><div><p className="mv-kicker">{smart.label}</p><h3>{smart.heading}</h3><p>{smart.body}</p><Link className="mv-text-link" href={smart.id === "fortissimo" ? "/modules/fortissimo" : "/modules"}>Ontdek {smart.label} <span aria-hidden="true">→</span></Link></div><ProductVisual variant={smart.id as SurfaceVariant} label={`${smart.label} productvisual`} media={smart.media} /></div> : null}</div></section>

    <section className="mv-compressed-commerce" aria-labelledby="mv-commerce-title"><div className="mv-page-width mv-commerce-grid"><div><p className="mv-kicker">{content.commerce.eyebrow}</p><h2 id="mv-commerce-title">{content.commerce.title}<br /><em>{content.commerce.accentTitle}</em></h2><div className="mv-audience-list">{content.commerce.audiences.map((audience) => <Link href={audience.href} key={audience.href}>{audience.label}<b aria-hidden="true">↗</b></Link>)}</div></div><div className="mv-commerce-price"><p className="mv-kicker">{content.commerce.priceEyebrow}</p><h3>{content.commerce.priceTitle}</h3><p>{content.commerce.priceBody}</p><Link className="mv-button mv-button-primary" href={content.commerce.priceCtaHref}>{content.commerce.priceCtaLabel} <span aria-hidden="true">↗</span></Link></div></div></section>

    <section className="mv-compressed-story" aria-labelledby="mv-story-title"><div className="mv-page-width mv-story-grid"><div><p className="mv-kicker">{content.story.eyebrow}</p><h2 id="mv-story-title">{content.story.title}</h2><p className="mv-section-body">{content.story.body}</p><Link className="mv-text-link" href={content.story.href}>{content.story.hrefLabel} <span aria-hidden="true">→</span></Link></div><div className="mv-final-cta"><p className="mv-kicker">{content.story.ctaEyebrow}</p><h2>{content.story.ctaTitle}<br /><em>{content.story.ctaAccentTitle}</em></h2><Link className="mv-button mv-button-primary" href={content.story.ctaHref}>{content.story.ctaLabel} <span aria-hidden="true">↗</span></Link></div></div></section>
  </div>;
}
