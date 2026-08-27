# Publieke website — source of truth

De publieke website achter `https://meervereniging.nl` wordt gebouwd vanuit:

`/Users/gert-janmarechal/Documents/ChatGPT/MeerVereniging`

- Framework: Vinext/Vite (`npm run build`)
- Vercel-project: `meer-vereniging`
- Vercel-project-id: `prj_DzBAHAfKK6FWZtJTPbKsXQqFWGmY`
- Vercel-team: `team_CdqXFswWGd96TjxGF19ntpLu` (`Feestbende`)
- Production domain: `meervereniging.nl` (ook `www.meervereniging.nl`)
- Lokale branch: `master-beheer/foundation`
- Deployment: bestaande Vercel-project via de gekoppelde `.vercel/project.json` en `vercel deploy --prod`

De repository gebruikt het `sites`-remote als bronkoppeling. Er is geen nieuwe
Vercel-project- of Supabase-omgeving nodig voor publieke sitewijzigingen.

De publieke site gebruikt uitsluitend de anonieme CMS-RPC-contracten
`website_public_page` (gepubliceerde snapshots) en `website_preview_page`
(short-lived preview tokens). Master Beheer maakt en beheert de preview-sessie;
de publieke site valideert het opaque token via de RPC en rendert daarna met
dezelfde `CmsPublicPageView` als de publieke CMS-pagina's.
