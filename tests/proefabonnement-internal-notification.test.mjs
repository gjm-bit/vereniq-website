import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// PROEFABONNEMENT — interne notificatie naar Meer Vereniging zelf bij
// automatische provisioning en bij needs_review (naamcollisie). Dit bestand
// dekt notifyInternalTrialSignupOutcome() rechtstreeks (gedragstests, met
// geïnjecteerde send/admin-mocks - zelfde aanpak als sendViaResend se eigen
// `send?`-injectiepunt) plus een statische controle dat beide aanroeppunten
// in activeren/route.ts zo zijn gewrapt dat een mislukte notificatie de
// respons nooit kan raken.

const read = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const REQUIRED_ENV = {
  RESEND_API_KEY: "test-api-key",
  RESEND_FROM_NAME: "Meer Vereniging",
  RESEND_FROM_EMAIL: "noreply@mail.meervereniging.nl",
  RESEND_REPLY_TO: "info@meervereniging.nl",
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

function createAdminSpy(insertResult = { error: null }) {
  const inserted = [];
  const admin = {
    from(table) {
      return {
        insert(row) {
          inserted.push({ table, row });
          return Promise.resolve(insertResult);
        },
      };
    },
  };
  return { admin, inserted };
}

const BASE_INPUT = {
  signupId: "399a3ac7-1a43-4e23-8ee9-c5b3ee1ff052",
  organizationName: "Meer Vereniging Test 14",
  contactName: "Testbeheerder Test 14",
  contactEmail: "112@meervereniging.nl",
  occurredAt: new Date("2026-09-09T07:03:10.840Z"),
};

test("provisioning + notificatie succesvol: verstuurt de interne mail en legt een notification_sent audit-event vast", async () => {
  await withResendEnv(async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const { admin, inserted } = createAdminSpy();
    const sendCalls = [];
    const send = async (message, options) => {
      sendCalls.push({ message, options });
      return { data: { id: "msg_provisioned_123" }, error: null };
    };

    await notifyInternalTrialSignupOutcome(
      admin,
      { type: "provisioned", ...BASE_INPUT, organizationId: "org-abc-123" },
      send,
    );

    assert.equal(sendCalls.length, 1, "de Resend-transport moet exact één keer aangeroepen worden");
    assert.equal(sendCalls[0].message.to.length, 1);
    assert.equal(sendCalls[0].message.to[0], REQUIRED_ENV.RESEND_REPLY_TO, "bestemming is het bestaande interne auditadres uit RESEND_REPLY_TO");
    assert.match(sendCalls[0].message.subject, /^Nieuw proefabonnement gestart – Meer Vereniging Test 14$/);
    assert.match(sendCalls[0].message.text, /Organisatie: Meer Vereniging Test 14/);
    assert.match(sendCalls[0].message.text, /Aanvrager: Testbeheerder Test 14/);
    assert.match(sendCalls[0].message.text, /E-mailadres: 112@meervereniging\.nl/);
    assert.match(sendCalls[0].message.text, /beheer\.meervereniging\.nl\/organizations\/org-abc-123/, "bevat een directe link naar de organisatie in Master Beheer");

    assert.equal(inserted.length, 1, "er moet exact één audit_events-rij worden ingevoegd");
    assert.equal(inserted[0].table, "audit_events");
    assert.equal(inserted[0].row.action, "platform.trial_signup.notification_sent");
    assert.equal(inserted[0].row.outcome, "succeeded");
    assert.equal(inserted[0].row.entity_type, "public_trial_signups");
    assert.equal(inserted[0].row.entity_id, BASE_INPUT.signupId);
    assert.equal(inserted[0].row.organization_id, "org-abc-123");
    assert.deepEqual(inserted[0].row.metadata, { channel: "email", notification_type: "provisioned", message_id: "msg_provisioned_123" });
  });
});

test("held_for_review + notificatie succesvol: verstuurt de interne mail (zonder organisatie-id) met een link naar de reviewwachtrij", async () => {
  await withResendEnv(async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const { admin, inserted } = createAdminSpy();
    const sendCalls = [];
    const send = async (message, options) => {
      sendCalls.push({ message, options });
      return { data: { id: "msg_review_456" }, error: null };
    };

    await notifyInternalTrialSignupOutcome(admin, { type: "held_for_review", ...BASE_INPUT }, send);

    assert.equal(sendCalls.length, 1);
    assert.match(sendCalls[0].message.subject, /^Proefaanvraag wacht op beoordeling – Meer Vereniging Test 14$/);
    assert.match(sendCalls[0].message.text, /Reden: mogelijke overeenkomst met een bestaande organisatie\./);
    assert.match(sendCalls[0].message.text, /beheer\.meervereniging\.nl\/organizations\/review/, "bevat een directe link naar de bestaande reviewwachtrij");

    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].row.action, "platform.trial_signup.notification_sent");
    assert.equal(inserted[0].row.outcome, "succeeded");
    assert.equal(inserted[0].row.organization_id, null, "er bestaat nog geen organisatie bij held_for_review");
    assert.equal(inserted[0].row.metadata.notification_type, "held_for_review");
  });
});

