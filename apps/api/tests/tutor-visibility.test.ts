import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeMarketplaceStatus,
  isCvComplete,
  isTeacherVisibleInMarketplace,
} from "../src/lib/tutor-visibility.js";

describe("isTeacherVisibleInMarketplace", () => {
  const base = {
    role: "teacher",
    account_status: "active",
    profile_setup_complete: true,
    stripe_connect_onboarding_complete: true,
    hourly_rate: 35,
    siret: "73282932000074",
    is_autoentrepreneur_verified: true,
  };

  it("returns true when all criteria met", () => {
    assert.equal(isTeacherVisibleInMarketplace(base), true);
  });

  it("returns false without Stripe onboarding", () => {
    assert.equal(
      isTeacherVisibleInMarketplace({
        ...base,
        stripe_connect_onboarding_complete: false,
      }),
      false,
    );
  });

  it("returns false without hourly rate", () => {
    assert.equal(
      isTeacherVisibleInMarketplace({ ...base, hourly_rate: null }),
      false,
    );
  });

  it("returns false when pending_siret", () => {
    assert.equal(
      isTeacherVisibleInMarketplace({ ...base, account_status: "pending_siret" }),
      false,
    );
  });
});

describe("computeMarketplaceStatus", () => {
  const baseProfile = {
    role: "teacher",
    account_status: "active",
    profile_setup_complete: true,
    stripe_connect_onboarding_complete: true,
    hourly_rate: 40,
    siret: "73282932000074",
    is_autoentrepreneur_verified: true,
  };

  it("returns visible when all checks pass", () => {
    const status = computeMarketplaceStatus(baseProfile, 2);
    assert.equal(status.visible, true);
    assert.equal(status.checks.futureSlots, true);
  });

  it("returns not visible without future slots", () => {
    const status = computeMarketplaceStatus(baseProfile, 0);
    assert.equal(status.visible, false);
    assert.equal(status.checks.futureSlots, false);
  });

  it("returns not visible without stripe", () => {
    const status = computeMarketplaceStatus(
      { ...baseProfile, stripe_connect_onboarding_complete: false },
      1,
    );
    assert.equal(status.checks.stripe, false);
    assert.equal(status.visible, false);
  });
});

describe("isCvComplete", () => {
  it("returns true with pdf", () => {
    assert.equal(isCvComplete({ cv: null, cv_pdf_path: "user/cv.pdf" }), true);
  });

  it("returns true with text >= 50 chars", () => {
    assert.equal(isCvComplete({ cv: "a".repeat(50), cv_pdf_path: null }), true);
  });

  it("returns false with short text and no pdf", () => {
    assert.equal(isCvComplete({ cv: "court", cv_pdf_path: null }), false);
  });
});
