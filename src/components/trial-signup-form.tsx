"use client";

// PROEFABONNEMENT FASE 3 — het publieke aanvraagformulier. Verstuurt
// uitsluitend naar app/api/proefabonnement/aanvraag/route.ts (server-side,
// nooit rechtstreeks naar Supabase) - zie dat bestand voor de RPC-aanroep,
// Turnstile-verificatie en anti-enumeratielogica. Deze component toont
// alleen de respons die de server al veilig heeft samengesteld.

import { useState } from "react";

import { TurnstileWidget } from "./turnstile-widget";
import type { TrialColorPreset } from "@/src/lib/public-trial";

type FieldErrors = Partial<Record<"organizationName" | "contactName" | "contactEmail" | "colorPresetKey", string>>;
type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "rate_limited"; message: string }
  | { kind: "error"; message: string };

export function TrialSignupForm({ initialTrialDays, presets, turnstileSiteKey }: { initialTrialDays: number | null; presets: readonly TrialColorPreset[]; turnstileSiteKey: string | null }) {
  const [organizationName, setOrganizationName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [colorPresetKey, setColorPresetKey] = useState<string>(presets[0]?.key ?? "");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const heroLabel = initialTrialDays ? `Probeer ${initialTrialDays} dagen gratis` : "Probeer gratis";

  // Trial Onboarding UX 2.0: benoemde reisfasen (Vereniging -> Uitstraling ->
  // Bevestigen) i.p.v. losse, willekeurige tussenkopjes - dit zijn de eerste
  // drie van de vijf gedeelde fasenamen uit het productvoorstel; de laatste
  // twee (Inrichten/Klaar) horen bij de tenant-app en worden hier niet getoond.
  // "Huidige" fase volgt live uit de al ingevulde velden, geen aparte state.
  const step1Done = organizationName.trim().length >= 2 && contactName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());
  const step2Done = step1Done && Boolean(colorPresetKey);
  const selectedPreset = presets.find((preset) => preset.key === colorPresetKey);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (organizationName.trim().length < 2) errors.organizationName = "Vul de naam van je vereniging in (minimaal 2 tekens).";
    if (contactName.trim().length < 2) errors.contactName = "Vul je naam in (minimaal 2 tekens).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) errors.contactEmail = "Vul een geldig e-mailadres in.";
    if (!colorPresetKey) errors.colorPresetKey = "Kies een kleurstijl.";
    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!turnstileToken) {
      setState({ kind: "error", message: "Wacht tot de verificatie is geladen en probeer het opnieuw." });
      return;
    }

    setState({ kind: "submitting" });
    try {
      const response = await fetch("/api/proefabonnement/aanvraag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationName: organizationName.trim(), contactName: contactName.trim(), contactEmail: contactEmail.trim(), colorPresetKey, turnstileToken }),
      });
      const result = (await response.json().catch(() => null)) as { success?: boolean; code?: string; field?: string; message?: string } | null;
      if (result?.success) {
        setState({ kind: "success" });
        return;
      }
      if (result?.code === "invalid_request" && result.field) {
        setFieldErrors({ [result.field]: result.message ?? "Controleer dit veld." });
        setState({ kind: "idle" });
        return;
      }
      if (result?.code === "rate_limited") {
        setState({ kind: "rate_limited", message: result.message ?? "Wacht even en probeer het straks opnieuw." });
        return;
      }
      setState({ kind: "error", message: result?.message ?? "Er ging iets mis. Probeer het later opnieuw." });
    } catch {
      setState({ kind: "error", message: "Er ging iets mis. Probeer het later opnieuw." });
    }
  }

  if (state.kind === "success") {
    return (
      <div className="status-panel status-panel-success" role="status" data-testid="trial-signup-success">
        <h2>Controleer je e-mail</h2>
        <p>We hebben een bevestigingslink gestuurd naar <b>{contactEmail}</b>.</p>
        <p>De omgeving voor <b>{organizationName}</b> bestaat nog niet: pas zodra je op de link in die e-mail klikt, maken we deze voor je aan.</p>
        <p>Geen mail ontvangen? Controleer je spamfolder - de link is 48 uur geldig.</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <ol className="steps trial-progress" aria-label="Voortgang">
        <li className={`step ${!step1Done ? "is-current" : "is-done"}`}>
          <h3>Vereniging</h3>
          <p>Naam van je vereniging, je eigen naam en e-mailadres.</p>
        </li>
        <li className={`step ${step1Done && !step2Done ? "is-current" : step2Done ? "is-done" : ""}`}>
          <h3>Uitstraling</h3>
          <p>Kies een kleurstijl en bekijk direct een voorbeeld.</p>
        </li>
        <li className={`step ${step1Done && step2Done ? "is-current" : ""}`}>
          <h3>Bevestigen</h3>
          <p>Verifieer en verstuur je aanvraag.</p>
        </li>
      </ol>

      <label className="field">
        Naam van je vereniging
        <input required value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} maxLength={160} aria-invalid={Boolean(fieldErrors.organizationName)} />
        {fieldErrors.organizationName ? <p className="field-error">{fieldErrors.organizationName}</p> : null}
      </label>
      <label className="field">
        Jouw naam
        <input required value={contactName} onChange={(event) => setContactName(event.target.value)} maxLength={160} aria-invalid={Boolean(fieldErrors.contactName)} />
        {fieldErrors.contactName ? <p className="field-error">{fieldErrors.contactName}</p> : null}
      </label>
      <label className="field">
        E-mailadres
        <input required type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} maxLength={320} aria-invalid={Boolean(fieldErrors.contactEmail)} />
        {fieldErrors.contactEmail ? <p className="field-error">{fieldErrors.contactEmail}</p> : null}
      </label>

      <fieldset className="preset-fieldset">
        <legend className="preset-legend">Jouw uitstraling</legend>
        <div className="preset-grid" role="radiogroup" aria-label="Kleurstijl">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              role="radio"
              aria-checked={colorPresetKey === preset.key}
              className="preset-swatch"
              onClick={() => setColorPresetKey(preset.key)}
            >
              <span className="preset-dot" style={{ background: `linear-gradient(135deg, ${preset.primaryColor}, ${preset.secondaryColor})` }} aria-hidden="true" />
              {preset.label}
            </button>
          ))}
        </div>
        <p className="field-hint">Je kunt dit later altijd aanpassen in je verenigingsomgeving.</p>
        {fieldErrors.colorPresetKey ? <p className="field-error">{fieldErrors.colorPresetKey}</p> : null}

        {selectedPreset ? (
          <div className="uitstraling-preview" aria-hidden="true">
            <p className="uitstraling-preview-label">Live voorbeeld</p>
            <div className="uitstraling-preview-card">
              <p className="uitstraling-preview-name">{organizationName.trim() || "Jouw vereniging"}</p>
              <div className="uitstraling-preview-tile">
                <span className="uitstraling-preview-accent" style={{ background: `linear-gradient(135deg, ${selectedPreset.primaryColor}, ${selectedPreset.secondaryColor})` }} />
                <span>Eerstvolgende activiteit</span>
              </div>
              <span className="uitstraling-preview-btn" style={{ background: selectedPreset.accentColor || selectedPreset.primaryColor }}>Inschrijven</span>
            </div>
          </div>
        ) : null}
      </fieldset>

      {turnstileSiteKey ? (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
      ) : (
        <p className="field-error">Verificatie is niet beschikbaar. Probeer het later opnieuw.</p>
      )}

      {state.kind === "rate_limited" ? <p className="status-panel status-panel-neutral" role="alert">{state.message}</p> : null}
      {state.kind === "error" ? <p className="status-panel status-panel-error" role="alert">{state.message}</p> : null}

      <button className="btn btn-primary" type="submit" disabled={state.kind === "submitting" || !turnstileSiteKey}>
        {state.kind === "submitting" ? "Bezig…" : heroLabel}
      </button>
      <p className="field-hint">Geen creditcard nodig. Je kunt op elk moment stoppen.</p>
    </form>
  );
}
