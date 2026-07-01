import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACRE_DURATION_MONTHS,
  calculateFiscalBreakdown,
  getAcreDaysRemaining,
  getAcreEndDate,
  isAcreActive,
  resolveEffectiveAcre,
} from "@gadz-connect/types";

describe("ACRE_DURATION_MONTHS", () => {
  it("is 12 months", () => {
    assert.equal(ACRE_DURATION_MONTHS, 12);
  });
});

describe("getAcreEndDate", () => {
  it("adds 12 months to the start date", () => {
    const end = getAcreEndDate("2025-03-15");
    assert.ok(end);
    assert.equal(end!.toISOString().slice(0, 10), "2026-03-15");
  });

  it("returns null without a start date", () => {
    assert.equal(getAcreEndDate(null), null);
    assert.equal(getAcreEndDate(""), null);
    assert.equal(getAcreEndDate("not-a-date"), null);
  });
});

describe("isAcreActive", () => {
  const start = "2025-01-01";

  it("is active within the 12-month window", () => {
    assert.equal(isAcreActive(start, new Date("2025-06-01T12:00:00Z")), true);
    assert.equal(isAcreActive(start, new Date("2025-01-01T00:00:00Z")), true);
  });

  it("is inactive at or after the end date", () => {
    assert.equal(isAcreActive(start, new Date("2026-01-01T00:00:00Z")), false);
    assert.equal(isAcreActive(start, new Date("2026-05-01T00:00:00Z")), false);
  });

  it("is inactive before the start date", () => {
    assert.equal(isAcreActive(start, new Date("2024-12-31T00:00:00Z")), false);
  });

  it("is inactive without a start date", () => {
    assert.equal(isAcreActive(null), false);
  });
});

describe("getAcreDaysRemaining", () => {
  it("counts remaining days until the end", () => {
    const start = "2025-01-01";
    // End = 2026-01-01. From 2025-12-02 → 30 days.
    assert.equal(
      getAcreDaysRemaining(start, new Date("2025-12-02T00:00:00Z")),
      30,
    );
  });

  it("returns 0 when expired or missing", () => {
    assert.equal(
      getAcreDaysRemaining("2025-01-01", new Date("2026-06-01T00:00:00Z")),
      0,
    );
    assert.equal(getAcreDaysRemaining(null), 0);
  });
});

describe("resolveEffectiveAcre", () => {
  it("is false when ACRE not granted", () => {
    assert.equal(
      resolveEffectiveAcre({
        statusAcre: false,
        acreStartDate: "2025-01-01",
        referenceDate: new Date("2025-06-01T00:00:00Z"),
      }),
      false,
    );
  });

  it("applies reduced rate within the window", () => {
    assert.equal(
      resolveEffectiveAcre({
        statusAcre: true,
        acreStartDate: "2025-01-01",
        referenceDate: new Date("2025-06-01T00:00:00Z"),
      }),
      true,
    );
  });

  it("reverts to full rate once expired", () => {
    assert.equal(
      resolveEffectiveAcre({
        statusAcre: true,
        acreStartDate: "2025-01-01",
        referenceDate: new Date("2026-02-01T00:00:00Z"),
      }),
      false,
    );
  });

  it("falls back to the raw boolean when no start date (legacy profiles)", () => {
    assert.equal(
      resolveEffectiveAcre({ statusAcre: true, acreStartDate: null }),
      true,
    );
  });
});

describe("booking applies effective ACRE at the course date", () => {
  // Reproduit la logique de prepareBooking : l'ACRE effectif dépend de la
  // date du cours, pas du seul booléen status_acre.
  const statusAcre = true;
  const acreStartDate = "2025-01-01";

  function breakdownAt(courseDate: string) {
    const effectiveAcre = resolveEffectiveAcre({
      statusAcre,
      acreStartDate,
      referenceDate: new Date(courseDate),
    });
    return calculateFiscalBreakdown({
      amountGross: 40,
      statusAcre: effectiveAcre,
      versementLiberatoire: false,
    });
  }

  it("uses the reduced URSSAF rate for a course during the ACRE window", () => {
    const result = breakdownAt("2025-06-01T10:00:00Z");
    assert.equal(result.taxesUrssaf, 3.92); // 37 × 10,6 %
    assert.equal(result.netPayout, 33.08);
  });

  it("uses the full URSSAF rate for a course after ACRE expires", () => {
    const result = breakdownAt("2026-06-01T10:00:00Z");
    assert.equal(result.taxesUrssaf, 7.81); // 37 × 21,1 %
    assert.equal(result.netPayout, 29.19);
  });
});
