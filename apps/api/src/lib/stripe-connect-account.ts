import { supabaseAdmin } from "./supabase.js";
import { isStripeTestMode } from "./stripe-test-connect.js";
import { stripe } from "./stripe.js";

export interface EnsureStripeConnectInput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Préremplit identité + activité à la création (mode test, avant tout Account Link). */
  testPrefill?: boolean;
}

/**
 * Crée un compte Stripe Connect Express si absent (idempotent).
 */
export async function ensureStripeConnectAccount(
  input: EnsureStripeConnectInput,
): Promise<{ accountId: string | null; created: boolean }> {
  if (!stripe) {
    return { accountId: null, created: false };
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", input.userId)
    .maybeSingle();

  if (error || !profile) {
    throw new Error(error?.message ?? "Profil introuvable");
  }

  const existing = profile.stripe_connect_account_id as string | null;
  if (existing) {
    return { accountId: existing, created: false };
  }

  const useTestPrefill = Boolean(input.testPrefill && isStripeTestMode());

  const account = await stripe.accounts.create({
    type: "express",
    country: "FR",
    email: input.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    ...(useTestPrefill
      ? {
          individual: {
            first_name: input.firstName,
            last_name: input.lastName,
            email: input.email,
            phone: "0000000000",
            dob: { day: 1, month: 1, year: 1990 },
            address: {
              line1: "address_full_match",
              city: "Paris",
              postal_code: "75001",
              country: "FR",
            },
          },
          business_profile: {
            url: "https://gadzconnect.fr",
            product_description: "Cours particuliers et tutorat",
            mcc: "8299",
          },
        }
      : {
          individual: {
            first_name: input.firstName,
            last_name: input.lastName,
            email: input.email,
          },
        }),
    metadata: { gadz_user_id: input.userId },
  });

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ stripe_connect_account_id: account.id })
    .eq("id", input.userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { accountId: account.id, created: true };
}
