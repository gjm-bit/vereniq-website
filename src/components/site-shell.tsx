import Image from "next/image"; import { SiteLink as Link } from "./site-link"; import { site } from "@/src/config/site"; import { MobileMenu } from "./mobile-menu"; import { getOrganizationFooterData, type OrganizationFooterData } from "@/src/lib/public-cms";
export function Brand(){return <Link className="brand" href="/" aria-label="Meer Vereniging — homepage"><Image className="brand-icon" src="/brand/meer-vereniging-symbol.png" alt="" width={279} height={215} unoptimized/><span className="brand-text"><span className="brand-word">Meer Vereniging</span><span className="brand-tagline">Minder regelen. Meer verenigen.</span></span></Link>}
export function Header(){return <div className="header-surface"><header className="container site-header"><Brand/><nav className="nav" aria-label="Hoofdnavigatie">{site.nav.map(([n,h])=><Link key={h} href={h}>{n}</Link>)}</nav><div className="header-actions"><a className="btn btn-secondary" href="https://beheer.meervereniging.nl">Inloggen</a><Link className="btn btn-primary" href="/proefabonnement">Probeer gratis</Link></div></header><MobileMenu/></div>}

/** Volgorde is product-bepaald: Facebook → Instagram → YouTube → LinkedIn. */
export const SOCIAL_ICONS: Readonly<Record<keyof OrganizationFooterData["social"], { label: string; path: string }>> = {
  facebook: { label: "Facebook", path: "M13.5 21v-7.2h2.4l.36-2.8h-2.76V9.2c0-.8.22-1.36 1.38-1.36h1.48V5.35c-.26-.03-1.13-.11-2.15-.11-2.13 0-3.58 1.3-3.58 3.68v2.05H8.28v2.8h2.35V21z" },
  instagram: { label: "Instagram", path: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zm0 1.8A2.2 2.2 0 0 0 5.8 8v8A2.2 2.2 0 0 0 8 18.2h8a2.2 2.2 0 0 0 2.2-2.2V8A2.2 2.2 0 0 0 16 5.8zm4 2.5a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4zm0 1.8a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zm4.15-2.95a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z" },
  youtube: { label: "YouTube", path: "M21.5 8.2s-.2-1.44-.82-2.08c-.78-.83-1.66-.83-2.06-.88C15.8 5 12 5 12 5h-.01s-3.79 0-6.6.24c-.4.05-1.28.05-2.06.88-.62.64-.82 2.08-.82 2.08S2.3 9.9 2.3 11.6v1.3c0 1.7.2 3.4.2 3.4s.2 1.44.82 2.08c.78.83 1.8.8 2.26.89 1.64.16 6.42.24 6.42.24s3.8-.01 6.6-.25c.4-.05 1.28-.05 2.06-.88.62-.64.82-2.08.82-2.08s.2-1.7.2-3.4v-1.3c0-1.7-.2-3.4-.2-3.4zM9.9 14.9V8.9l5.4 3z" },
  linkedin: { label: "LinkedIn", path: "M6.94 8.5a1.94 1.94 0 1 0 0-3.88 1.94 1.94 0 0 0 0 3.88zM5.2 19h3.5V10H5.2zM11 10h3.35v1.23h.05c.47-.85 1.6-1.75 3.3-1.75 3.53 0 4.18 2.19 4.18 5.04V19h-3.5v-4.02c0-.96-.02-2.2-1.36-2.2-1.37 0-1.58 1.03-1.58 2.13V19H11z" },
};
function FooterSocial({ social }: { social: OrganizationFooterData["social"] }) {
  const entries = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[]).map((key) => ({ key, url: social[key], icon: SOCIAL_ICONS[key] })).filter((entry) => entry.url);
  if (entries.length === 0) return null;
  return <div className="footer-social">{entries.map(({ key, url, icon }) => <a key={key} href={url ?? undefined} target="_blank" rel="noreferrer noopener" aria-label={icon.label}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={icon.path} /></svg></a>)}</div>;
}
function FooterOrganization({ footer }: { footer: OrganizationFooterData | null }) {
  const hasAddress = Boolean(footer?.street || footer?.city);
  const hasKvkBtw = Boolean(footer?.kvkNumber || footer?.btwNumber);
  return <div>
    {footer?.logoUrl
      ? <Link className="brand" href="/" aria-label={`${footer.organizationName} — homepage`}><img className="brand-lockup" src={footer.logoUrl} alt={footer.organizationName} width={104} height={91} /></Link>
      : <Brand/>}
    <p style={{marginTop:16}}>Software voor verenigingen die overzicht willen houden in hun dagelijkse organisatie.</p>
    {hasAddress ? <p>{footer!.street} {footer!.houseNumber}{footer!.houseNumberAddition ?? ""}<br/>{footer!.postalCode} {footer!.city}</p> : null}
    <p>
      <a href={`mailto:${footer?.contactEmail ?? "info@meervereniging.nl"}`}>{footer?.contactEmail ?? "info@meervereniging.nl"}</a>
      {footer?.contactPhone ? <> · {footer.contactPhone}</> : null}
    </p>
    {hasKvkBtw ? <p className="footer-meta">{footer!.kvkNumber ? `KvK ${footer!.kvkNumber}` : null}{footer!.kvkNumber && footer!.btwNumber ? " · " : null}{footer!.btwNumber ? `Btw ${footer!.btwNumber}` : null}</p> : null}
    {footer ? <FooterSocial social={footer.social} /> : null}
  </div>;
}
export async function Footer(){
  const footer = await getOrganizationFooterData();
  return <footer className="footer"><div className="container grid footer-grid"><FooterOrganization footer={footer}/><div><b>Meer Vereniging</b>{site.nav.map(([name,href])=><p key={href}><Link href={href}>{name}</Link></p>)}</div><div><b>Informatie</b><p><Link href="/privacy">Privacy</Link></p><p><Link href="/cookies">Cookies</Link></p><p><Link href="/algemene-voorwaarden">Algemene voorwaarden</Link></p><p><Link href="/beveiliging">Beveiliging</Link></p><p><Link href="/data-opslag">Data-opslag</Link></p></div></div><div className="footer-bottom container"><small>© 2026 Meer Vereniging. Alle rechten voorbehouden.</small><nav aria-label="Juridisch"><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link><Link href="/algemene-voorwaarden">Algemene voorwaarden</Link></nav></div></footer>;
}
export function PublicShell({children}:{children:React.ReactNode}){return <><Header/><main>{children}</main><Footer/></>}
