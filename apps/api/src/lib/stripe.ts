import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("[api] STRIPE_SECRET_KEY manquant — routes Stripe désactivées.");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-11-20.acacia" })
  : null;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_CONNECT_RETURN_URL =
  process.env.STRIPE_CONNECT_RETURN_URL ?? "http://localhost:5173/stripe/return";
export const STRIPE_CONNECT_REFRESH_URL =
  process.env.STRIPE_CONNECT_REFRESH_URL ?? "http://localhost:5173/stripe/refresh";
