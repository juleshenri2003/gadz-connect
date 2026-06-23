import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getBillingPeriodBounds,
  getPreviousBillingPeriod,
  isScheduledInPeriod,
} from "../src/lib/billing/billing-period.js";

describe("getPreviousBillingPeriod", () => {
  it("returns previous calendar month", () => {
    const period = getPreviousBillingPeriod(new Date("2026-06-14T12:00:00Z"));
    assert.equal(period, "2026-05");
  });
});

describe("isScheduledInPeriod", () => {
  it("matches course in May 2026", () => {
    const bounds = getBillingPeriodBounds("2026-05");
    assert.equal(
      isScheduledInPeriod("2026-05-15T14:00:00.000Z", bounds),
      true,
    );
    assert.equal(
      isScheduledInPeriod("2026-06-01T00:00:00.000Z", bounds),
      false,
    );
  });
});
