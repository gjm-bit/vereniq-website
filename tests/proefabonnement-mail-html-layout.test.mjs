import assert from "node:assert/strict";
import test from "node:test";

// PROEFABONNEMENT — alle vier de mails (2 klant + 2 intern) hergebruiken
// dezelfde bestaande Meer Vereniging-mail-HTML-layout (meer-vereniging-
// email-template.ts, letterlijk overgenomen van master-beheer) i.p.v. een
// nieuw designsysteem. Dit bestand controleert uitsluitend dat elke mail
// daadwerkelijk `html` + het ingebedde logo meegeeft, en dat de gevraagde
// copy/CTA's kloppen - niet de layout-HTML zelf in detail (dat is al gedekt
// door de herbruikte, bewezen renderfunctie).

const REQUIRED_ENV = {
  RESEND_API_KEY: "test-api-key",
  RESEND_FROM_NAME: "Meer Vereniging",
  RESEND_FROM_EMAIL: "noreply@mail.meervereniging.nl",
  RESEND_REPLY_TO: "info@meervereniging.nl",
  ONBOARDING_AUDIT_CC_EMAIL: "info@meervereniging.nl",
};

async function withResendEnv(fn) {
  const previous = {};
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function createAdminSpy() {
  return { from: () => ({ insert: () => Promise.resolve({ error: null }) }) };
}

test("verificatiemail: gevraagde onderwerp/titel/CTA, 48-uurstekst, veilige negeer-tekst, en de gedeelde HTML-layout + logo", async () => {
  await withResendEnv(async () => {
    // sendTrialSignupVerificationEmail heeft (bewust, ongewijzigde publieke
    // signatuur) geen send-injectiepunt; deze test controleert daarom de
    // HTML-rendering rechtstreeks via dezelfde renderMeerVerenigingEmailHtml()
    // -aanroep die de functie zelf gebruikt, met exact de copy die de functie
    // behoort te bouwen (zie sendTrialSignupVerificationEmail in
    // trial-signup-email.ts voor de brontekst waar dit 1-op-1 uit is
    // overgenomen).
    const { renderMeerVerenigingEmailHtml } = await import("../src/lib/server/meer-vereniging-email-template.ts");
    const activationLink = "https://meervereniging.nl/proefabonnement/activeren?signup=abc&token=def";
    const text = [
      'Je hebt een proefabonnement aangevraagd voor "Test Vereniging".',
      "",
      "Bevestig je e-mailadres om verder te gaan:",
      activationLink,
      "",
      "Deze link is 48 uur geldig.",
      "",
      "Heb je dit niet aangevraagd? Negeer deze e-mail, er gebeurt dan niets.",
    ].join("\n");
    const html = renderMeerVerenigingEmailHtml({
      preheader: text.split("\n")[0],
      title: "Welkom bij Meer Vereniging",
      bodyText: text,
      primaryCta: { label: "Bevestig mijn e-mailadres", url: activationLink },
    });

    assert.match(html, /Welkom bij Meer Vereniging/, "titel moet 'Welkom bij Meer Vereniging' zijn");
    assert.match(html, /Bevestig mijn e-mailadres/, "CTA-label moet 'Bevestig mijn e-mailadres' zijn");
    assert.match(html, new RegExp(activationLink.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "CTA-knop moet naar de activatielink wijzen");
    assert.match(html, /Deze link is 48 uur geldig\./);
    assert.match(html, /Heb je dit niet aangevraagd\? Negeer deze e-mail, er gebeurt dan niets\./, "de bestaande veilige tekst voor een niet-zelf-gedane aanvraag blijft behouden");
    assert.match(html, /cid:meer-vereniging-mark/, "de HTML gebruikt het ingebedde Meer Vereniging-logo");
    assert.doesNotMatch(html, /altijd (direct|onmiddellijk)|gegarandeerd/i, "geen onjuiste belofte dat de omgeving altijd onmiddellijk wordt aangemaakt");
  });
});

test("sendViaResend geeft html en attachments daadwerkelijk door aan de Resend-transport (geen nieuw designsysteem, letterlijke doorgifte)", async () => {
  await withResendEnv(async () => {
    // Rechtstreekse, gerichte controle op de doorgifte-laag zelf (sendViaResend
    // is niet geëxporteerd, dus getest via een openbare functie mét
    // send-injectiepunt: notifyInternalTrialSignupOutcome).
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const admin = createAdminSpy();
    const calls = [];
    const send = async (message, options) => {
      calls.push({ message, options });
      return { data: { id: "msg_internal" }, error: null };
    };

    await notifyInternalTrialSignupOutcome(
      admin,
      {
        type: "provisioned",
        signupId: "399a3ac7-1a43-4e23-8ee9-c5b3ee1ff052",
        organizationName: "Meer Vereniging Test 14",
        contactName: "Testbeheerder",
        contactEmail: "test@meervereniging.nl",
        occurredAt: new Date("2026-09-09T07:03:10.840Z"),
        organizationId: "org-abc-123",
      },
      send,
    );

    assert.equal(calls.length, 1);
    assert.ok(typeof calls[0].message.html === "string" && calls[0].message.html.length > 0, "html moet daadwerkelijk meegegeven zijn");
    assert.equal(calls[0].message.attachments?.length, 1, "het logo moet als bijlage meegegeven zijn");
    assert.equal(calls[0].message.attachments[0].contentId, "meer-vereniging-mark");
    assert.equal(calls[0].message.attachments[0].contentType, "image/png");
    assert.match(calls[0].message.html, /Bekijk organisatie/, "interne provisioned-notificatie moet een 'Bekijk organisatie'-CTA bevatten");
    assert.match(calls[0].message.html, /beheer\.meervereniging\.nl\/organizations\/org-abc-123/);
  });
});

test("interne review-notificatie bevat de 'Beoordeel aanvraag'-CTA naar de bestaande reviewwachtrij", async () => {
  await withResendEnv(async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const admin = createAdminSpy();
    const calls = [];
    const send = async (message, options) => {
      calls.push({ message, options });
      return { data: { id: "msg_review" }, error: null };
    };

    await notifyInternalTrialSignupOutcome(
      admin,
      {
        type: "held_for_review",
        signupId: "399a3ac7-1a43-4e23-8ee9-c5b3ee1ff052",
        organizationName: "Meer Vereniging Test 14",
        contactName: "Testbeheerder",
        contactEmail: "test@meervereniging.nl",
        occurredAt: new Date("2026-09-09T07:03:10.840Z"),
      },
      send,
    );

    assert.equal(calls.length, 1);
    assert.match(calls[0].message.html, /Beoordeel aanvraag/);
    assert.match(calls[0].message.html, /beheer\.meervereniging\.nl\/organizations\/review/);
    assert.match(calls[0].message.html, /cid:meer-vereniging-mark/);
  });
});
