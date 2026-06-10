import type { User } from "@supabase/supabase-js";
import { ensureProfileForUser } from "./profiles.js";
import { isSchoolEmail, schoolEmailError } from "./school-email.js";
import { supabaseAdmin, supabaseAuth } from "./supabase.js";

export function isEmailLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_EMAIL_LOGIN === "true"
  );
}

export async function performEmailLogin(
  email: string,
): Promise<
  | {
      ok: true;
      session: {
        access_token: string;
        refresh_token: string;
        expires_at?: number;
        user: User;
      };
      profileSetupComplete: boolean;
    }
  | { ok: false; status: number; message: string }
> {
  if (!supabaseAuth) {
    return { ok: false, status: 503, message: "Auth Supabase non configurée" };
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_EMAIL_LOGIN === "true" &&
    !isSchoolEmail(email)
  ) {
    return { ok: false, status: 403, message: schoolEmailError() };
  }

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  let userId = existingUsers.users.find(
    (u) => u.email?.toLowerCase() === email,
  )?.id;

  if (!userId) {
    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
    if (createError || !created.user) {
      console.error("[auth] email-login createUser:", createError?.message);
      return {
        ok: false,
        status: 500,
        message: "Impossible de créer le compte",
      };
    }
    userId = created.user.id;
  }

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  const hashedToken = linkData?.properties?.hashed_token;
  if (linkError || !hashedToken) {
    console.error("[auth] email-login:", linkError?.message);
    return {
      ok: false,
      status: 500,
      message: "Impossible d'établir la session",
    };
  }

  const { data: otpData, error: otpError } = await supabaseAuth.auth.verifyOtp({
    token_hash: hashedToken,
    type: "magiclink",
  });

  if (otpError || !otpData.session?.user) {
    return {
      ok: false,
      status: 401,
      message: otpError?.message ?? "Session invalide",
    };
  }

  const ensured = await ensureProfileForUser(otpData.session.user);
  if (!ensured.ok) {
    return { ok: false, status: 500, message: ensured.message };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("profile_setup_complete")
    .eq("id", otpData.session.user.id)
    .maybeSingle();

  return {
    ok: true,
    session: otpData.session,
    profileSetupComplete: Boolean(profile?.profile_setup_complete),
  };
}
