import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeDuplicateSirets } from "../src/lib/admin-profiles-query.js";

describe("computeDuplicateSirets", () => {
  it("returns sirets shared by more than one profile", () => {
    const duplicates = computeDuplicateSirets([
      { siret: "12345678901234" },
      { siret: "12345678901234" },
      { siret: "99999999999999" },
      { siret: null },
    ]);

    assert.equal(duplicates.has("12345678901234"), true);
    assert.equal(duplicates.has("99999999999999"), false);
  });
});
