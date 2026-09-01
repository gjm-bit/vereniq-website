import { PublicShell } from "@/src/components/site-shell";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { getPublishedCmsPage } from "@/src/lib/public-cms";
import { HomepageCreative } from "@/src/components/homepage-creative";
import { pageMetadata } from "@/src/lib/seo";

export async function generateMetadata(){const page=await getPublishedCmsPage("/");if(page)return pageMetadata({title:page.seoTitle??page.title,description:page.seoDescription??"",path:"/",noindex:page.noindex});return pageMetadata({title:"Meer Vereniging — Minder regelen. Meer verenigen.",description:"Het complete platform voor verenigingen die minder willen regelen en meer willen verenigen.",path:"/",titleIsAbsolute:true});}
export default async function Home(){const cmsPage=await getPublishedCmsPage("/");if(cmsPage)return <CmsPublicPageView page={cmsPage}/>;return <PublicShell><HomepageCreative/></PublicShell>}
