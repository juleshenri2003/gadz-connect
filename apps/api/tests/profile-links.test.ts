import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getProfileLinkLabel,
  normalizeProfileLinks,
  profileLinksSchema,
} from "../src/lib/profile-links.js";

describe("profileLinksSchema", () => {
  it("accepts known link kinds", () => {
    const parsed = profileLinksSchema.parse([
      { kind: "linkedin", url: "https://linkedin.com/in/claire" },
      { kind: "google_scholar", url: "https://scholar.google.com/citations?user=abc" },
      { kind: "website", url: "https://example.com" },
      { kind: "other", url: "https://portfolio.dev", label: "Portfolio" },
    ]);
    assert.equal(parsed.length, 4);
  });

  it("rejects other without label", () => {
    const result = profileLinksSchema.safeParse([
      { kind: "other", url: "https://example.com" },
    ]);
    assert.equal(result.success, false);
  });

  it("rejects javascript URLs", () => {
    const result = profileLinksSchema.safeParse([
      { kind: "website", url: "javascript:alert(1)" },
    ]);
    assert.equal(result.success, false);
  });
});

describe("normalizeProfileLinks", () => {
  it("returns empty array for invalid input", () => {
    assert.deepEqual(normalizeProfileLinks({}), []);
    assert.deepEqual(normalizeProfileLinks(null), []);
  });

  it("normalizes valid links", () => {
    const links = normalizeProfileLinks([
      { kind: "linkedin", url: "https://linkedin.com/in/test/" },
    ]);
    assert.equal(links.length, 1);
    assert.equal(links[0]?.kind, "linkedin");
  });
});

describe("getProfileLinkLabel", () => {
  it("returns French labels", () => {
    assert.equal(
      getProfileLinkLabel({ kind: "google_scholar", url: "https://scholar.google.com" }),
      "Google Scholar",
    );
    assert.equal(
      getProfileLinkLabel({
        kind: "other",
        url: "https://x.dev",
        label: "Portfolio",
      }),
      "Portfolio",
    );
  });
});
