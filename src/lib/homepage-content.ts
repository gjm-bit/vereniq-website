/**
 * CMS-owned content contract for the creative homepage.
 *
 * Components own presentation; this module only describes content and safe
 * media presentation choices. The legacy defaults are intentionally a
 * backward-compatible fallback for installations that have not seeded a
 * `homepage_creative` CMS block yet.
 */

export type HomepageMediaFit = "cover" | "contain";
export type HomepageMediaPresentation = "browser" | "phone" | "floating" | "full-bleed" | "plain";
export type HomepageFocus =
  | "left-top" | "center-top" | "right-top"
  | "left-center" | "center" | "right-center"
  | "left-bottom" | "center-bottom" | "right-bottom";

const focusValues: readonly HomepageFocus[] = ["left-top", "center-top", "right-top", "left-center", "center", "right-center", "left-bottom", "center-bottom", "right-bottom"];
const presentationValues: readonly HomepageMediaPresentation[] = ["browser", "phone", "floating", "full-bleed", "plain"];

export type HomepageMedia = Readonly<{
  mediaId?: string;
  mediaPath?: string;
  mobileMediaId?: string;
  mobileMediaPath?: string;
  altText: string;
  decorative?: boolean;
  focus?: HomepageFocus;
  fit?: HomepageMediaFit;
  zoom?: number;
  presentation?: HomepageMediaPresentation;
  /** Alias used by the JSONB contract; renderer maps it to a safe preset. */
  layoutVariant?: HomepageMediaPresentation;
}>;

export type HomepageProblemItem = Readonly<{
  id: string;
  eyebrow?: string;
  title: string;
  body: string;
  visible: boolean;
  sortOrder: number;
  media: HomepageMedia;
}>;

export type HomepageProductItem = Readonly<{
  id: string;
  label: string;
  heading: string;
  body: string;
  visible: boolean;
  sortOrder: number;
  media: HomepageMedia;
  /** Flattened aliases keep the CMS row contract friendly to existing editors. */
  mediaId?: string;
  mobileMediaId?: string;
  altText?: string;
  layoutVariant?: HomepageMediaPresentation;
}>;

export type HomepageContent = Readonly<{
  hero: Readonly<{
    eyebrow: string;
    title: string;
    accentTitle: string;
    body: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    mainMedia: HomepageMedia;
    mobileMedia?: HomepageMedia;
  }>;
  problemEyebrow: string;
  problemTitle: string;
  problems: readonly HomepageProblemItem[];
  productShowcase: Readonly<{
    eyebrow: string;
    title: string;
    body: string;
    items: readonly HomepageProductItem[];
    callout: Readonly<{ label: string; body: string; href: string; media: HomepageMedia }>;
  }>;
  account: Readonly<{ eyebrow: string; title: string; accentTitle: string; body: string; media: HomepageMedia }>;
  smartWork: Readonly<{
    eyebrow: string;
    title: string;
    items: readonly HomepageProductItem[];
  }>;
  commerce: Readonly<{
    eyebrow: string;
    title: string;
    accentTitle: string;
    audiences: readonly Readonly<{ label: string; href: string }>[];
    priceEyebrow: string;
    priceTitle: string;
    priceBody: string;
    priceCtaLabel: string;
    priceCtaHref: string;
  }>;
  story: Readonly<{
    eyebrow: string;
    title: string;
    body: string;
    href: string;
    hrefLabel: string;
    ctaEyebrow: string;
    ctaTitle: string;
    ctaAccentTitle: string;
    ctaLabel: string;
    ctaHref: string;
  }>;
}>;

const media = (altText: string, presentation: HomepageMediaPresentation = "plain"): HomepageMedia => ({
  altText,
  presentation,
  layoutVariant: presentation,
  focus: "center",
  fit: "cover",
});

