import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateCommissionSasu } from "@gadz-connect/types";
import { calculateFiscalBreakdown } from "../src/lib/fiscal.js";

describe("calculateCommissionSasu", () => {
  it("applies fixed 3 € commission", () => {
    assert.equal(calculateCommissionSasu(40), 3);
    assert.equal(calculateCommissionSasu(45), 3);
    assert.equal(calculateCommissionSasu(2), 2);
  });
});

describe("calculateFiscalBreakdown", () => {
  it("deducts 3 € commission then URSSAF on the remainder (40 € standard)", () => {
    const result = calculateFiscalBreakdown({
      amountGross: 40,
      statusAcre: false,
      versementLiberatoire: false,
    });
    assert.equal(result.commissionSasu, 3);
    assert.equal(result.baseAfterCommission, 37);
    assert.equal(result.taxesUrssaf, 7.81); // 37 × 21,1 %
    assert.equal(result.netPayout, 29.19); // 40 − 3 − 7,81
  });

  it("uses reduced URSSAF rate with ACRE", () => {
    const result = calculateFiscalBreakdown({
      amountGross: 40,
      statusAcre: true,
      versementLiberatoire: false,
    });
    assert.equal(result.taxesUrssaf, 3.92); // 37 × 10,6 %
    assert.equal(result.netPayout, 33.08);
  });

  it("adds versement libératoire on base after commission", () => {
    const result = calculateFiscalBreakdown({
      amountGross: 40,
      statusAcre: false,
      versementLiberatoire: true,
    });
    assert.equal(result.taxesLiberatoire, 0.81); // 37 × 2,2 %
    assert.equal(result.netPayout, 28.38); // 40 − 3 − 7,81 − 0,81
  });
});
