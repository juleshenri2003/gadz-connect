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
  acre_start_date?: string | null;
  inpi_declaration_sent_at?: string | null;
  registration_path?: string | null;
  siret_verification_failed?: boolean;
  cv?: string | null;
  cv_pdf_path?: string | null;
  avatar_path?: string | null;
  parents?: unknown;
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

const PROFILE_OPTIONAL_FIELDS =
  ", acre_start_date, cv, cv_pdf_path, avatar_path, inpi_declaration_sent_at, registration_path, siret_verification_failed, student_onboarding_complete, parents";

function withProfileDefaults(
  data: ProfileRow,
  defaults: Partial<ProfileRow> = {},
): ProfileRow {
  return {
    acre_start_date: null,
    cv: null,
    cv_pdf_path: null,
    avatar_path: null,
    inpi_declaration_sent_at: null,
    registration_path: null,
    siret_verification_failed: false,
    student_onboarding_complete: false,
    parents: [],
    ...data,
    ...defaults,
  };
}

export async function fetchProfileByUserId(userId: string): Promise<{
  data: ProfileRow | null;
  error: { message: string; code?: string } | null;
}> {
  const full = await queryProfile(userId, PROFILE_OPTIONAL_FIELDS);
  if (!full.error) return full;

  if (full.error.code !== "42703") return full;

  const withoutParents = await queryProfile(
    userId,
    ", acre_start_date, cv, cv_pdf_path, avatar_path, inpi_declaration_sent_at, registration_path, siret_verification_failed, student_onboarding_complete",
  );
  if (!withoutParents.error) {
    return {
      data: withProfileDefaults(withoutParents.data as ProfileRow, {
        parents: [],
      }),
      error: null,
    };
  }

  if (withoutParents.error.code !== "42703") return withoutParents;

  // student_onboarding_complete (migration 027) peut être absent
  const withoutStudentOnboarding = await queryProfile(
    userId,
    ", acre_start_date, cv, cv_pdf_path, avatar_path, inpi_declaration_sent_at, registration_path, siret_verification_failed",
  );
  if (!withoutStudentOnboarding.error) {
    return {
      data: withProfileDefaults(withoutStudentOnboarding.data as ProfileRow, {
        parents: [],
        student_onboarding_complete: false,
      }),
      error: null,
    };
  }

  if (withoutStudentOnboarding.error.code !== "42703") {
    return withoutStudentOnboarding;
  }

  const withoutAcre = await queryProfile(
    userId,
    ", cv, cv_pdf_path, avatar_path, inpi_declaration_sent_at, registration_path, siret_verification_failed",
  );
  if (!withoutAcre.error) {
    return {
      data: withProfileDefaults(withoutAcre.data as ProfileRow),
      error: null,
    };
  }

  if (withoutAcre.error.code !== "42703") return withoutAcre;

  const withInpi = await queryProfile(
    userId,
    ", cv, cv_pdf_path, inpi_declaration_sent_at",
  );
  if (!withInpi.error) {
    return {
      data: withProfileDefaults(withInpi.data as ProfileRow),
      error: null,
    };
  }

  if (withInpi.error.code !== "42703") return withInpi;

  const withCvPdf = await queryProfile(userId, ", cv, cv_pdf_path");
  if (!withCvPdf.error) {
    return {
      data: withProfileDefaults(withCvPdf.data as ProfileRow),
      error: null,
    };
  }

  if (withCvPdf.error.code !== "42703") return withCvPdf;

  const withCv = await queryProfile(userId, ", cv");
  if (!withCv.error) {
    return {
      data: withProfileDefaults(withCv.data as ProfileRow),
      error: null,
    };
  }

  if (withCv.error.code !== "42703") return withCv;

  const base = await queryProfile(userId, "");
  if (base.error || !base.data) return base;

  return {
    data: withProfileDefaults(base.data as ProfileRow),
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