const product = (id: string, label: string, heading: string, body: string, mediaRef: HomepageMedia): HomepageProductItem => ({
  id,
  label,
  heading,
  body,
  visible: true,
  sortOrder: 0,
  media: mediaRef,
});

/** Safe fallback used only when an installation has no homepage CMS block yet. */
export const defaultHomepageContent: HomepageContent = {
  hero: {
    eyebrow: "Meer Vereniging",
    title: "Minder regelen.",
    accentTitle: "Meer verenigen.",
    body: "Alles wat je vereniging nodig heeft, op één plek.",
    primaryCtaLabel: "Vraag een demo aan",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Bekijk hoe het werkt",
    secondaryCtaHref: "/platform",
    mainMedia: media("Meer Vereniging Home met open acties en snelle modules", "browser"),
    mobileMedia: media("Meer Vereniging Home met agenda, prikbord, meldingen en leden", "phone"),
  },
  problemEyebrow: "Herkenbaar?",
  problemTitle: "Het verenigingsleven is al druk genoeg.",
  problems: [
    { id: "board", eyebrow: "Herkenbaar?", title: "Welke ledenlijst is eigenlijk de laatste?", body: "Overal staat iets anders.", visible: true, sortOrder: 0, media: media("Bestuur werkt samen aan ledenadministratie", "full-bleed") },
    { id: "team", eyebrow: "Herkenbaar?", title: "Hoe laat moesten we volgende week?", body: "Iedereen zoekt het.", visible: true, sortOrder: 1, media: media("Sportteam overlegt over de volgende afspraak", "full-bleed") },
    { id: "list", eyebrow: "Herkenbaar?", title: "Wie had er eigenlijk nog wat?", body: "Lijstje nat, cijfers half weg.", visible: true, sortOrder: 2, media: media("Handgeschreven dranklijst op tafel", "full-bleed") },
  ],
  productShowcase: {
    eyebrow: "Alles op één plek",
    title: "Eén omgeving voor wat samenkomt.",
    body: "Kies een onderdeel en zie waar het in het geheel past.",
    items: [
      product("agenda", "Agenda", "Van afspraak tot uitvoering.", "Verzamel momenten, aanwezigheid en praktische afspraken op één plek.", media("Agenda in de verenigingsapp met activiteiten, tijden en reacties", "browser")),
      product("members", "Leden", "Een actueel ledenbeeld.", "Werk vanuit één rustig overzicht voor bestuur, commissies en leden.", media("Ledenadministratie met leden en aanwezigheid", "browser")),
      product("beheer", "Beheer", "Iedereen ziet wat nodig is.", "Rollen en rechten brengen informatie naar de juiste mensen.", media("Beheercentrum met accounts, uitnodigingen en rollen", "browser")),
    ],
    callout: { label: "Drankhaler", body: "Van turflijstje naar direct overzicht.", href: "/modules", media: media("Drankhaler-overzicht met consumpties per product", "plain") },
  },
  account: {
    eyebrow: "Eén account",
    title: "Al je verenigingen",
    accentTitle: "in één omgeving.",
    body: "Lid bij de één. Bestuurder bij de ander. Wissel zonder opnieuw in te loggen.",
    media: media("Organisatie-wisselaar met meerdere verenigingen en een actieve keuze", "browser"),
  },
  smartWork: {
    eyebrow: "Slimmer werken",
    title: "Meer rust in de dingen eromheen.",
    items: [
      product("automation", "Automatiseren", "Dingen waar je niet meer aan hoeft te denken.", "Verjaardagen, meldingen en wijzigingen blijven bij de juiste mensen in beeld.", media("Persoonlijk actiecentrum met open verenigingsacties", "browser")),
      product("fortissimo", "Fortissimo", "Vraag het gewoon.", "Vind wat al binnen je vereniging beschikbaar is.", media("Fortissimo-assistent met verenigingscontext en een vraagkaart", "browser")),
    ],
  },
  commerce: {
    eyebrow: "Voor wie",
    title: "Elke vereniging",
    accentTitle: "een eigen ritme.",
    audiences: [
      { label: "Muziek", href: "/voor-wie/muziekverenigingen" },
      { label: "Sport", href: "/voor-wie/sportverenigingen" },
      { label: "Carnaval", href: "/voor-wie/carnavalverenigingen" },
      { label: "Stichtingen", href: "/voor-wie/stichtingen" },
      { label: "Andere verenigingen", href: "/voor-wie" },
    ],
    priceEyebrow: "Prijsstelling",
    priceTitle: "Alles erop. Geen modulepuzzel.",
    priceBody: "De definitieve prijsstelling wordt nog afgerond. We publiceren bedragen zodra ze helder en controleerbaar zijn.",
    priceCtaLabel: "Houd me op de hoogte",
    priceCtaHref: "/contact",
  },
  story: {
    eyebrow: "Gebouwd vanuit het verenigingsleven",
    title: "Niet vanuit een vergaderkamer.",
    body: "Meer Vereniging komt voort uit de dagelijkse praktijk van besturen, commissies en vrijwilligers.",
    href: "/over-ons",
    hrefLabel: "Lees ons verhaal",
    ctaEyebrow: "Klaar met overal achteraan zitten?",
    ctaTitle: "Minder regelen.",
    ctaAccentTitle: "Meer verenigen.",
    ctaLabel: "Vraag een demo aan",
    ctaHref: "/contact",
  },
};

