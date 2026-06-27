import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSubject } from "../src/lib/email/send-stripe-onboarding-email.js";

describe("send-stripe-onboarding-email", () => {
  it("buildSubject différencie bienvenue et rappel", () => {
    assert.match(buildSubject("welcome"), /dernière étape/i);
    assert.match(buildSubject("reminder"), /Rappel/i);
  });
});

describe("resend-config", () => {
  it("getAppBaseUrl préfère GADZ_APP_URL", async () => {
    const prevApp = process.env.GADZ_APP_URL;
    const prevCors = process.env.CORS_ORIGIN;
    process.env.GADZ_APP_URL = "https://app.gadzconnect.fr";
    process.env.CORS_ORIGIN = "http://localhost:5173";

    const { getAppBaseUrl } = await import("../src/lib/email/resend-config.js");
    assert.equal(getAppBaseUrl(), "https://app.gadzconnect.fr");

    process.env.GADZ_APP_URL = prevApp;
    process.env.CORS_ORIGIN = prevCors;
  });
});
