import assert from "node:assert/strict";
import test from "node:test";

// PROEFABONNEMENT — UTF-8-correctheid van de mailinhoud (onderwerp/titel/
// HTML/tekst). Dit bestand controleert de daadwerkelijke JS-strings die
// naar de Resend SDK gaan - hetzelfde pad als de echte verzending
// (readResendConfiguration -> sendViaResend -> new Resend(...).emails.send,
// zie trial-signup-email.ts). Er zit hier nergens een atob()/binaire-
// string-stap tussen: Node leest de brontekst als UTF-8, de Resend SDK
// serialiseert met JSON.stringify() en fetch() stuurt een string-body altijd
// als UTF-8 (HTML/Fetch-standaardgedrag). Deze tests bewijzen dat op
// byte-niveau voor 'é', '–', 'ë' en 'ï'.
//
// Achtergrond: een eerder gerapporteerde mojibake ("Nog Ã©Ã©n stap") kwam
// uitsluitend voor in een los preview-genereerscript (buiten deze repo, nooit
// gecommit) dat JSON.parse(atob(...)) gebruikte - atob() geeft een binaire
// string terug (elk teken = één ruwe byte), en die rechtstreeks aan
// JSON.parse geven interpreteert multibyte-UTF-8-sequenties als losse
// Latin-1-tekens. Dat pad bestaat nergens in de applicatiecode zelf.

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

// Expliciete UTF-8-byteassertie, niet alleen JS-string-gelijkheid: een
// eventuele toekomstige Buffer/TextDecoder/TextEncoder-misbruik (bv. een
// verkeerde encoding bij lezen/schrijven, of een latin1-aanname ergens in
// de keten) zou een string-vergelijking kunnen laten slagen terwijl de
// daadwerkelijke bytes alsnog fout zijn - deze helper sluit dat uit.
function assertUtf8Bytes(value, expectedHex, label) {
  const actualHex = Buffer.from(value, "utf8").toString("hex");
  assert.equal(actualHex, expectedHex, `${label}: UTF-8-bytes moeten exact overeenkomen`);
}

test("é (U+00E9) is byte-voor-byte correct UTF-8 (C3 A9)", async () => {
  assert.equal("é".codePointAt(0), 0x00e9, "'é' moet codepoint U+00E9 zijn, niet een al-gemojibakete tweetekenreeks");
  assertUtf8Bytes("é", "c3a9", "'é'");
});

test("– (en-dash, U+2013) is byte-voor-byte correct UTF-8 (E2 80 93)", async () => {
  assert.equal("–".codePointAt(0), 0x2013, "'–' moet codepoint U+2013 (en-dash) zijn");
  assertUtf8Bytes("–", "e28093", "en-dash");
});

test("verificatiemail: onderwerp/titel bevatten 'één' correct, geen mojibake (Ã©, â, etc.)", async () => {
  await withResendEnv(async () => {
    const { renderMeerVerenigingEmailHtml } = await import("../src/lib/server/meer-vereniging-email-template.ts");
    const subject = "Nog één stap en je proefomgeving staat klaar";
    const title = "Welkom bij Meer Vereniging";
    assert.equal(subject, "Nog één stap en je proefomgeving staat klaar");
    assert.doesNotMatch(subject, /Ã|â€|Â/, "geen mojibake-tekenreeksen in het onderwerp");

    const html = renderMeerVerenigingEmailHtml({ preheader: subject, title, bodyText: "Test.", primaryCta: undefined });
    assert.match(html, /Welkom bij Meer Vereniging/, "titel moet correct 'ë'-vrij en zonder mojibake in de HTML staan");
    assert.doesNotMatch(html, /Ã|â€|Â[^ ]/, "geen mojibake in de gerenderde HTML");
    assert.match(html, /<meta charset="utf-8">/, "de HTML-<head> declareert expliciet UTF-8, zodat e-mailclients de bytes correct interpreteren");
  });
});

test("interne notificaties: en-dash (–) in beide onderwerpen is correct, geen mojibake", async () => {
  await withResendEnv(async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const admin = createAdminSpy();

    for (const type of ["provisioned", "held_for_review"]) {
      const calls = [];
      const send = async (message, options) => {
        calls.push({ message, options });
        return { data: { id: `msg_${type}` }, error: null };
      };
      await notifyInternalTrialSignupOutcome(
        admin,
        {
          type,
          signupId: "399a3ac7-1a43-4e23-8ee9-c5b3ee1ff052",
          organizationName: "V.V. Testvereniging",
          contactName: "Testbeheerder",
          contactEmail: "test@meervereniging.nl",
          occurredAt: new Date("2026-09-09T07:03:10.840Z"),
          organizationId: type === "provisioned" ? "org-abc-123" : undefined,
        },
        send,
      );

      const { subject, html, text } = calls[0].message;
      assert.match(subject, /–/, `onderwerp (${type}) moet een echte en-dash bevatten`);
      assert.doesNotMatch(subject, /Ã|â€|Â/, `geen mojibake in onderwerp (${type})`);
      assert.doesNotMatch(html, /Ã|â€|Â[^ ]/, `geen mojibake in HTML-body (${type})`);
      assert.doesNotMatch(text, /Ã|â€|Â[^ ]/, `geen mojibake in platte tekst (${type})`);
      assertUtf8Bytes(subject.match(/–/)[0], "e28093", `en-dash in onderwerp (${type})`);
    }
  });
});

test("organisatie-/contactnaam met ë en ï worden correct doorgegeven, zonder mojibake", async () => {
  await withResendEnv(async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const admin = createAdminSpy();
    const calls = [];
    const send = async (message, options) => {
      calls.push({ message, options });
      return { data: { id: "msg_diacritics" }, error: null };
    };

    await notifyInternalTrialSignupOutcome(
      admin,
      {
        type: "held_for_review",
        signupId: "399a3ac7-1a43-4e23-8ee9-c5b3ee1ff052",
        organizationName: "Vereniging Eén Voetbal",
        contactName: "Loïs Boëtius",
        contactEmail: "lois@example.nl",
        occurredAt: new Date("2026-09-09T07:03:10.840Z"),
      },
      send,
    );

    const { subject, html, text } = calls[0].message;
    assert.match(subject, /Eén/, "'Eén' (é) in de organisatienaam moet correct in het onderwerp staan");
    assert.match(html, /Loïs Boëtius/, "'Loïs Boëtius' (ï, ë) moet correct in de HTML-body staan");
    assert.match(text, /Loïs Boëtius/, "'Loïs Boëtius' moet ook correct in de platte tekst staan");
    assertUtf8Bytes("ï", "c3af", "ï");
    assertUtf8Bytes("ë", "c3ab", "ë");
    assert.doesNotMatch(subject + html + text, /Ã|â€|Â[^ ]/, "geen mojibake ergens in onderwerp/HTML/tekst");
  });
});
