import type Stripe from "stripe";
import { stripe } from "./stripe.js";

export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_test_");
}

export interface StripeConnectProfileHints {
  email: string;
  firstName: string;
  lastName: string;
}

export interface StripeConnectStatus {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  transfersActive: boolean;
  onboardingComplete: boolean;
}

const TEST_BANK_IBAN = "FR1420041010050500013M02606";

export function readStripeConnectStatus(
  account: Stripe.Account,
): StripeConnectStatus {
  return {
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    transfersActive: account.capabilities?.transfers === "active",
    onboardingComplete: Boolean(account.charges_enabled && account.payouts_enabled),
  };
}

/**
 * Ajoute l'IBAN test si absent. N'accepte pas les CGU à la place du prof
 * (impossible sur les comptes Express).
 */
export async function completeStripeTestConnectAccount(
  accountId: string,
  profile?: StripeConnectProfileHints,
): Promise<StripeConnectStatus> {
  if (!stripe) {
    throw new Error("Stripe non configuré");
  }

  const account = await stripe.accounts.retrieve(accountId);
  if (!isStripeTestMode()) {
    return readStripeConnectStatus(account);
  }

  const holderName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Prof Démo";

  const existingAccounts = await stripe.accounts.listExternalAccounts(
    accountId,
    { object: "bank_account", limit: 1 },
  );

  if (existingAccounts.data.length === 0) {
    await stripe.accounts.createExternalAccount(accountId, {
      external_account: {
        object: "bank_account",
        country: "FR",
        currency: "eur",
        account_holder_name: holderName,
        account_holder_type: "individual",
        account_number: TEST_BANK_IBAN,
      },
    });
  }

  const refreshed = await stripe.accounts.retrieve(accountId);
  return readStripeConnectStatus(refreshed);
}

export async function deleteStripeTestConnectAccount(
  accountId: string,
): Promise<boolean> {
  if (!stripe || !isStripeTestMode()) return false;
  try {
    await stripe.accounts.del(accountId);
    return true;
  } catch {
    return false;
  }
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
