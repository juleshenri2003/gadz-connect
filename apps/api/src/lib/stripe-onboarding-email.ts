import {
  sendStripeOnboardingEmail,
  type StripeOnboardingEmailVariant,
} from "./email/send-stripe-onboarding-email.js";
import type { ResendSendResult } from "./email/resend-config.js";
import { notifyUsers } from "./notification-helpers.js";
import { supabaseAdmin } from "./supabase.js";

const EMAIL_KIND = "stripe_connect_email";

export interface StripeOnboardingEmailOptions {
  variant: StripeOnboardingEmailVariant;
  /** Ne pas renvoyer si un e-mail du même type a déjà été loggé récemment. */
  minDaysSinceLastEmail?: number;
}

async function getLastEmailNotificationAt(userId: string): Promise<Date | null> {
  const { data, error } = await supabaseAdmin
    .from("campus_notifications")
    .select("created_at")
    .eq("kind", EMAIL_KIND)
    .eq("declared_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.created_at) return null;
  return new Date(data.created_at as string);
}

async function logStripeOnboardingEmail(
  userId: string,
  campusId: string,
  variant: StripeOnboardingEmailVariant,
): Promise<void> {
  const title =
    variant === "welcome"
      ? "E-mail envoyé — configuration Stripe"
      : "E-mail de rappel — configuration Stripe";

  await notifyUsers([userId], {
    campusId,
    kind: EMAIL_KIND,
    title,
    message:
      variant === "welcome"
        ? "Un e-mail vous a été envoyé pour finaliser Stripe Connect depuis l'espace Paiements."
        : "Rappel : finalisez Stripe Connect pour recevoir vos virements.",
    declaredBy: userId,
  });
}

/**
 * Envoie l'e-mail Stripe Connect si le prof est actif et l'onboarding n'est pas terminé.
 */
export async function maybeSendStripeOnboardingEmail(
  userId: string,
  options: StripeOnboardingEmailOptions,
): Promise<ResendSendResult> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, role, first_name, account_status, campus_id, stripe_connect_account_id, stripe_connect_onboarding_complete",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return { sent: false, skipped: true, reason: "Profil introuvable" };
  }

  if (profile.role !== "teacher" || profile.account_status !== "active") {
    return { sent: false, skipped: true, reason: "Pas un professeur actif" };
  }

  if (profile.stripe_connect_onboarding_complete) {
    return { sent: false, skipped: true, reason: "Stripe déjà configuré" };
  }

  if (!profile.stripe_connect_account_id) {
    return { sent: false, skipped: true, reason: "Compte Stripe absent" };
  }

  if (options.variant === "welcome") {
    const lastAt = await getLastEmailNotificationAt(userId);
    if (lastAt) {
      return { sent: false, skipped: true, reason: "E-mail bienvenue déjà envoyé" };
    }
  }

  if (options.minDaysSinceLastEmail != null && options.minDaysSinceLastEmail > 0) {
    const lastAt = await getLastEmailNotificationAt(userId);
    if (lastAt) {
      const daysSince =
        (Date.now() - lastAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < options.minDaysSinceLastEmail) {
        return {
          sent: false,
          skipped: true,
          reason: `Dernier e-mail il y a ${Math.floor(daysSince)} j (< ${options.minDaysSinceLastEmail} j)`,
        };
      }
    }
  }

  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (authError || !authUser.user?.email) {
    return { sent: false, skipped: true, reason: "E-mail auth introuvable" };
  }

  const result = await sendStripeOnboardingEmail({
    to: authUser.user.email,
    firstName: (profile.first_name as string) ?? "",
    variant: options.variant,
  });

  if (result.sent && profile.campus_id) {
    await logStripeOnboardingEmail(
      userId,
      profile.campus_id as string,
      options.variant,
    );
  }

  return result;
}
