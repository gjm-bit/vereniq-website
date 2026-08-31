import Image from "next/image"; import { SiteLink as Link } from "./site-link"; import { site } from "@/src/config/site"; import { MobileMenu } from "./mobile-menu"; import { getOrganizationFooterData, type OrganizationFooterData } from "@/src/lib/public-cms";
export function Brand(){return <Link className="brand" href="/" aria-label="Meer Vereniging — homepage"><Image className="brand-icon" src="/brand/meer-vereniging-symbol.png" alt="" width={279} height={215} unoptimized/><span className="brand-text"><span className="brand-word">Meer Vereniging</span><span className="brand-tagline">Minder regelen. Meer verenigen.</span></span></Link>}
export function Header(){return <div className="header-surface"><header className="container site-header"><Brand/><nav className="nav" aria-label="Hoofdnavigatie">{site.nav.map(([n,h])=><Link key={h} href={h}>{n}</Link>)}</nav><div className="header-actions"><a className="btn btn-secondary" href="https://beheer.meervereniging.nl">Inloggen</a><Link className="btn btn-primary" href="/proefabonnement">Probeer gratis</Link></div></header><MobileMenu/></div>}

/**
 * Meer Vereniging gebruikt voorlopig uitsluitend Facebook en Instagram in de
 * publieke footer (productbeslissing). YouTube/LinkedIn blijven bestaan in
 * OrganizationFooterData["social"] (backward compatibility met het bestaande
 * schema/de bestaande RPC) maar staan hier bewust niet in SOCIAL_ICONS, dus
 * FooterSocial rendert ze nooit, ongeacht of er ooit een waarde voor
 * ingevuld wordt. Volgorde: Facebook → Instagram.
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
