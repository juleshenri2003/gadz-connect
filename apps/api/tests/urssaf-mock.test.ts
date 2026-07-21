import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mockInscrireClient,
  mockConsulterDemande,
  mockPollClientStatus,
  resetUrssafMockState,
} from "../src/lib/urssaf/mock.js";

test("mock URSSAF client activation after delay", async () => {
  resetUrssafMockState();
  const profileId = "profile-test-1";
  const enrollment = mockInscrireClient({ profileId });
  assert.equal(enrollment.status, "rattachement_en_attente");

  await new Promise((r) => setTimeout(r, 5_500));
  const status = mockPollClientStatus(profileId);
  assert.equal(status, "actif");
});

test("mock URSSAF payment progresses to paye", async () => {
  resetUrssafMockState();
  const { mockDemandePaiement } = await import("../src/lib/urssaf/mock.js");
  const payment = mockDemandePaiement({ amount: 40 });
  assert.equal(payment.status, "recue");

  await new Promise((r) => setTimeout(r, 13_000));
  const final = mockConsulterDemande(payment.paymentRequestId);
  assert.equal(final.status, "paye");
});
