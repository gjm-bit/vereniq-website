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
  social: Readonly<{ facebook: string | null; instagram: string | null; youtube: string | null; linkedin: string | null; whatsapp: string | null }>;
}>;

type OrganizationFooterWire = Readonly<{
  organization_name: string;
  street: string | null; house_number: string | null; house_number_addition: string | null;
  postal_code: string | null; city: string | null;
  contact_email: string | null; contact_phone: string | null;
  kvk_number: string | null; btw_number: string | null;
  logo_path: string | null;
  facebook_url: string | null; instagram_url: string | null; linkedin_url: string | null; youtube_url: string | null; whatsapp_url: string | null;
}>;

/** Alleen het logo staat achter een nauw geschraapt anon-leesbeleid (organization_branding_read_public_logo) - vraagt hier telkens een verse signed URL op, geen publieke bucket. */
async function getPublicLogoUrl(path: string): Promise<string | null> {
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
 * de logo-signing tijdelijk niet lukt, valt de footer terug op de bestaande
 * hardcoded merkweergave in plaats van élke pagina te breken.
 */
export async function getOrganizationFooterData(): Promise<OrganizationFooterData | null> {
  try {
    const rows = await callPublicRpc<readonly OrganizationFooterWire[]>("website_public_organization_footer", {
      org_slug: CMS_ORGANIZATION_SLUG,
    });
    const row = rows?.[0];
    if (!row) return null;
    const logoUrl = row.logo_path ? await getPublicLogoUrl(row.logo_path) : null;
    return {
      organizationName: row.organization_name,
      street: row.street, houseNumber: row.house_number, houseNumberAddition: row.house_number_addition,
      postalCode: row.postal_code, city: row.city,
      contactEmail: row.contact_email, contactPhone: row.contact_phone,
      kvkNumber: row.kvk_number, btwNumber: row.btw_number,
      logoUrl,
      social: { facebook: row.facebook_url, instagram: row.instagram_url, youtube: row.youtube_url, linkedin: row.linkedin_url, whatsapp: row.whatsapp_url },
    };
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
