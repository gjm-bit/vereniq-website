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
//
// Ontvanger is bewust ONBOARDING_AUDIT_CC_EMAIL, NIET RESEND_REPLY_TO: dat
// laatste blijft uitsluitend het antwoordadres voor klantcommunicatie. Een
// deel van deze tests bewijst expliciet dat RESEND_REPLY_TO nooit als
// terugvalwaarde wordt gebruikt, ook niet als ONBOARDING_AUDIT_CC_EMAIL
// ontbreekt.

const read = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const REQUIRED_ENV = {
  RESEND_API_KEY: "test-api-key",
  RESEND_FROM_NAME: "Meer Vereniging",
  RESEND_FROM_EMAIL: "noreply@mail.meervereniging.nl",
  // Bewust een ANDER adres dan ONBOARDING_AUDIT_CC_EMAIL hieronder, zodat
  // een test die per ongeluk RESEND_REPLY_TO als ontvanger zou gebruiken
  // (i.p.v. ONBOARDING_AUDIT_CC_EMAIL) direct zichtbaar faalt.
  RESEND_REPLY_TO: "klant-antwoordadres@meervereniging.nl",
  ONBOARDING_AUDIT_CC_EMAIL: "info@meervereniging.nl",
};

async function withResendEnv(envOverrides, fn) {
  const merged = { ...REQUIRED_ENV, ...envOverrides };
  const previous = {};
  const keys = new Set([...Object.keys(REQUIRED_ENV), ...Object.keys(envOverrides)]);
  for (const key of keys) {
    previous[key] = process.env[key];
    if (key in merged) process.env[key] = merged[key];
    else delete process.env[key];
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

test("provisioning + notificatie succesvol: ontvanger komt uit ONBOARDING_AUDIT_CC_EMAIL, en notification_sent bevat message_id", async () => {
  await withResendEnv({}, async () => {
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
    assert.equal(sendCalls[0].message.to[0], REQUIRED_ENV.ONBOARDING_AUDIT_CC_EMAIL, "bestemming komt uit ONBOARDING_AUDIT_CC_EMAIL");
    assert.equal(sendCalls[0].message.replyTo, REQUIRED_ENV.ONBOARDING_AUDIT_CC_EMAIL, "ook het Reply-To-adres van de interne mail is het auditadres, niet het klant-antwoordadres");
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

test("RESEND_REPLY_TO wordt nooit als terugvalwaarde gebruikt voor de interne ontvanger", async () => {
  await withResendEnv({}, async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const { admin } = createAdminSpy();
    const sendCalls = [];
    const send = async (message, options) => {
      sendCalls.push({ message, options });
      return { data: { id: "msg_1" }, error: null };
    };

    await notifyInternalTrialSignupOutcome(admin, { type: "held_for_review", ...BASE_INPUT }, send);

    assert.equal(sendCalls.length, 1);
    assert.notEqual(sendCalls[0].message.to[0], REQUIRED_ENV.RESEND_REPLY_TO, "RESEND_REPLY_TO (het klant-antwoordadres) mag nooit de ontvanger van de interne notificatie zijn");
    assert.equal(sendCalls[0].message.to[0], REQUIRED_ENV.ONBOARDING_AUDIT_CC_EMAIL);
  });
});

test("ontbrekende ONBOARDING_AUDIT_CC_EMAIL blokkeert de hoofdflow niet: geen mailpoging, wel een non-blocking notification_failed audit-event zonder message_id-sleutel", async () => {
  await withResendEnv({ ONBOARDING_AUDIT_CC_EMAIL: undefined }, async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const { admin, inserted } = createAdminSpy();
    const sendCalls = [];
    const send = async (message, options) => {
      sendCalls.push({ message, options });
      return { data: { id: "should-never-be-called" }, error: null };
    };

    // Geen assert.rejects: het punt is juist dat dit nooit verwerpt, ongeacht
    // of de config ontbreekt - dat houdt de activatierespons onaangetast.
    await notifyInternalTrialSignupOutcome(admin, { type: "provisioned", ...BASE_INPUT, organizationId: "org-abc-123" }, send);

    assert.equal(sendCalls.length, 0, "zonder geldig ONBOARDING_AUDIT_CC_EMAIL wordt er geen mailpoging gedaan");
    assert.equal(inserted.length, 1, "er moet nog steeds een audit-event vastgelegd worden");
    assert.equal(inserted[0].row.action, "platform.trial_signup.notification_failed");
    assert.equal(inserted[0].row.outcome, "failed");
    assert.ok(!("message_id" in inserted[0].row.metadata), "de message_id-sleutel mag bij notification_failed volledig ontbreken, niet null zijn");
    assert.deepEqual(inserted[0].row.metadata, { channel: "email", notification_type: "provisioned" });
  });
});

test("held_for_review + notificatie succesvol: geen organisatie-id, wel een link naar de reviewwachtrij", async () => {
  await withResendEnv({}, async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const { admin, inserted } = createAdminSpy();
    const send = async () => ({ data: { id: "msg_review_456" }, error: null });

    await notifyInternalTrialSignupOutcome(admin, { type: "held_for_review", ...BASE_INPUT }, send);

    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].row.action, "platform.trial_signup.notification_sent");
    assert.equal(inserted[0].row.organization_id, null, "er bestaat nog geen organisatie bij held_for_review");
    assert.equal(inserted[0].row.metadata.notification_type, "held_for_review");
    assert.equal(inserted[0].row.metadata.message_id, "msg_review_456");
  });
});

test("provisioning blijft succesvol als de Resend-verzending zelf faalt: notifyInternalTrialSignupOutcome gooit nooit, notification_failed bevat geen message_id-sleutel", async () => {
  await withResendEnv({}, async () => {
    const { notifyInternalTrialSignupOutcome } = await import("../src/lib/server/trial-signup-email.ts");
    const { admin, inserted } = createAdminSpy();
    const send = async () => {
      throw new Error("Resend is tijdelijk niet bereikbaar.");
    };

    await notifyInternalTrialSignupOutcome(admin, { type: "provisioned", ...BASE_INPUT, organizationId: "org-abc-123" }, send);

    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].row.action, "platform.trial_signup.notification_failed");
    assert.equal(inserted[0].row.outcome, "failed");
    assert.ok(!("message_id" in inserted[0].row.metadata), "geen message_id-sleutel als de verzending faalde");
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

  assert.doesNotMatch(
    heldForReviewBlock,
    /try \{[\s\S]*notifyInternalTrialSignupOutcome/,
    "de held_for_review-notificatie mag niet binnen een try staan die de respons kan veranderen",
  );
});

test("audit-events voor de interne notificatie gebruiken de juiste actienamen/entity_type en bevatten nooit een e-mailadres of secret in metadata", async () => {
  await withResendEnv({}, async () => {
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
    assert.doesNotMatch(metadataText, /test-api-key/, "metadata mag nooit de Resend API-key bevatten");
  });
});
