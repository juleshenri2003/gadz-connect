import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifySiretWithSirene } from "../src/lib/sirene-verify.js";

describe("verifySiretWithSirene", () => {
  it("rejects invalid format", async () => {
    const result = await verifySiretWithSirene("123");
    assert.equal(result.valid, false);
    assert.equal(result.skipped, false);
  });

  it("accepts valid format when API key absent", async () => {
    const prev = process.env.INSEE_API_KEY;
    delete process.env.INSEE_API_KEY;
    const result = await verifySiretWithSirene("12345678901234");
    if (prev) process.env.INSEE_API_KEY = prev;
    assert.equal(result.valid, true);
    assert.equal(result.skipped, true);
  });
});
