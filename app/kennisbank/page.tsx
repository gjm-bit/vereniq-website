import { SiteLink as Link } from "@/src/components/site-link";
import { PublicShell } from "@/src/components/site-shell";
import { localArticles } from "@/src/repositories/local";
import { pageMetadata } from "@/src/lib/seo";
/**
 * Zolang er nog geen gepubliceerde artikelen zijn, toont deze pagina alleen
 * een "we vullen dit rustig" placeholder - te dun om te indexeren. Zodra er
 * echte artikelen bijkomen, indexeert de pagina vanzelf weer mee (geen
 * handmatige stap nodig).
 */
export async function generateMetadata(){const articles=await localArticles.listPublished();return pageMetadata({title:"Kennisbank",description:"Praktische informatie over verenigingsbeheer, digitalisering, privacy en slimmer organiseren.",path:"/kennisbank",noindex:articles.length===0});}
export default async function Knowledge(){const articles=await localArticles.listPublished();return <PublicShell><section className="section section-soft"><div className="container"><p className="eyebrow">Kennisbank</p><h1>Praktische kennis,<br/>binnenkort hier.</h1><p className="lede">Binnenkort delen we hier praktische informatie over verenigingsbeheer, digitalisering, privacy en slimmer organiseren.</p></div></section><section className="section"><div className="container">{articles.length?<div className="grid cards-3">{articles.map(a=><Link className="card" href={`/kennisbank/${a.slug}`} key={a.id}><span className="badge">{a.category}</span><h3 style={{marginTop:16}}>{a.title}</h3><p>{a.excerpt}</p><b>Lees artikel →</b></Link>)}</div>:<div className="card"><h2>We zijn deze plek rustig aan het vullen.</h2><p className="lede">Geen stapel algemene artikelen, maar informatie die verenigingen echt helpt in hun dagelijkse praktijk.</p><Link className="btn btn-secondary" href="/contact">Stel een vraag</Link></div>}</div></section></PublicShell>}
