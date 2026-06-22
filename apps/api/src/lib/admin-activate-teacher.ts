import type { AccountStatus } from "@gadz-connect/types";
import { notifyTeacherValidatedByAdmin } from "./notification-helpers.js";
import { ensureStripeConnectAccount } from "./stripe-connect-account.js";
import { supabaseAdmin } from "./supabase.js";

export interface TeacherStatusTarget {
  id: string;
  role: string;
  campus_id: string | null;
  siret: string | null;
  account_status: AccountStatus;
  first_name: string;
  last_name: string;
}

function hasValidSiret(siret: string | null | undefined): boolean {
  return /^\d{14}$/.test((siret ?? "").replace(/\s/g, ""));
}

export function buildTeacherStatusUpdate(
  target: TeacherStatusTarget,
  accountStatus: AccountStatus,
): Record<string, unknown> {
  const update: Record<string, unknown> = { account_status: accountStatus };

  if (
    accountStatus === "active" &&
    target.role === "teacher" &&
    hasValidSiret(target.siret)
  ) {
    update.is_autoentrepreneur_verified = true;
    update.siret_verification_failed = false;
  }

  return update;
}

/**
 * Notifications + Stripe Connect après validation RH d'un professeur.
 */
export async function completeTeacherActivation(
  target: TeacherStatusTarget,
): Promise<void> {
  if (target.role !== "teacher") return;

  if (target.campus_id) {
    await notifyTeacherValidatedByAdmin(target.id, target.campus_id);
  }

  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(target.id);
  if (authError || !authUser.user?.email) {
    console.warn(
      "[admin] activation prof — e-mail auth introuvable:",
      authError?.message,
    );
    return;
  }

  try {
    await ensureStripeConnectAccount({
      userId: target.id,
      email: authUser.user.email,
      firstName: target.first_name,
      lastName: target.last_name,
    });
  } catch (err) {
    console.warn(
      "[admin] activation prof — Stripe Connect:",
      err instanceof Error ? err.message : err,
    );
  }
}
