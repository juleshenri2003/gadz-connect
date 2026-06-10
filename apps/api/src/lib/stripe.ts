import Stripe from "stripe";

const rawStripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

function isStripeKeyConfigured(key: string | undefined): key is string {
  if (!key) return false;
  if (key.includes("...")) return false;
  return key.startsWith("sk_test_") || key.startsWith("sk_live_");
}

const stripeSecretKey = isStripeKeyConfigured(rawStripeSecretKey)
  ? rawStripeSecretKey
  : undefined;

if (!stripeSecretKey) {
  console.warn(
    "[api] STRIPE_SECRET_KEY manquant ou placeholder — routes Stripe désactivées.",
  );
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" })
  : null;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_CONNECT_RETURN_URL =
  process.env.STRIPE_CONNECT_RETURN_URL ?? "http://localhost:5173/stripe/return";
export const STRIPE_CONNECT_REFRESH_URL =
  process.env.STRIPE_CONNECT_REFRESH_URL ?? "http://localhost:5173/stripe/refresh";
