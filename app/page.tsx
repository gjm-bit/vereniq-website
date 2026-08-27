import { PublicShell } from "@/src/components/site-shell";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { getPublishedCmsPage } from "@/src/lib/public-cms";
import { HomepageCreative } from "@/src/components/homepage-creative";

export async function generateMetadata(){const page=await getPublishedCmsPage("/");return page?{title:page.seoTitle??page.title,description:page.seoDescription??undefined,robots:page.noindex?{index:false,follow:false}:undefined}:{ };}
export default async function Home(){const cmsPage=await getPublishedCmsPage("/");if(cmsPage)return <CmsPublicPageView page={cmsPage}/>;return <PublicShell><HomepageCreative/></PublicShell>}
