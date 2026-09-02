import Image from "next/image"; import { SiteLink as Link } from "./site-link"; import { site } from "@/src/config/site"; import { MobileMenu } from "./mobile-menu"; import { getOrganizationFooterData, getWebsiteSocialLinks, getWebsitePublicHeaderActions, type OrganizationFooterData, type WebsiteSocialLink, type WebsiteHeaderAction } from "@/src/lib/public-cms";
export function Brand(){return <Link className="brand" href="/" aria-label="Meer Vereniging — homepage"><Image className="brand-icon" src="/brand/meer-vereniging-symbol.png" alt="" width={279} height={215} unoptimized/><span className="brand-text"><span className="brand-word">Meer Vereniging</span><span className="brand-tagline">Minder regelen. Meer verenigen.</span></span></Link>}

/**
 * De huidige, live knoppen - blijft ongewijzigd bestaan als terugvalpad
 * zolang het generieke header-acties-model (website_header_actions /
 * website_public_header_actions, migratie 20260901030000) niet remote
 * beschikbaar is. Zelfde vorm (actionKey/label/url/variant) als het
 * generieke model, zodat HeaderActions/MobileMenu altijd exact dezelfde
 * lijst renderen ongeacht welk pad actief is.
 */
const FALLBACK_HEADER_ACTIONS: readonly WebsiteHeaderAction[] = [
  { actionKey: "login", label: "Inloggen", url: "https://beheer.meervereniging.nl", variant: "secondary", sortOrder: 0 },
  { actionKey: "trial-cta", label: "Probeer gratis", url: "/proefabonnement", variant: "primary", sortOrder: 1 },
];

function HeaderActionLink({ action, className }: { action: WebsiteHeaderAction; className: string }) {
  return action.url.startsWith("/")
    ? <Link className={className} href={action.url}>{action.label}</Link>
    : <a className={className} href={action.url}>{action.label}</a>;
}

/**
 * Dynamische versie van Brand() voor de publieke header: gebruikt het
 * gedeelde website-logo (organization_branding_settings.logo_path -
 * dezelfde bron als de footer, geen dubbele opslag) en de ingestelde
 * headertekst (slogan). `footer === null` betekent "RPC nog niet
 * beschikbaar" -> exact de bestaande statische Brand-weergave; een
 * ontbrekend logo/lege slogan bij een wél beschikbare RPC valt terug op
 * diezelfde huidige standaardwaarden (geen flash/kapotte weergave).
 */
function HeaderBrand({ footer }: { footer: OrganizationFooterData | null }) {
  const name = footer?.organizationName || "Meer Vereniging";
  const tagline = footer?.slogan || "Minder regelen. Meer verenigen.";
  return <Link className="brand" href="/" aria-label={`${name} — homepage`}>
    {footer?.logoUrl
      ? <img className="brand-icon" src={footer.logoUrl} alt="" width={279} height={215} />
      : <Image className="brand-icon" src="/brand/meer-vereniging-symbol.png" alt="" width={279} height={215} unoptimized/>}
    <span className="brand-text"><span className="brand-word">{name}</span><span className="brand-tagline">{tagline}</span></span>
  </Link>;
}

export async function Header(){
  // null (RPC bestaat nog niet) -> val terug op de hardcoded knoppen resp.
  // de statische Brand-weergave; een lege actions-array is geldig
  // (beheerder heeft alles verborgen) en toont dus terecht niets - zelfde
  // "null vs. lege array"-onderscheid als getWebsiteSocialLinks hierboven.
  const [remoteActions, footer] = await Promise.all([getWebsitePublicHeaderActions(), getOrganizationFooterData()]);
  const actions = remoteActions ?? FALLBACK_HEADER_ACTIONS;
  return <div className="header-surface"><header className="container site-header"><HeaderBrand footer={footer}/><nav className="nav" aria-label="Hoofdnavigatie">{site.nav.map(([n,h])=><Link key={h} href={h}>{n}</Link>)}</nav><div className="header-actions">{actions.map((action)=><HeaderActionLink key={action.actionKey} action={action} className={action.variant==="primary"?"btn btn-primary":"btn btn-secondary"}/>)}</div></header><MobileMenu actions={actions}/></div>;
}

