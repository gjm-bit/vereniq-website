import type { Metadata } from "next";
import { headers } from "next/headers";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { getCmsPreviewPage } from "@/src/lib/public-cms";

export const cmsPreviewMetadata: Metadata = {
  title: "Conceptvoorbeeld | Meer Vereniging",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Websitebeheer's "Veilig voorbeeld" iframe used to trust its own onLoad
 * event to mean "the preview rendered correctly" - but onLoad fires for a
 * refused/blocked frame just as much as a real one, and it also fires for a
 * *successfully rendered* PreviewError (e.g. an expired token still loads a
 * valid HTML document, just not the real page). Both looked identical from
 * the parent frame: a false "Preview bijgewerkt" checkmark. This posts an
 * explicit, origin-scoped status signal the parent can trust instead of
 * inferring anything from onLoad. Must match proxy.ts's
 * CMS_PREVIEW_TRUSTED_PARENT_ORIGIN exactly.
 */
const MASTER_BEHEER_ORIGIN = "https://beheer.meervereniging.nl";

async function PreviewStatusSignal({ ok, reason }: { ok: boolean; reason: string }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const payload = JSON.stringify({ source: "meer-vereniging-cms-preview", ok, reason });
  return (
    <script
      nonce={nonce}
      // Static JSON.stringify output only - no user input reaches this string.
      dangerouslySetInnerHTML={{
        __html: `try{window.parent.postMessage(${payload},${JSON.stringify(MASTER_BEHEER_ORIGIN)});}catch(e){}`,
      }}
    />
  );
}

function PreviewError({ kind }: { kind: "missing-token" | "unavailable" | "resolver" }) {
  const copy = {
    "missing-token": {
      title: "Voorbeeld niet beschikbaar",
      body: "Open deze pagina vanuit Websitebeheer om een veilig voorbeeld te laden.",
    },
    unavailable: {
      title: "Voorbeeld niet beschikbaar",
      body: "Dit conceptvoorbeeld is verlopen of niet toegankelijk.",
    },
    resolver: {
      title: "Voorbeeld kon niet worden geladen",
      body: "Probeer het voorbeeld opnieuw vanuit Websitebeheer.",
    },
  }[kind];

  return (
    <main className="section">
      <div className="container">
        <h1>{copy.title}</h1>
        <p className="lede">{copy.body}</p>
      </div>
      <PreviewStatusSignal ok={false} reason={kind} />
    </main>
  );
}

/**
 * The public preview intentionally receives no path. The secure RPC resolves
 * the page from the short-lived token, so homepage previews use the same
 * renderer as `/` and cannot fall through to the public slug route.
 */
export async function CmsPreviewPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token?.trim();
  if (!token) return <PreviewError kind="missing-token" />;

  let page: Awaited<ReturnType<typeof getCmsPreviewPage>>;
  try {
    page = await getCmsPreviewPage(token);
  } catch {
    // Resolver/network failures are not public 404s and must not leak details.
    return <PreviewError kind="resolver" />;
  }
  if (!page) return <PreviewError kind="unavailable" />;
  return (
    <>
      <CmsPublicPageView page={page} />
      <PreviewStatusSignal ok={true} reason="ok" />
    </>
  );
}
