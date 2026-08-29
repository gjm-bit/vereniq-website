"use client";

// PROEFABONNEMENT FASE 3 — activatiepagina. Leest signup/token uit de
// query string en post die éénmalig naar app/api/proefabonnement/
// activeren/route.ts (server-side, service_role). "Verlopen" en "ongeldig/
// al gebruikt" krijgen allebei een nette status met een link om opnieuw
// een proefabonnement aan te vragen; "al actief" (already_bootstrapped)
// krijgt een eigen, neutrale status met een inlog-link i.p.v. "opnieuw
// aanvragen" - die twee mogen nooit door elkaar lopen.

import { useEffect, useState } from "react";

import { SiteLink as Link } from "@/src/components/site-link";

type ActivationState =
  | { kind: "loading" }
  | { kind: "activated"; organizationName: string; emailSent: boolean }
  | { kind: "already_active"; organizationName: string }
  | { kind: "held_for_review"; message: string }
  | { kind: "expired" }
  | { kind: "invalid" }
  | { kind: "unexpected_failure"; message: string };

export function TrialActivationStatus() {
  const [state, setState] = useState<ActivationState>({ kind: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signupId = params.get("signup") ?? "";
    const token = params.get("token") ?? "";
    let cancelled = false;
    if (!signupId || !token) {
      Promise.resolve().then(() => {
        if (!cancelled) setState({ kind: "invalid" });
      });
      return () => {
        cancelled = true;
      };
    }
    fetch("/api/proefabonnement/activeren", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signupId, token }),
    })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as {
          success?: boolean; status?: string; organizationName?: string; emailSent?: boolean; message?: string;
        } | null;
        if (cancelled) return;
        if (result?.status === "activated") {
          setState({ kind: "activated", organizationName: result.organizationName ?? "je vereniging", emailSent: result.emailSent !== false });
        } else if (result?.status === "already_active") {
          setState({ kind: "already_active", organizationName: result.organizationName ?? "je vereniging" });
        } else if (result?.status === "held_for_review") {
          setState({ kind: "held_for_review", message: result.message ?? "Je aanvraag wordt beoordeeld." });
        } else if (result?.status === "expired") {
          setState({ kind: "expired" });
        } else if (result?.status === "invalid") {
          setState({ kind: "invalid" });
        } else {
          setState({ kind: "unexpected_failure", message: result?.message ?? "Activeren is niet gelukt." });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "unexpected_failure", message: "Activeren is niet gelukt. Probeer het later opnieuw." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="status-panel status-panel-neutral" role="status" data-testid="trial-activation-loading">
        <h2>Je omgeving wordt geactiveerd…</h2>
        <p>Dit duurt meestal maar een paar seconden.</p>
      </div>
    );
  }

  if (state.kind === "activated") {
    return (
      <div className="status-panel status-panel-success" role="status" data-testid="trial-activation-success">
        <h2>{state.organizationName} is klaar</h2>
        {state.emailSent ? (
          <p>We hebben een e-mail gestuurd om je wachtwoord in te stellen. Controleer je inbox om verder te gaan.</p>
        ) : (
          <p>Je omgeving is aangemaakt, maar de e-mail met je wachtwoordlink kon niet worden verstuurd. Neem contact met ons op via <a href="mailto:info@meervereniging.nl">info@meervereniging.nl</a>.</p>
        )}
      </div>
    );
  }

  if (state.kind === "already_active") {
    return (
      <div className="status-panel status-panel-neutral" role="status" data-testid="trial-activation-already-active">
        <h2>{state.organizationName} is al actief</h2>
        <p>Deze proefomgeving heeft al een beheerder met een ingesteld wachtwoord.</p>
        <a className="btn btn-primary" href="https://beheer.meervereniging.nl">Log in</a>
      </div>
    );
  }

  if (state.kind === "held_for_review") {
    return (
      <div className="status-panel status-panel-neutral" role="status" data-testid="trial-activation-held-for-review">
        <h2>Je aanvraag wordt beoordeeld</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  if (state.kind === "expired") {
    return (
      <div className="status-panel status-panel-error" role="alert" data-testid="trial-activation-expired">
        <h2>Deze link is verlopen</h2>
        <p>Activatielinks zijn 48 uur geldig. Vraag een nieuw proefabonnement aan om opnieuw te starten.</p>
        <Link className="btn btn-primary" href="/proefabonnement">Opnieuw aanvragen</Link>
      </div>
    );
  }

  if (state.kind === "invalid") {
    return (
      <div className="status-panel status-panel-error" role="alert" data-testid="trial-activation-invalid">
        <h2>Deze link is ongeldig</h2>
        <p>Controleer of je de volledige link uit je e-mail hebt geopend. Werkt het nog steeds niet? Vraag een nieuw proefabonnement aan.</p>
        <Link className="btn btn-primary" href="/proefabonnement">Opnieuw aanvragen</Link>
      </div>
    );
  }

  return (
    <div className="status-panel status-panel-error" role="alert" data-testid="trial-activation-unexpected">
      <h2>Er ging iets mis</h2>
      <p>{state.message}</p>
      <Link className="btn btn-primary" href="/proefabonnement">Opnieuw aanvragen</Link>
    </div>
  );
}