/**
 * Legacy Facebook/Instagram-footer - de huidige, live implementatie.
 * Meer Vereniging gebruikt voorlopig uitsluitend Facebook en Instagram in de
 * publieke footer (productbeslissing). YouTube/LinkedIn blijven bestaan in
 * OrganizationFooterData["social"] (backward compatibility met het bestaande
 * schema/de bestaande RPC) maar staan hier bewust niet in SOCIAL_ICONS, dus
 * FooterSocial rendert ze nooit, ongeacht of er ooit een waarde voor
 * ingevuld wordt. Volgorde: Facebook → Instagram.
 *
 * Blijft ongewijzigd bestaan als terugvalpad zolang het generieke
 * kanalenmodel (website_social_links / website_public_social_links,
 * migratie 20260901030000) nog niet remote is toegepast - zie
 * getWebsiteSocialLinks() in public-cms.ts en FooterSocialGeneric hieronder.
 */
export const SOCIAL_ICONS: Readonly<Record<"facebook" | "instagram", { label: string; path: string }>> = {
  facebook: { label: "Facebook", path: "M13.5 21v-7.2h2.4l.36-2.8h-2.76V9.2c0-.8.22-1.36 1.38-1.36h1.48V5.35c-.26-.03-1.13-.11-2.15-.11-2.13 0-3.58 1.3-3.58 3.68v2.05H8.28v2.8h2.35V21z" },
  instagram: { label: "Instagram", path: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zm0 1.8A2.2 2.2 0 0 0 5.8 8v8A2.2 2.2 0 0 0 8 18.2h8a2.2 2.2 0 0 0 2.2-2.2V8A2.2 2.2 0 0 0 16 5.8zm4 2.5a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4zm0 1.8a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zm4.15-2.95a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z" },
};
function FooterSocial({ social }: { social: OrganizationFooterData["social"] }) {
  const entries = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[]).map((key) => ({ key, url: social[key], icon: SOCIAL_ICONS[key] })).filter((entry) => entry.url);
  if (entries.length === 0) return null;
  return <div className="footer-social">{entries.map(({ key, url, icon }) => <a key={key} href={url ?? undefined} target="_blank" rel="noreferrer noopener" aria-label={icon.label}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={icon.path} /></svg></a>)}</div>;
}

/**
 * Generieke footer - website_public_social_links, geen vaste beperking tot
 * Facebook/Instagram: elk platform_key dat Websitebeheer heeft opgeslagen
 * wordt getoond, in sort_order. De RPC filtert zelf al op is_visible = true
 * (server-side, nooit hier client-side verborgen) - elke rij die hier
 * binnenkomt moet dus getoond worden. Een eigen icon_path (icoonUrl) heeft
 * voorrang; anders een standaardicoon voor bekende platformen; anders een
 * neutraal wereldbol-icoon (zelfde default als Websitebeheer's "Anders").
 */
