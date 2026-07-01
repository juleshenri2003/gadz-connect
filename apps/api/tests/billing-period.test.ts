import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getBillingPeriodBounds,
  getPreviousBillingPeriod,
  isInBillingPeriod,
  isScheduledInPeriod,
} from "../src/lib/billing/billing-period.js";
import { formatMonthlySummaryNumber } from "../src/lib/billing/format.js";

describe("formatMonthlySummaryNumber", () => {
  it("formats provider summary numbers", () => {
    assert.equal(
      formatMonthlySummaryNumber("RELEVE-PROF", "202606", 1),
      "GC-RELEVE-PROF-202606-0001",
    );
  });
});

describe("getPreviousBillingPeriod", () => {
  it("returns previous calendar month", () => {
    const period = getPreviousBillingPeriod(new Date("2026-06-14T12:00:00Z"));
    assert.equal(period, "2026-05");
  });
});

describe("isInBillingPeriod", () => {
  it("utilise la date du cours quand elle est connue", () => {
    const bounds = getBillingPeriodBounds("2026-06");
    assert.equal(
      isInBillingPeriod("2026-06-15T10:00:00.000Z", "2026-07-01T10:00:00.000Z", bounds),
      true,
    );
    assert.equal(
      isInBillingPeriod("2026-07-03T10:00:00.000Z", "2026-06-23T10:00:00.000Z", bounds),
      false,
    );
  });

  it("retombe sur la date de facture sans date de cours", () => {
    const bounds = getBillingPeriodBounds("2026-06");
    assert.equal(isInBillingPeriod(null, "2026-06-23T10:00:00.000Z", bounds), true);
    assert.equal(isInBillingPeriod(null, "2026-07-01T10:00:00.000Z", bounds), false);
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
