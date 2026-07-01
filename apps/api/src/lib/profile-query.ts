import { supabaseAdmin } from "./supabase.js";

const PROFILE_SELECT_BASE = `
  id,
  first_name,
  last_name,
  role,
  campus_id,
  siret,
  is_autoentrepreneur_verified,
  micro_enterprise_address,
  account_status,
  status_acre,
  acre_start_date,
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
  registration_path?: string | null;
  siret_verification_failed?: boolean;
  cv?: string | null;
  cv_pdf_path?: string | null;
  avatar_path?: string | null;
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
    ", cv, cv_pdf_path, avatar_path, inpi_declaration_sent_at, registration_path, siret_verification_failed",
  );
  if (!full.error) return full;

  if (full.error.code !== "42703") return full;

  const withInpi = await queryProfile(
    userId,
    ", cv, cv_pdf_path, inpi_declaration_sent_at",
  );
  if (!withInpi.error) {
    return {
      data: {
        ...(withInpi.data as ProfileRow),
        avatar_path: null,
        registration_path: null,
        siret_verification_failed: false,
      },
      error: null,
    };
  }

  if (withInpi.error.code !== "42703") return withInpi;

  const withCvPdf = await queryProfile(userId, ", cv, cv_pdf_path");
  if (!withCvPdf.error) {
    return {
      data: {
        ...(withCvPdf.data as ProfileRow),
        avatar_path: null,
        inpi_declaration_sent_at: null,
        registration_path: null,
        siret_verification_failed: false,
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
        avatar_path: null,
        inpi_declaration_sent_at: null,
        registration_path: null,
        siret_verification_failed: false,
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
      avatar_path: null,
      inpi_declaration_sent_at: null,
      registration_path: null,
      siret_verification_failed: false,
    },
    error: null,
  };
}

let inpiColumnReady: boolean | null = null;

export async function hasInpiDeclarationColumn(): Promise<boolean> {
  if (inpiColumnReady !== null) return inpiColumnReady;

  const { error } = await supabaseAdmin
    .from("profiles")
    .select("inpi_declaration_sent_at")
    .limit(1);

  inpiColumnReady = !error || error.code !== "42703";
  return inpiColumnReady;
}
