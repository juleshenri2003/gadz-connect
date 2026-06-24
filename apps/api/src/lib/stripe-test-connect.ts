import { stripe } from "./stripe.js";

export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_test_");
}

export async function tutorCanReceiveStripeTransfers(
  accountId: string,
): Promise<boolean> {
  if (!stripe) return false;

  const account = await stripe.accounts.retrieve(accountId);
  return account.capabilities?.transfers === "active";
}

export type StripePaymentStrategy = "none" | "connect" | "platform_test" | "blocked";

/**
 * Détermine comment encaisser une réservation :
 * - connect : virement vers le compte Connect du prof
 * - platform_test : carte en mode test sans virement (prof pas encore onboardé)
 * - none : réservation immédiate sans carte (Stripe non configuré)
 * - blocked : Stripe live mais prof pas prêt à recevoir des virements
 */
export async function resolveStripePaymentStrategy(
  tutorStripeAccountId: string | null | undefined,
): Promise<StripePaymentStrategy> {
  if (!stripe) {
    return "none";
  }

  if (!tutorStripeAccountId) {
    return "none";
  }

  if (await tutorCanReceiveStripeTransfers(tutorStripeAccountId)) {
    return "connect";
  }

  if (isStripeTestMode()) {
    return "platform_test";
  }

  return "blocked";
}
