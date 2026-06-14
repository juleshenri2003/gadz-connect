import type { User } from "@supabase/supabase-js";
import { getDemoAccount } from "./demo-accounts.js";
import { ensureProfileForUser } from "./profiles.js";
import { isSchoolEmail, schoolEmailError } from "./school-email.js";
import { supabaseAdmin, supabaseAuth } from "./supabase.js";

export function isEmailLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_EMAIL_LOGIN === "true"
  );
}

export async function syncProfileCampus(
  userId: string,
  campusId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: campus, error: campusError } = await supabaseAdmin
    .from("campus")
    .select("id")
    .eq("id", campusId)
    .maybeSingle();

  if (campusError || !campus) {
    return { ok: false, message: "Campus invalide" };
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ campus_id: campusId })
    .eq("id", userId);

  if (error) {
    console.error("[auth] sync campus:", error.message);
    return { ok: false, message: "Impossible de mettre à jour le campus" };
  }

  return { ok: true };
}

async function ensureAuthUserWithPassword(
  email: string,
  password: string,
): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const { data: existingUsers, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    return { ok: false, message: listError.message };
  }

  const existing = existingUsers.users.find(
    (u) => u.email?.toLowerCase() === email,
  );

  if (!existing) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !created.user) {
      return {
        ok: false,
        message: error?.message ?? "Impossible de créer le compte",
      };
    }
    return { ok: true, userId: created.user.id };
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
    password,
  });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, userId: existing.id };
}

async function signInWithPassword(
  email: string,
  password: string,
): Promise<
  | {
      ok: true;
      session: {
        access_token: string;
        refresh_token: string;
        expires_at?: number;
        user: User;
      };
    }
  | { ok: false; message: string }
> {
  if (!supabaseAuth) {
    return { ok: false, message: "Auth Supabase non configurée" };
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.user) {
    return {
      ok: false,
      message: error?.message ?? "E-mail ou mot de passe incorrect",
    };
  }

  return { ok: true, session: data.session };
}

export async function performEmailLogin(
  email: string,
  password: string,
  campusId?: string,
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

  const normalizedEmail = email.trim().toLowerCase();

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_EMAIL_LOGIN === "true" &&
    !isSchoolEmail(normalizedEmail)
  ) {
    return { ok: false, status: 403, message: schoolEmailError() };
  }

  let signIn = await signInWithPassword(normalizedEmail, password);

  if (!signIn.ok) {
    const demo = getDemoAccount(normalizedEmail);
    const canBootstrap =
      demo &&
      password === demo.password &&
      process.env.NODE_ENV === "development";

    if (canBootstrap) {
      const ensured = await ensureAuthUserWithPassword(
        normalizedEmail,
        password,
      );
      if (!ensured.ok) {
        return { ok: false, status: 500, message: ensured.message };
      }
      signIn = await signInWithPassword(normalizedEmail, password);
    }
  }

  if (!signIn.ok) {
    return {
      ok: false,
      status: 401,
      message: "E-mail ou mot de passe incorrect",
    };
  }

  const ensured = await ensureProfileForUser(signIn.session.user);
  if (!ensured.ok) {
    return { ok: false, status: 500, message: ensured.message };
  }

  if (campusId) {
    const synced = await syncProfileCampus(signIn.session.user.id, campusId);
    if (!synced.ok) {
      return { ok: false, status: 400, message: synced.message };
    }
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("profile_setup_complete")
    .eq("id", signIn.session.user.id)
    .maybeSingle();

  return {
    ok: true,
    session: signIn.session,
    profileSetupComplete: Boolean(profile?.profile_setup_complete),
  };
}