/** Initial library entries are references to the seeded CMS media, not renderer dependencies. */
export const defaultHomepageMediaLibrary = [
  ["Dashboard", defaultHomepageContent.hero.mainMedia.mediaPath ?? ""],
  ["Mobiele app", defaultHomepageContent.hero.mobileMedia?.mediaPath ?? ""],
  ["Agenda", defaultHomepageContent.productShowcase.items[0]?.media.mediaPath ?? ""],
  ["Leden", defaultHomepageContent.productShowcase.items[1]?.media.mediaPath ?? ""],
  ["Beheer", defaultHomepageContent.productShowcase.items[2]?.media.mediaPath ?? ""],
  ["Organisaties", defaultHomepageContent.account.media.mediaPath ?? ""],
  ["Communicatie", defaultHomepageContent.smartWork.items[0]?.media.mediaPath ?? ""],
  ["Fortissimo", defaultHomepageContent.smartWork.items[1]?.media.mediaPath ?? ""],
  ["Drankhaler", defaultHomepageContent.productShowcase.callout.media.mediaPath ?? ""],
] as const;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function boolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function number(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeMedia(value: unknown, fallback: HomepageMedia): HomepageMedia {
  const input = record(value);
  const path = text(input.mediaPath ?? input.media_path, fallback.mediaPath ?? "");
  const mobilePath = text(input.mobileMediaPath ?? input.mobile_media_path, fallback.mobileMediaPath ?? "");
  const fit = input.fit === "contain" ? "contain" : input.fit === "cover" ? "cover" : fallback.fit;
  const focus = typeof input.focus === "string" && focusValues.includes(input.focus as HomepageFocus) ? input.focus as HomepageFocus : fallback.focus;
  const candidatePresentation = input.presentation ?? input.layoutVariant;
  const presentation = typeof candidatePresentation === "string" && presentationValues.includes(candidatePresentation as HomepageMediaPresentation) ? candidatePresentation as HomepageMediaPresentation : fallback.presentation;
  return {
    ...fallback,
    ...(path ? { mediaPath: path } : {}),
    ...(mobilePath ? { mobileMediaPath: mobilePath } : {}),
    ...(typeof (input.mediaId ?? input.media_id) === "string" ? { mediaId: (input.mediaId ?? input.media_id) as string } : {}),
    ...(typeof (input.mobileMediaId ?? input.mobile_media_id) === "string" ? { mobileMediaId: (input.mobileMediaId ?? input.mobile_media_id) as string } : {}),
    altText: text(input.altText ?? input.alt_text, fallback.altText),
    decorative: boolean(input.decorative, fallback.decorative ?? false),
    fit,
    focus,
    presentation,
    layoutVariant: presentation,
    zoom: Math.min(120, Math.max(80, number(input.zoom, fallback.zoom ?? 100))),
  };
}

function normalizeItems(value: unknown, fallbacks: readonly HomepageProductItem[]): HomepageProductItem[] {
  if (!Array.isArray(value)) return [...fallbacks];
  return value.map((item, index) => {
    const input = record(item);
    const fallback = fallbacks[index] ?? fallbacks[0];
    const normalizedMedia = normalizeMedia(input.media ?? input, fallback.media);
    return {
      ...fallback,
      id: text(input.id, fallback.id),
      label: text(input.label, fallback.label),
      heading: text(input.heading, fallback.heading),
      body: text(input.body, fallback.body),
      visible: boolean(input.visible, fallback.visible),
      sortOrder: number(input.sortOrder ?? input.sort_order, index),
      media: normalizedMedia,
      mediaId: normalizedMedia.mediaId,
      mobileMediaId: normalizedMedia.mobileMediaId,
      altText: normalizedMedia.altText,
      layoutVariant: normalizedMedia.presentation,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Normalizes JSONB from the CMS without allowing malformed content to break the renderer. */
export function normalizeHomepageContent(value: unknown): HomepageContent {
  const input = record(value);
  const hero = record(input.hero);
  const showcase = record(input.productShowcase ?? input.product_showcase);
  const account = record(input.account);
  const smart = record(input.smartWork ?? input.smart_work);
  const commerce = record(input.commerce);
  const story = record(input.story);
  const fallback = defaultHomepageContent;
  const problems = Array.isArray(input.problems) ? input.problems.map((item, index) => {
    const current = record(item);
    const base = fallback.problems[index] ?? fallback.problems[0];
    return { ...base, id: text(current.id, base.id), eyebrow: text(current.eyebrow, base.eyebrow ?? "Herkenbaar?"), title: text(current.title, base.title), body: text(current.body, base.body), visible: boolean(current.visible, base.visible), sortOrder: number(current.sortOrder ?? current.sort_order, index), media: normalizeMedia(current.media ?? current, base.media) };
  }).sort((a, b) => a.sortOrder - b.sortOrder) : [...fallback.problems];
  const callout = record(showcase.callout);
  const audiences = Array.isArray(commerce.audiences) ? commerce.audiences.map((item, index) => { const current = record(item); const base = fallback.commerce.audiences[index] ?? fallback.commerce.audiences[0]; return { label: text(current.label, base.label), href: text(current.href, base.href) }; }) : [...fallback.commerce.audiences];
  return {
    hero: {
      ...fallback.hero,
      eyebrow: text(hero.eyebrow, fallback.hero.eyebrow), title: text(hero.title, fallback.hero.title), accentTitle: text(hero.accentTitle ?? hero.accent_title, fallback.hero.accentTitle), body: text(hero.body, fallback.hero.body), primaryCtaLabel: text(hero.primaryCtaLabel ?? hero.primary_cta_label, fallback.hero.primaryCtaLabel), primaryCtaHref: text(hero.primaryCtaHref ?? hero.primary_cta_href, fallback.hero.primaryCtaHref), secondaryCtaLabel: text(hero.secondaryCtaLabel ?? hero.secondary_cta_label, fallback.hero.secondaryCtaLabel), secondaryCtaHref: text(hero.secondaryCtaHref ?? hero.secondary_cta_href, fallback.hero.secondaryCtaHref),
      mainMedia: normalizeMedia(hero.mainMedia ?? hero.main_media, fallback.hero.mainMedia), mobileMedia: normalizeMedia(hero.mobileMedia ?? hero.mobile_media, fallback.hero.mobileMedia ?? fallback.hero.mainMedia),
    },
    problemEyebrow: text(input.problemEyebrow ?? input.problem_eyebrow, fallback.problemEyebrow),
    problemTitle: text(input.problemTitle ?? input.problem_title, fallback.problemTitle),
    problems,
    productShowcase: {
      ...fallback.productShowcase,
      eyebrow: text(showcase.eyebrow, fallback.productShowcase.eyebrow), title: text(showcase.title, fallback.productShowcase.title), body: text(showcase.body, fallback.productShowcase.body), items: normalizeItems(showcase.items, fallback.productShowcase.items),
      callout: { ...fallback.productShowcase.callout, label: text(callout.label, fallback.productShowcase.callout.label), body: text(callout.body, fallback.productShowcase.callout.body), href: text(callout.href, fallback.productShowcase.callout.href), media: normalizeMedia(callout.media ?? callout, fallback.productShowcase.callout.media) },
    },
    account: { ...fallback.account, eyebrow: text(account.eyebrow, fallback.account.eyebrow), title: text(account.title, fallback.account.title), accentTitle: text(account.accentTitle ?? account.accent_title, fallback.account.accentTitle), body: text(account.body, fallback.account.body), media: normalizeMedia(account.media, fallback.account.media) },
    smartWork: { ...fallback.smartWork, eyebrow: text(smart.eyebrow, fallback.smartWork.eyebrow), title: text(smart.title, fallback.smartWork.title), items: normalizeItems(smart.items, fallback.smartWork.items) },
    commerce: { ...fallback.commerce, eyebrow: text(commerce.eyebrow, fallback.commerce.eyebrow), title: text(commerce.title, fallback.commerce.title), accentTitle: text(commerce.accentTitle ?? commerce.accent_title, fallback.commerce.accentTitle), audiences, priceEyebrow: text(commerce.priceEyebrow ?? commerce.price_eyebrow, fallback.commerce.priceEyebrow), priceTitle: text(commerce.priceTitle ?? commerce.price_title, fallback.commerce.priceTitle), priceBody: text(commerce.priceBody ?? commerce.price_body, fallback.commerce.priceBody), priceCtaLabel: text(commerce.priceCtaLabel ?? commerce.price_cta_label, fallback.commerce.priceCtaLabel), priceCtaHref: text(commerce.priceCtaHref ?? commerce.price_cta_href, fallback.commerce.priceCtaHref) },
    story: { ...fallback.story, eyebrow: text(story.eyebrow, fallback.story.eyebrow), title: text(story.title, fallback.story.title), body: text(story.body, fallback.story.body), href: text(story.href, fallback.story.href), hrefLabel: text(story.hrefLabel ?? story.href_label, fallback.story.hrefLabel), ctaEyebrow: text(story.ctaEyebrow ?? story.cta_eyebrow, fallback.story.ctaEyebrow), ctaTitle: text(story.ctaTitle ?? story.cta_title, fallback.story.ctaTitle), ctaAccentTitle: text(story.ctaAccentTitle ?? story.cta_accent_title, fallback.story.ctaAccentTitle), ctaLabel: text(story.ctaLabel ?? story.cta_label, fallback.story.ctaLabel), ctaHref: text(story.ctaHref ?? story.cta_href, fallback.story.ctaHref) },
  };
}

export function mediaUrl(mediaRef: HomepageMedia): string | undefined {
  const path = mediaRef.mediaPath;
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path) || /^data:image\/(jpeg|png|webp|gif);base64,/i.test(path) || path.startsWith("/")) return path;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/storage/v1/object/public/website-media/${path}` : `/${path.replace(/^\//, "")}`;
}

export function mobileMediaUrl(mediaRef: HomepageMedia): string | undefined {
  return mediaRef.mobileMediaPath ? mediaUrl({ ...mediaRef, mediaPath: mediaRef.mobileMediaPath }) : undefined;
}
