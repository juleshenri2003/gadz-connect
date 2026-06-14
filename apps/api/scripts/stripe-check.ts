#!/usr/bin/env tsx
/**
 * Vérifie la configuration Stripe locale et affiche les étapes manquantes.
 *
 * Usage : pnpm --filter @gadz-connect/api stripe-check
 */
import "dotenv/config";
import Stripe from "stripe";

const CHECKS = [
  {
    key: "STRIPE_SECRET_KEY",
    label: "Clé secrète API (sk_test_…)",
    validate: (v: string) =>
      (v.startsWith("sk_test_") || v.startsWith("sk_live_")) &&
      !v.includes("..."),
    hint: "Dashboard Stripe → Developers → API keys → Secret key",
  },
  {
    key: "STRIPE_PUBLISHABLE_KEY",
    label: "Clé publique (pk_test_…)",
    validate: (v: string) =>
      (v.startsWith("pk_test_") || v.startsWith("pk_live_")) &&
      !v.includes("..."),
    hint: "Dashboard Stripe → Developers → API keys → Publishable key",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    label: "Secret webhook (whsec_…)",
    validate: (v: string) => v.startsWith("whsec_") && !v.includes("..."),
    hint: "stripe listen --forward-to localhost:3001/api/webhooks/stripe",
  },
  {
    key: "STRIPE_CONNECT_RETURN_URL",
    label: "URL retour Connect",
    validate: (v: string) => v.startsWith("http"),
    hint: "http://localhost:5173/stripe/return",
  },
  {
    key: "STRIPE_CONNECT_REFRESH_URL",
    label: "URL refresh Connect",
    validate: (v: string) => v.startsWith("http"),
    hint: "http://localhost:5173/stripe/refresh",
  },
] as const;

function main() {
  console.log("=== Gadz'Connect — vérification Stripe ===\n");

  let allOk = true;

  for (const check of CHECKS) {
    const value = process.env[check.key]?.trim() ?? "";
    const ok = value.length > 0 && check.validate(value);
    const status = ok ? "✓" : "✗";
    console.log(`${status} ${check.key}`);
    console.log(`  ${check.label}`);
    if (!ok) {
      allOk = false;
      console.log(`  → ${check.hint}`);
    }
    console.log();
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (
    secretKey &&
    (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_")) &&
    !secretKey.includes("...")
  ) {
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    stripe.balance
      .retrieve()
      .then(() => {
        console.log("✓ Connexion API Stripe OK (balance.retrieve)");
        finish(allOk);
      })
      .catch((err: Error) => {
        console.error("✗ Connexion API Stripe échouée:", err.message);
        finish(false);
      });
  } else {
    finish(allOk);
  }
}

function finish(ok: boolean) {
  console.log();
  if (ok) {
    console.log("Stripe est prêt. Prochaines étapes :");
    console.log("  1. stripe listen --forward-to localhost:3001/api/webhooks/stripe");
    console.log("  2. Redémarrer l'API");
    console.log("  3. Prof actif → /app/paiements → Configurer Stripe Connect");
    console.log("  4. Élève → réserver un créneau (paiement carte si Stripe actif)");
  } else {
    console.log("Configuration incomplète — voir docs/STRIPE_SETUP.md");
    process.exit(1);
  }
}

main();
