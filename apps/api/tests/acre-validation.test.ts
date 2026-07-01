import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { acreUpdateSchema } from "../src/lib/acre-validation.js";

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

describe("PATCH /api/profile/acre validation (acreUpdateSchema)", () => {
  it("accepts granting ACRE with a recent start date", () => {
    const parsed = acreUpdateSchema.safeParse({
      statusAcre: true,
      acreStartDate: isoDaysFromNow(-30),
    });
    assert.equal(parsed.success, true);
  });

  it("accepts disabling ACRE without a date", () => {
    const parsed = acreUpdateSchema.safeParse({ statusAcre: false });
    assert.equal(parsed.success, true);
  });

  it("rejects granting ACRE without a start date", () => {
    const parsed = acreUpdateSchema.safeParse({ statusAcre: true });
    assert.equal(parsed.success, false);
  });

  it("rejects a future start date beyond tolerance", () => {
    const parsed = acreUpdateSchema.safeParse({
      statusAcre: true,
      acreStartDate: isoDaysFromNow(30),
    });
    assert.equal(parsed.success, false);
  });

  it("rejects a malformed date", () => {
    const parsed = acreUpdateSchema.safeParse({
      statusAcre: true,
      acreStartDate: "15/03/2025",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects a start date older than 3 years", () => {
    const parsed = acreUpdateSchema.safeParse({
      statusAcre: true,
      acreStartDate: isoDaysFromNow(-3 * 365 - 60),
    });
    assert.equal(parsed.success, false);
  });
});