const PLATFORM_DEFAULT_ICONS: Readonly<Record<string, string>> = {
  facebook: "M13.5 21v-7.2h2.4l.36-2.8h-2.76V9.2c0-.8.22-1.36 1.38-1.36h1.48V5.35c-.26-.03-1.13-.11-2.15-.11-2.13 0-3.58 1.3-3.58 3.68v2.05H8.28v2.8h2.35V21z",
  instagram: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zm0 1.8A2.2 2.2 0 0 0 5.8 8v8A2.2 2.2 0 0 0 8 18.2h8a2.2 2.2 0 0 0 2.2-2.2V8A2.2 2.2 0 0 0 16 5.8zm4 2.5a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4zm0 1.8a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zm4.15-2.95a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z",
  linkedin: "M6.94 8.5a1.94 1.94 0 1 0 0-3.88 1.94 1.94 0 0 0 0 3.88zM5.2 19h3.5V10H5.2zM11 10h3.35v1.23h.05c.47-.85 1.6-1.75 3.3-1.75 3.53 0 4.18 2.19 4.18 5.04V19h-3.5v-4.02c0-.96-.02-2.2-1.36-2.2-1.37 0-1.58 1.03-1.58 2.13V19H11z",
  youtube: "M21.5 8.2s-.2-1.44-.82-2.08c-.78-.83-1.66-.83-2.06-.88C15.8 5 12 5 12 5h-.01s-3.79 0-6.6.24c-.4.05-1.28.05-2.06.88-.62.64-.82 2.08-.82 2.08S2.3 9.9 2.3 11.6v1.3c0 1.7.2 3.4.2 3.4s.2 1.44.82 2.08c.78.83 1.8.8 2.26.89 1.64.16 6.42.24 6.42.24s3.8-.01 6.6-.25c.4-.05 1.28-.05 2.06-.88.62-.64.82-2.08.82-2.08s.2-1.7.2-3.4v-1.3c0-1.7-.2-3.4-.2-3.4zM9.9 14.9V8.9l5.4 3z",
  tiktok: "M14.5 3h2.7c.2 1.6 1.3 2.9 3 3.3v2.7c-1.1 0-2.1-.3-3-1v6.4a5.6 5.6 0 1 1-5.6-5.6c.2 0 .5 0 .7.04v2.8a2.8 2.8 0 1 0 2.2 2.73V3z",
  x: "M4 4l7 8.4L4.4 20H6.6l5.6-6.4L16.6 20H20l-7.3-8.8L19.8 4h-2.2l-5.2 5.9L8 4H4z",
  whatsapp: "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm0 1.8a7.2 7.2 0 1 1-3.9 13.2l-.28-.17-2.7.7.72-2.63-.18-.3A7.2 7.2 0 0 1 12 4.8zm-3.3 3.6c-.18 0-.47.07-.72.35-.24.28-.94.9-.94 2.2 0 1.3.96 2.55 1.1 2.72.13.18 1.9 2.9 4.6 4 .64.27 1.14.44 1.53.56.64.2 1.23.17 1.69.1.52-.08 1.6-.65 1.82-1.28.23-.63.23-1.16.16-1.28-.07-.12-.25-.19-.53-.32-.28-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.6.14-.19.28-.7.87-.86 1.05-.16.18-.31.2-.59.07-.28-.14-1.18-.43-2.25-1.38-.83-.74-1.4-1.65-1.56-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.47.14-.16.18-.28.28-.46.09-.19.05-.35-.02-.49-.07-.14-.6-1.46-.83-2-.2-.5-.42-.44-.6-.44z",
};
const PLATFORM_FALLBACK_ICON = "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm6.9 8.1h-2.5a13.6 13.6 0 0 0-.85-4.34A7.24 7.24 0 0 1 18.9 11.1zm-5.3-6.1c.6 1.03 1.24 2.7 1.44 6.1h-4.08c.2-3.4.84-5.07 1.44-6.1a7.1 7.1 0 0 1 1.2-.1c.4 0 .8.03 1.2.1zm-4.15 1.76a13.6 13.6 0 0 0-.85 4.34H5.1a7.24 7.24 0 0 1 3.35-4.34zM5.1 12.9h2.5c.1 1.7.4 3.1.85 4.34A7.24 7.24 0 0 1 5.1 12.9zm5.28 6.1c-.6-1.03-1.24-2.7-1.44-6.1h4.08c-.2 3.4-.84 5.07-1.44 6.1-.4.07-.8.1-1.2.1s-.8-.03-1.2-.1zm4.15-1.76c.45-1.24.75-2.64.85-4.34h2.5a7.24 7.24 0 0 1-3.35 4.34z";
function FooterSocialGeneric({ links }: { links: readonly WebsiteSocialLink[] }) {
  if (links.length === 0) return null;
  return <div className="footer-social">{links.map((link) => (
    <a key={`${link.platformKey}-${link.url}`} href={link.url} target="_blank" rel="noreferrer noopener" aria-label={link.label}>
      {link.iconUrl
        ? <img src={link.iconUrl} width={20} height={20} alt="" />
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={PLATFORM_DEFAULT_ICONS[link.platformKey] ?? PLATFORM_FALLBACK_ICON} /></svg>}
    </a>
  ))}</div>;
}

