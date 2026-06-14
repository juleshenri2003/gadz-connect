import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEMO_ACCOUNTS,
  getDemoAccount,
} from "../../src/lib/demo-accounts.js";

export async function ensureDemoUserPassword(
  admin: SupabaseClient,
  email: string,
  password?: string,
): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const normalized = email.trim().toLowerCase();
  const demo = getDemoAccount(normalized);
  const resolvedPassword = password ?? demo?.password;

  if (!resolvedPassword) {
    return { ok: false, message: `Aucun mot de passe démo pour ${normalized}` };
  }

  const { data: existingUsers, error: listError } =
    await admin.auth.admin.listUsers();
  if (listError) {
    return { ok: false, message: listError.message };
  }

  const existing = existingUsers.users.find(
    (u) => u.email?.toLowerCase() === normalized,
  );

  if (!existing) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: normalized,
      password: resolvedPassword,
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

  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    password: resolvedPassword,
  });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, userId: existing.id };
}

export async function syncAllDemoPasswords(
  admin: SupabaseClient,
): Promise<void> {
  for (const email of Object.keys(DEMO_ACCOUNTS)) {
    const result = await ensureDemoUserPassword(admin, email);
    if (!result.ok) {
      console.error(`✗ ${email}: ${result.message}`);
      continue;
    }
    console.log(`✓ ${email}`);
  }
}
