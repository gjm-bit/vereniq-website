/**
 * Public CMS read adapter.
 *
 * The public website may only use the two narrow anonymous RPCs.  It never
 * receives a service key and it never reads editable Websitebeheer tables.
 * `cache: 'no-store'` is deliberate: publishing content must not require a
 * Vercel deployment or wait for a static build to expire.
 */
export type CmsBlock = Readonly<{
  blockType: string;
  content: Record<string, unknown>;
  sortOrder: number;
}>;

export type CmsPublicPage = Readonly<{
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  noindex: boolean;
  publishedAt: string;
  blocks: readonly CmsBlock[];
}>;

const CMS_ORGANIZATION_SLUG = process.env.NEXT_PUBLIC_CMS_ORGANIZATION_SLUG ?? "meer-vereniging-platform";

function getPublicConfig(): Readonly<{ url: string; key: string }> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

async function callPublicRpc<T>(name: string, body: Record<string, unknown>): Promise<T | null> {
  const config = getPublicConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      authorization: `Bearer ${config.key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Public CMS RPC ${name} returned ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

type PublicPageWire = Readonly<{
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  noindex: boolean;
  published_at: string;
  snapshot: Readonly<{ blocks?: readonly CmsBlock[] }>;
}>;

type PreviewPageWire = Readonly<{
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  noindex: boolean;
  expires_at: string;
  snapshot: Readonly<{ blocks?: readonly CmsBlock[] }>;
}>;

/**
 * Returns only an immutable, published page snapshot. Faalt nooit hard: elke
 * publieke route die dit aanroept behandelt `null` al als "geen live
 * CMS-override, val terug op de hardcoded standaardpagina" - diezelfde val
 * moet ook gelden als de RPC zelf (tijdelijk) niet lukt, anders breekt een
 * CMS-storing de hele publieke website in plaats van alleen de CMS-override
 * te missen. Zelfde patroon als getOrganizationFooterData hieronder.
 */
export async function getPublishedCmsPage(path: string): Promise<CmsPublicPage | null> {
  const pagePath = path === "/" ? null : path;
  try {
    const rows = await callPublicRpc<readonly PublicPageWire[]>("website_public_page", {
      org_slug: CMS_ORGANIZATION_SLUG,
      page_path: pagePath,
    });
    const row = rows?.[0];
    if (!row) return null;

    return {
      title: row.title,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      noindex: row.noindex,
      publishedAt: row.published_at,
      blocks: [...(row.snapshot.blocks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    };
  } catch {
    return null;
  }
}

export type OrganizationFooterData = Readonly<{
  organizationName: string;
  street: string | null;
  houseNumber: string | null;
  houseNumberAddition: string | null;
  postalCode: string | null;
  city: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  kvkNumber: string | null;
  btwNumber: string | null;
  logoUrl: string | null;
  /** Headertekst onder de organisatienaam (bijv. een slogan) - null = geen eigen tekst ingesteld, aanroeper valt terug op de bestaande hardcoded tekst. */
  slogan: string | null;
  /** Korte publieke omschrijving, getoond in de footer - null = geen eigen tekst ingesteld, aanroeper valt terug op de bestaande hardcoded tekst. */
  publicDescription: string | null;
  social: Readonly<{ facebook: string | null; instagram: string | null; youtube: string | null; linkedin: string | null }>;
}>;

type OrganizationFooterWire = Readonly<{
  organization_name: string;
  street: string | null; house_number: string | null; house_number_addition: string | null;
  postal_code: string | null; city: string | null;
  contact_email: string | null; contact_phone: string | null;
  kvk_number: string | null; btw_number: string | null;
  logo_path: string | null; favicon_path: string | null; slogan: string | null; public_description: string | null;
  facebook_url: string | null; instagram_url: string | null; linkedin_url: string | null; youtube_url: string | null;
}>;

/** Logo/favicon staan achter een nauw geschraapt anon-leesbeleid (organization_branding_read_public_assets) - vraagt hier telkens een verse signed URL op, geen publieke bucket. Werkt voor elk pad in die bucket, niet alleen logo's - vandaar de generieke naam. */
async function getSignedOrganizationBrandingAssetUrl(path: string): Promise<string | null> {
  const config = getPublicConfig();
  if (!config) return null;
  try {
    const response = await fetch(`${config.url}/storage/v1/object/sign/organization-branding/${path}`, {
      method: "POST",
      headers: { apikey: config.key, authorization: `Bearer ${config.key}`, "content-type": "application/json" },
      body: JSON.stringify({ expiresIn: 3600 }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { signedURL?: string };
    return data.signedURL ? `${config.url}/storage/v1${data.signedURL}` : null;
  } catch {
    return null;
  }
}

/**
 * Footer-/organisatiegegevens zijn direct-live (geen draft/publish-laag,
 * zie website_public_organization_footer). Faalt nooit hard: als de RPC of
 * de asset-signing tijdelijk niet lukt, valt de aanroeper terug op de
 * bestaande hardcoded merkweergave in plaats van élke pagina te breken.
 * Zowel Header() als Footer() gebruiken deze ene functie - één gedeelde
 * bron voor organisatienaam/logo/slogan/omschrijving, geen dubbele opslag.
 */
export async function getOrganizationFooterData(): Promise<OrganizationFooterData | null> {
  try {
    const rows = await callPublicRpc<readonly OrganizationFooterWire[]>("website_public_organization_footer", {
      org_slug: CMS_ORGANIZATION_SLUG,
    });
    const row = rows?.[0];
    if (!row) return null;
    const logoUrl = row.logo_path ? await getSignedOrganizationBrandingAssetUrl(row.logo_path) : null;
    return {
      organizationName: row.organization_name,
      street: row.street, houseNumber: row.house_number, houseNumberAddition: row.house_number_addition,
      postalCode: row.postal_code, city: row.city,
      contactEmail: row.contact_email, contactPhone: row.contact_phone,
      kvkNumber: row.kvk_number, btwNumber: row.btw_number,
      logoUrl,
      slogan: row.slogan && row.slogan.trim() ? row.slogan : null,
      publicDescription: row.public_description && row.public_description.trim() ? row.public_description : null,
      social: { facebook: row.facebook_url, instagram: row.instagram_url, youtube: row.youtube_url, linkedin: row.linkedin_url },
    };
  } catch {
    return null;
  }
}

/**
 * Publieke favicon-URL voor de dynamische icoonroute (app/icon/route.ts).
 * Aparte, lichte aanroep i.p.v. de volledige footerdata: de icoonroute
 * heeft alleen favicon_path nodig, niet adres/contact/social. Faalt nooit
 * hard - null betekent "geen eigen icoon (of RPC nog niet beschikbaar),
 * val terug op het bestaande statische standaardicoon".
 */
export async function getWebsiteFaviconUrl(): Promise<string | null> {
  try {
    const rows = await callPublicRpc<readonly Pick<OrganizationFooterWire, "favicon_path">[]>("website_public_organization_footer", {
      org_slug: CMS_ORGANIZATION_SLUG,
    });
    const path = rows?.[0]?.favicon_path;
    if (!path) return null;
    return await getSignedOrganizationBrandingAssetUrl(path);
  } catch {
    return null;
  }
}

export type WebsiteSocialLink = Readonly<{
  platformKey: string;
  label: string;
  url: string;
  iconUrl: string | null;
  sortOrder: number;
}>;

type WebsiteSocialLinkWire = Readonly<{
  platform_key: string; label: string; url: string; icon_path: string | null; sort_order: number;
}>;

/** website-social-icons is een publieke bucket (geen signed URL nodig, in tegenstelling tot het logo hierboven - een platformicoontje is per definitie bedoeld om publiek zichtbaar te zijn). */
function websiteSocialIconPublicUrl(iconPath: string): string | null {
  const config = getPublicConfig();
  if (!config) return null;
  return `${config.url}/storage/v1/object/public/website-social-icons/${iconPath}`;
}

/**
 * Generiek socialmediakanalen-model (website_social_links /
 * website_public_social_links, migratie 20260901030000 - lokaal
 * voorbereid, nog niet remote toegepast). Geeft `null` terug zolang de RPC
 * niet bestaat (of om elke andere reden faalt) - dezelfde
 * "faalt nooit hard"-conventie als hierboven. De aanroeper behandelt `null`
 * expliciet anders dan een lege array: `null` betekent "nieuw model nog
 * niet beschikbaar, val terug op getOrganizationFooterData().social"; een
 * lege array betekent "wél beschikbaar, deze organisatie heeft simpelweg
 * (nog) geen zichtbare kanalen" en moet dus ook niets tonen, niet
 * terugvallen. Zelfde reden waarom dit geen aparte deploy vereist zodra de
 * migratie wél wordt toegepast: dezelfde, ongewijzigde code schakelt dan
 * vanzelf over.
 */
export async function getWebsiteSocialLinks(): Promise<readonly WebsiteSocialLink[] | null> {
  try {
    const rows = await callPublicRpc<readonly WebsiteSocialLinkWire[]>("website_public_social_links", {
      org_slug: CMS_ORGANIZATION_SLUG,
    });
    if (!rows) return null;
    return [...rows]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({
        platformKey: row.platform_key,
        label: row.label,
        url: row.url,
        iconUrl: row.icon_path ? websiteSocialIconPublicUrl(row.icon_path) : null,
        sortOrder: row.sort_order,
      }));
  } catch {
    return null;
  }
}

export type WebsiteHeaderActionVariant = "primary" | "secondary";

export type WebsiteHeaderAction = Readonly<{
  actionKey: string;
  label: string;
  url: string;
  variant: WebsiteHeaderActionVariant;
  sortOrder: number;
}>;

type WebsiteHeaderActionWire = Readonly<{
  action_key: string; label: string; url: string; variant: string; sort_order: number;
}>;

/**
 * Generiek header-acties-model (website_header_actions /
 * website_public_header_actions, migratie 20260901030000 - beheerbaar via
 * Website → Instellingen). Vervangt de voorheen hardcoded "Inloggen"/
 * "Probeer gratis"-knoppen. Zelfde "faalt nooit hard, null = val terug op
 * de hardcoded knoppen, lege array = wél beschikbaar maar bewust niets
 * zichtbaars"-conventie als getWebsiteSocialLinks hierboven - de aanroeper
 * (site-shell.tsx) gebruikt dezelfde resolved-actions-lijst voor zowel de
 * desktop-header als het mobiele menu, zodat beide altijd consistent zijn
 * met wat de beheerder heeft ingesteld.
 */
export async function getWebsitePublicHeaderActions(): Promise<readonly WebsiteHeaderAction[] | null> {
  try {
    const rows = await callPublicRpc<readonly WebsiteHeaderActionWire[]>("website_public_header_actions", {
      org_slug: CMS_ORGANIZATION_SLUG,
    });
    if (!rows) return null;
    return [...rows]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({
        actionKey: row.action_key,
        label: row.label,
        url: row.url,
        variant: row.variant === "primary" ? "primary" : "secondary",
        sortOrder: row.sort_order,
      }));
  } catch {
    return null;
  }
}

/** Resolves an opaque, short-lived preview capability; never used for public routes. */
export async function getCmsPreviewPage(token: string): Promise<CmsPublicPage | null> {
  const rows = await callPublicRpc<readonly PreviewPageWire[]>("website_preview_page", { preview_token: token });
  const row = rows?.[0];
  if (!row) return null;
  return {
    title: row.title,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    noindex: true,
    publishedAt: row.expires_at,
    blocks: [...(row.snapshot.blocks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
