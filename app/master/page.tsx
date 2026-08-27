import { PortalShell } from "@/src/components/portal-shell";
import { SiteLink as Link } from "@/src/components/site-link";
import { WebsiteEditor } from "@/src/components/website-editor";
import { localModules, localPages } from "@/src/repositories/local";

export const dynamic = "force-dynamic";

export default async function Master({ searchParams }: { searchParams: Promise<{ section?: string; page?: string }> }) {
  const params = await searchParams;
  const section = params.section ?? "dashboard";
  if (section !== "dashboard" && section !== "content") return <PortalShell><h1>{section.replaceAll("-", " ")}</h1><div className="notice">Foundation aanwezig. Deze module is bewust nog niet functioneel gemaakt.</div></PortalShell>;
  const [pages, modules] = await Promise.all([localPages.list(), localModules.listPublished()]);
  if (section === "content") return <PortalShell><WebsiteEditor pages={pages} initialPageId={params.page} /></PortalShell>;
  return <PortalShell><p className="eyebrow">Master Portaal</p><h1>Goedemorgen.</h1><p className="lede">Een rustig overzicht van het Meer Vereniging-platform.</p><div className="grid cards-3" style={{ marginTop: 30 }}>{[["Gepubliceerde pagina’s", String(pages.filter((p) => p.status === "published").length)], ["Beschikbare modules", String(modules.length)], ["Nieuwe leads", "0"]].map(([title, value]) => <article className="card" key={title}><p className="muted">{title}</p><div className="stat">{value}</div></article>)}</div><section className="card" style={{ marginTop: 20 }}><h2 style={{ fontSize: "1.4rem" }}>Volgende stap</h2><p className="muted">Beheer de commerciële website, content, navigatie en juridische informatie vanuit één centrale module.</p><Link className="btn btn-primary" href="/master?section=content">Open Website &amp; Content</Link></section></PortalShell>;
}
