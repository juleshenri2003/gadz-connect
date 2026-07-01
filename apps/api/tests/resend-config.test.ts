import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  isDevRedirectedEmail,
  resolveEmailRecipient,
} from "../src/lib/email/resend-config.js";

describe("resolveEmailRecipient (dev)", () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    process.env.RESEND_DEV_INBOX = "juleshenri2003@gmail.com";
    delete process.env.RESEND_DEV_ALLOWLIST;
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it("redirige les comptes fictifs @ensam.eu", () => {
    const result = resolveEmailRecipient("prof.dev@ensam.eu");
    assert.equal(result.to, "juleshenri2003@gmail.com");
    assert.equal(result.redirected, true);
  });

  it("laisse passer un Gmail réel de test prof", () => {
    const result = resolveEmailRecipient("alexandreandre2004@gmail.com");
    assert.equal(result.to, "alexandreandre2004@gmail.com");
    assert.equal(result.redirected, false);
  });

  it("respecte RESEND_DEV_ALLOWLIST pour forcer l'envoi direct", () => {
    process.env.RESEND_DEV_ALLOWLIST = "prof.dev@ensam.eu";
    const result = resolveEmailRecipient("prof.dev@ensam.eu");
    assert.equal(result.to, "prof.dev@ensam.eu");
    assert.equal(result.redirected, false);
  });
});

describe("isDevRedirectedEmail", () => {
  it("identifie les adresses Ensam comme fictives", () => {
    assert.equal(isDevRedirectedEmail("eleve.dupont@ensam.eu"), true);
    assert.equal(isDevRedirectedEmail("alexandreandre2004@gmail.com"), false);
  });
});
