import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loadAccountStatus,
  requireTeacherNotSuspended,
} from "../middleware/account-status.js";
import { ensureProfileForUser } from "../lib/profiles.js";
import { supabaseAdmin } from "../lib/supabase.js";
import {
  isStripeConfigured,
  STRIPE_CONNECT_REFRESH_URL,
  STRIPE_CONNECT_RETURN_URL,
  STRIPE_PUBLISHABLE_KEY,
  stripe,
} from "../lib/stripe.js";

export const stripeRouter = Router();

/**
 * GET /api/stripe/config
 * Clé publique Stripe pour Elements côté élève (pas d'auth requise).
 */
stripeRouter.get("/config", (_req, res) => {
  res.json({
    data: {
      configured: isStripeConfigured && Boolean(STRIPE_PUBLISHABLE_KEY),
      publishableKey: STRIPE_PUBLISHABLE_KEY ?? null,
    },
  });
});

stripeRouter.use(requireAuth);

/**
 * POST /api/stripe/connect/account
 * Crée un compte Stripe Connect Express et l'associe au profil.
 */
stripeRouter.post(
  "/connect/account",
  loadAccountStatus,
  requireTeacherNotSuspended,
  async (req: AuthenticatedRequest, res) => {
  if (!stripe) {
    res.status(503).json({
      error:
        "Stripe non configuré — ajoutez STRIPE_SECRET_KEY (sk_test_…) dans apps/api/.env",
    });
    return;
  }

  const user = req.user!;
  const userId = user.id;
  const email = user.email;

  if (!email) {
    res.status(400).json({ error: "E-mail utilisateur requis" });
    return;
  }

  const ensured = await ensureProfileForUser(user);
  if (!ensured.ok) {
    res.status(500).json({ error: ensured.message });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("stripe_connect_account_id, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[stripe] profil après ensure:", profileError?.message);
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  let accountId = profile.stripe_connect_account_id as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      individual: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email,
      },
      metadata: { gadz_user_id: userId },
    });

    accountId = account.id;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ stripe_connect_account_id: accountId })
      .eq("id", userId);

    if (updateError) {
      res.status(500).json({ error: "Impossible d'enregistrer le compte Stripe" });
      return;
    }
  }

  res.json({ data: { accountId } });
  },
);

const onboardingLinkSchema = z.object({
  accountId: z.string().startsWith("acct_"),
});

/**
 * POST /api/stripe/connect/onboarding-link
 * Génère un Account Link pour finaliser l'onboarding Express.
 */
stripeRouter.post(
  "/connect/onboarding-link",
  loadAccountStatus,
  requireTeacherNotSuspended,
  async (req: AuthenticatedRequest, res) => {
  if (!stripe) {
    res.status(503).json({
      error:
        "Stripe non configuré — ajoutez STRIPE_SECRET_KEY (sk_test_…) dans apps/api/.env",
    });
    return;
  }

  const parsed = onboardingLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const user = req.user!;
  const userId = user.id;
  const { accountId } = parsed.data;

  const ensured = await ensureProfileForUser(user);
  if (!ensured.ok) {
    res.status(500).json({ error: ensured.message });
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_connect_account_id !== accountId) {
    res.status(403).json({ error: "Compte Stripe non associé à cet utilisateur" });
    return;
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: STRIPE_CONNECT_REFRESH_URL,
    return_url: STRIPE_CONNECT_RETURN_URL,
    type: "account_onboarding",
  });

  res.json({ data: { url: accountLink.url } });
  },
);

/**
 * GET /api/stripe/connect/status
 * Statut onboarding Stripe du prestataire connecté.
 */
stripeRouter.get("/connect/status", async (req: AuthenticatedRequest, res) => {
  if (!stripe) {
    res.json({
      data: {
        hasAccount: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        configured: false,
      },
    });
    return;
  }

  const user = req.user!;
  const userId = user.id;

  await ensureProfileForUser(user);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_connect_account_id, stripe_connect_onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.stripe_connect_account_id) {
    res.json({
      data: {
        hasAccount: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      },
    });
    return;
  }

  const account = await stripe.accounts.retrieve(
    profile.stripe_connect_account_id as string,
  );

  const onboardingComplete = Boolean(
    account.charges_enabled && account.payouts_enabled,
  );

  if (
    onboardingComplete &&
    !profile.stripe_connect_onboarding_complete
  ) {
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_connect_onboarding_complete: true })
      .eq("id", userId);
  }

  res.json({
    data: {
      hasAccount: true,
      accountId: profile.stripe_connect_account_id,
      onboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    },
  });
});

/**
 * POST /api/stripe/connect/dashboard-link
 * Génère un lien de connexion vers le dashboard Stripe Express.
 */
stripeRouter.post(
  "/connect/dashboard-link",
  loadAccountStatus,
  requireTeacherNotSuspended,
  async (req: AuthenticatedRequest, res) => {
    if (!stripe) {
      res.status(503).json({
        error:
          "Stripe non configuré — ajoutez STRIPE_SECRET_KEY (sk_test_…) dans apps/api/.env",
      });
      return;
    }

    const user = req.user!;
    const userId = user.id;

    await ensureProfileForUser(user);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", userId)
      .maybeSingle();

    const accountId = profile?.stripe_connect_account_id as string | undefined;
    if (!accountId) {
      res.status(400).json({ error: "Aucun compte Stripe associé" });
      return;
    }

    try {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      res.json({ data: { url: loginLink.url } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d'ouvrir le dashboard Stripe";
      console.error("[stripe] dashboard-link:", message);
      if (message.includes("not completed onboarding")) {
        res.status(400).json({
          error:
            "Onboarding Stripe incomplet — reprenez la configuration depuis Paiements.",
        });
        return;
      }
      res.status(502).json({ error: message });
    }
  },
);
