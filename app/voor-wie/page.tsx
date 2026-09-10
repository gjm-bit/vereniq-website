import { SiteLink as Link } from "@/src/components/site-link";
import { PublicShell } from "@/src/components/site-shell";
// SEO Vindbaarheid 2.0 (voorstel): "kleine-verenigingen" toegevoegd als
// nieuwe, samengevoegde doelgroep (senioren/buurt/hobby/cultureel) - zie de
// toelichting in app/voor-wie/[slug]/page.tsx. Zonder deze link hier zou
// die nieuwe pagina een orphan page zijn (nergens intern naar gelinkt).
const groups=[['muziekverenigingen','Muziekverenigingen','Van repetities en optredens tot secties, leden en communicatie.'],['sportverenigingen','Sportverenigingen','Voor teams, trainingen, wedstrijden, vrijwilligers en ledencontact.'],['carnavalsverenigingen','Carnavalsverenigingen','Voor commissies, activiteiten en een seizoen waarin veel tegelijk gebeurt.'],['stichtingen','Stichtingen','Voor kleine besturen die overzicht en continuïteit willen houden.'],['kleine-verenigingen','Senioren-, buurt-, hobby- en culturele verenigingen','Voor kleine, informele verenigingen die iets willen dat direct te snappen is.'],['andere-verenigingen','Andere verenigingen','Voor organisaties met leden, vrijwilligers, activiteiten en een eigen ritme.']];
// SEO Vindbaarheid 2.0: title bevatte "| Meer Vereniging" terwijl het
// sitebrede title-template (app/layout.tsx) dat automatisch al toevoegt -
// resultaat was een dubbele merknaam in de <title> ("... | Meer Vereniging
// | Meer Vereniging"), gevonden tijdens de technische audit.
export const metadata={title:"Voor wie",description:"Meer Vereniging is gemaakt voor verenigingen en stichtingen die minder willen regelen en meer willen verenigen.",alternates:{canonical:"/voor-wie"}};
export default function Audiences(){return <PublicShell><section className="hero"><div className="container"><p className="eyebrow">Voor wie</p><h1>Elke vereniging heeft een eigen ritme.</h1><p className="lede">Meer Vereniging sluit aan op de dagelijkse praktijk van verenigingen. Niet iedereen werkt hetzelfde; overzicht en duidelijke communicatie helpen wel overal.</p></div></section><section className="section"><div className="container"><div className="module-list">{groups.map(([slug,title,body],index)=><Link className="module-row" href={`/voor-wie/${slug}`} key={slug}><span className="module-index">{String(index+1).padStart(2,'0')}</span><h2 style={{fontSize:'1.35rem',margin:0}}>{title}</h2><p>{body}</p><span className="btn-quiet">Lees meer</span></Link>)}</div></div></section></PublicShell>}
