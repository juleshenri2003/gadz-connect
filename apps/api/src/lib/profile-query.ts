import { supabaseAdmin } from "./supabase.js";

const PROFILE_SELECT_BASE = `
  id,
  first_name,
  last_name,
  role,
  campus_id,
  siret,
  account_status,
  status_acre,
  versement_liberatoire,
  micro_enterprise_activity,
  urssaf_periodicity,
  stripe_connect_account_id,
  stripe_connect_onboarding_complete,
  profile_setup_complete,
  bio,
  hourly_rate,
  subjects,
  created_at,
  updated_at,
  campus:campus_id ( name )
`;

export type ProfileRow = Record<string, unknown> & {
  inpi_declaration_sent_at?: string | null;
  cv?: string | null;
  cv_pdf_path?: string | null;
};

async function queryProfile(
  userId: string,
  extraFields: string,
): Promise<{
  data: ProfileRow | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(`${PROFILE_SELECT_BASE}${extraFields}`)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return { data: data as ProfileRow | null, error: null };
}

export async function fetchProfileByUserId(userId: string): Promise<{
  data: ProfileRow | null;
  error: { message: string; code?: string } | null;
}> {
  const full = await queryProfile(
    userId,
    ", cv, cv_pdf_path, inpi_declaration_sent_at",
  );
  if (!full.error) return full;

  if (full.error.code !== "42703") return full;

  const withCvPdf = await queryProfile(userId, ", cv, cv_pdf_path");
  if (!withCvPdf.error) {
    return {
      data: {
        ...(withCvPdf.data as ProfileRow),
        inpi_declaration_sent_at: null,
      },
      error: null,
    };
  }

  if (withCvPdf.error.code !== "42703") return withCvPdf;

  const withCv = await queryProfile(userId, ", cv");
  if (!withCv.error) {
    return {
      data: {
        ...(withCv.data as ProfileRow),
        cv_pdf_path: null,
        inpi_declaration_sent_at: null,
      },
      error: null,
    };
  }

  if (withCv.error.code !== "42703") return withCv;

  const base = await queryProfile(userId, "");
  if (base.error || !base.data) return base;

  return {
    data: {
      ...(base.data as ProfileRow),
      cv: null,
      cv_pdf_path: null,
      inpi_declaration_sent_at: null,
    },
    error: null,
  };
}

export async function hasInpiDeclarationColumn(): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .select("inpi_declaration_sent_at")
    .limit(1);

  return !error || error.code !== "42703";
}