function FooterOrganization({ footer, socialLinks }: { footer: OrganizationFooterData | null; socialLinks: readonly WebsiteSocialLink[] | null }) {
  const hasAddress = Boolean(footer?.street || footer?.city);
  const hasKvkBtw = Boolean(footer?.kvkNumber || footer?.btwNumber);
  return <div>
    {footer?.logoUrl
      ? <Link className="brand" href="/" aria-label={`${footer.organizationName} — homepage`}><img className="brand-lockup" src={footer.logoUrl} alt={footer.organizationName} width={104} height={91} /></Link>
      : <Brand/>}
    <p style={{marginTop:16}}>{footer?.publicDescription || "Software voor verenigingen die overzicht willen houden in hun dagelijkse organisatie."}</p>
    {hasAddress ? <p>{footer!.street} {footer!.houseNumber}{footer!.houseNumberAddition ?? ""}<br/>{footer!.postalCode} {footer!.city}</p> : null}
    <p>
      <a href={`mailto:${footer?.contactEmail ?? "info@meervereniging.nl"}`}>{footer?.contactEmail ?? "info@meervereniging.nl"}</a>
      {footer?.contactPhone ? <> · {footer.contactPhone}</> : null}
    </p>
    {hasKvkBtw ? <p className="footer-meta">{footer!.kvkNumber ? `KvK ${footer!.kvkNumber}` : null}{footer!.kvkNumber && footer!.btwNumber ? " · " : null}{footer!.btwNumber ? `Btw ${footer!.btwNumber}` : null}</p> : null}
    {/* socialLinks === null betekent "generiek model nog niet beschikbaar" (RPC bestaat nog niet) - val dan terug op de huidige, live Facebook/Instagram-implementatie. Een lege array is een geldig resultaat (geen zichtbare kanalen) en toont dus terecht niets. */}
    {socialLinks !== null
      ? <FooterSocialGeneric links={socialLinks} />
      : (footer ? <FooterSocial social={footer.social} /> : null)}
  </div>;
}
export async function Footer(){
  const [footer, socialLinks] = await Promise.all([getOrganizationFooterData(), getWebsiteSocialLinks()]);
  {/* /voor-wie staat bewust niet in site.nav (dat zou ook een 5e hoofdnavigatie-item
      toevoegen en het bekende header-overlapprobleem rond ~800-900px kunnen verergeren),
      maar had zonder deze link geen enkele interne verwijzing - alleen hier, footer-only. */}
  return <footer className="footer"><div className="container grid footer-grid"><FooterOrganization footer={footer} socialLinks={socialLinks}/><div><b>Meer Vereniging</b>{site.nav.map(([name,href])=><p key={href}><Link href={href}>{name}</Link></p>)}<p><Link href="/voor-wie">Voor wie is Meer Vereniging?</Link></p></div><div><b>Informatie</b><p><Link href="/privacy">Privacy</Link></p><p><Link href="/cookies">Cookies</Link></p><p><Link href="/algemene-voorwaarden">Algemene voorwaarden</Link></p><p><Link href="/beveiliging">Beveiliging</Link></p><p><Link href="/data-opslag">Data-opslag</Link></p></div></div><div className="footer-bottom container"><small>© 2026 Meer Vereniging. Alle rechten voorbehouden.</small><nav aria-label="Juridisch"><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link><Link href="/algemene-voorwaarden">Algemene voorwaarden</Link></nav></div></footer>;
}
export function PublicShell({children}:{children:React.ReactNode}){return <><Header/><main>{children}</main><Footer/></>}