test("provisioning blijft succesvol als de notificatiemail faalt: notifyInternalTrialSignupOutcome gooit nooit, en legt notification_failed vast", async () => {
  await withResendEnv(async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const { admin, inserted } = createAdminSpy();
    const send = async () => {
      throw new Error("Resend is tijdelijk niet bereikbaar.");
    };

    // Geen assert.rejects: het punt is juist dat dit NOOIT verwerpt, ongeacht
    // hoe de mailtransport faalt - dat is exact wat de provisioning-/
    // activatierespons in activeren/route.ts onaangetast houdt.
    await notifyInternalTrialSignupOutcome(admin, { type: "provisioned", ...BASE_INPUT, organizationId: "org-abc-123" }, send);

    assert.equal(inserted.length, 1, "een mislukte mail moet nog steeds een audit-event opleveren");
    assert.equal(inserted[0].row.action, "platform.trial_signup.notification_failed");
    assert.equal(inserted[0].row.outcome, "failed");
    assert.equal(inserted[0].row.metadata.message_id, null, "geen message-id beschikbaar als de verzending faalde");
  });
});

test("reviewstatus blijft correct als de notificatiemail faalt: beide aanroeppunten in activeren/route.ts zijn expliciet non-blocking gewrapt", async () => {
  const route = await read("app/api/proefabonnement/activeren/route.ts");

  const heldForReviewBlock = route.slice(route.indexOf("if (activatedRow.needs_review)"), route.indexOf("const { organization_id: organizationId"));
  assert.match(
    heldForReviewBlock,
    /notifyInternalTrialSignupOutcome\(admin, \{\s*type: 'held_for_review'[\s\S]*?\}\)\.catch\(\(\) => undefined\);\s*\n\s*return json\(\{ success: true, status: 'held_for_review'/,
    "de held_for_review-notificatie moet .catch()-gewrapt zijn en direct gevolgd worden door de onvoorwaardelijke succesrespons",
  );

  const provisionedBlock = route.slice(route.indexOf("let emailSent = true;"));
  assert.match(
    provisionedBlock,
    /notifyInternalTrialSignupOutcome\(admin, \{\s*type: 'provisioned'[\s\S]*?\}\)\.catch\(\(\) => undefined\);\s*\n\s*return json\(\{ success: true, status: 'activated', organizationName, emailSent \}\);/,
    "de provisioned-notificatie moet .catch()-gewrapt zijn en direct gevolgd worden door de onvoorwaardelijke activatierespons (emailSent blijft ongewijzigd door de klantmail-uitkomst hierboven)",
  );

  // De notificatieaanroep zelf mag nergens binnen een try-blok staan dat de
  // respons zou kunnen laten falen - beide aanroepen staan als toplevel
  // await-statements, buiten enige try/catch die de uitkomst beïnvloedt.
  assert.doesNotMatch(
    heldForReviewBlock,
    /try \{[\s\S]*notifyInternalTrialSignupOutcome/,
    "de held_for_review-notificatie mag niet binnen een try staan die de respons kan veranderen",
  );
});

test("audit-events voor de interne notificatie gebruiken de juiste actienamen/entity_type en bevatten nooit een e-mailadres in metadata", async () => {
  await withResendEnv(async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const { admin, inserted } = createAdminSpy();
    const send = async () => ({ data: { id: "msg_789" }, error: null });

    await notifyInternalTrialSignupOutcome(admin, { type: "provisioned", ...BASE_INPUT, organizationId: "org-abc-123" }, send);

    assert.equal(inserted[0].row.entity_type, "public_trial_signups");
    assert.ok(
      ["platform.trial_signup.notification_sent", "platform.trial_signup.notification_failed"].includes(inserted[0].row.action),
      "actienaam moet exact één van de twee gedocumenteerde waarden zijn",
    );
    const metadataText = JSON.stringify(inserted[0].row.metadata);
    assert.doesNotMatch(metadataText, /@/, "metadata mag nooit een e-mailadres bevatten");
  });
});
