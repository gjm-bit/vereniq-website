import type { Metadata } from "next";
import { CmsPublicPageView } from "@/src/components/cms-public-page";
import { getCmsPreviewPage } from "@/src/lib/public-cms";

export const cmsPreviewMetadata: Metadata = {
  title: "Conceptvoorbeeld | Meer Vereniging",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

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
  return <CmsPublicPageView page={page} />;
}
