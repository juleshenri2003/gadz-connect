import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCoursePaymentBreakdown,
  computeTripartiteRevenueSplit,
} from "../src/lib/billing/revenue-split.js";

describe("computeTripartiteRevenueSplit", () => {
  it("splits 40 € into 3 € platform + 37 € teacher gross", () => {
    const split = computeTripartiteRevenueSplit(40);
    assert.equal(split.totalPaidParent, 40);
    assert.equal(split.platformCommission, 3);
    assert.equal(split.teacherGrossRevenue, 37);
  });
});

describe("computeCoursePaymentBreakdown", () => {
  it("stores URSSAF on teacher base after commission", () => {
    const record = computeCoursePaymentBreakdown({
      totalPaidParent: 40,
      statusAcre: false,
      versementLiberatoire: false,
    });
    assert.equal(record.totalPaidParent, 40);
    assert.equal(record.platformCommission, 3);
    assert.equal(record.teacherGrossRevenue, 37);
    assert.equal(record.netPayout, 29.19);
  });
});
