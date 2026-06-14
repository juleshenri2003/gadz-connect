import Stripe from "stripe";

const rawStripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

export function isStripeKeyConfigured(key: string | undefined): key is string {
  if (!key) return false;
  if (key.includes("...")) return false;
  return key.startsWith("sk_test_") || key.startsWith("sk_live_");
}

function isStripePublishableKeyConfigured(
  key: string | undefined,
): key is string {
  if (!key) return false;
  if (key.includes("...")) return false;
  return key.startsWith("pk_test_") || key.startsWith("pk_live_");
}

const stripeSecretKey = isStripeKeyConfigured(rawStripeSecretKey)
  ? rawStripeSecretKey
  : undefined;

const rawStripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
export const STRIPE_PUBLISHABLE_KEY = isStripePublishableKeyConfigured(
  rawStripePublishableKey,
)
  ? rawStripePublishableKey
  : undefined;

export const isStripeConfigured = Boolean(stripeSecretKey);

if (!stripeSecretKey) {
  console.warn(
    "[api] STRIPE_SECRET_KEY manquant ou placeholder — routes Stripe désactivées.",
  );
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" })
  : null;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";

export function isStripeWebhookConfigured(): boolean {
  const secret = STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  if (secret.includes("...")) return false;
  return secret.startsWith("whsec_");
}
export const STRIPE_CONNECT_RETURN_URL =
  process.env.STRIPE_CONNECT_RETURN_URL ?? "http://localhost:5173/stripe/return";
export const STRIPE_CONNECT_REFRESH_URL =
  process.env.STRIPE_CONNECT_REFRESH_URL ?? "http://localhost:5173/stripe/refresh";
