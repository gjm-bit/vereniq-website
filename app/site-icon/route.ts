// WEBSITEBEHEER — dynamisch website-icoon (favicon), 2026-09-01. Vervangt
// de vaste `metadata.icons`-verwijzing in app/layout.tsx door een echte
// Route Handler: het `<link rel="icon">`-adres blijft stabiel (/site-icon),
// maar wat die URL teruggeeft hangt af van de actuele instelling in
// Website → Instellingen → Website-icoon. Geen client-side DOM-hack (geen
// achteraf vervangen van <link>-tags) - dit draait volledig server-side,
// per aanvraag, en breekt SSR/build niet: de statische metadata verwijst
// alleen naar dit stabiele pad, nooit rechtstreeks naar een asset-URL.
//
// Faalt getWebsiteFaviconUrl() (RPC nog niet beschikbaar, of geen eigen
// icoon ingesteld), dan wordt doorverwezen naar exact de huidige,
// bestaande statische standaardafbeelding - geen wijziging in wat
// bezoekers vandaag al zien.

import { getWebsiteFaviconUrl } from "@/src/lib/public-cms";

const DEFAULT_FAVICON_PATH = "/brand/meer-vereniging-brand-lockup.png";

export async function GET(request: Request) {
  const faviconUrl = await getWebsiteFaviconUrl();
  const target = faviconUrl ?? DEFAULT_FAVICON_PATH;
  return Response.redirect(new URL(target, request.url), 307);
}
