import { hasInpiDeclarationColumn } from "./profile-query.js";
import { supabaseAdmin } from "./supabase.js";

export async function getInpiDeclarationSentAt(
  userId: string,
  fromProfile: string | null | undefined,
): Promise<string | null> {
  if (fromProfile) return fromProfile;

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;

  const meta = data.user.user_metadata?.inpi_declaration_sent_at;
  return typeof meta === "string" ? meta : null;
}

export async function setInpiDeclarationSent(
  userId: string,
  sent = true,
): Promise<{
  inpi_declaration_sent_at: string | null;
}> {
  const timestamp = sent ? new Date().toISOString() : null;
  const columnReady = await hasInpiDeclarationColumn();

  if (columnReady) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ inpi_declaration_sent_at: timestamp })
      .eq("id", userId)
      .select("inpi_declaration_sent_at")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message ?? "Mise à jour impossible");
    }

    return { inpi_declaration_sent_at: data.inpi_declaration_sent_at ?? null };
  }

  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (authError || !authUser.user) {
    throw new Error("Utilisateur introuvable");
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        ...authUser.user.user_metadata,
        inpi_declaration_sent_at: timestamp,
      },
    },
  );

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { inpi_declaration_sent_at: timestamp };
}
