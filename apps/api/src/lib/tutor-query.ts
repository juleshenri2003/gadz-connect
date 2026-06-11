import {
  MARKETPLACE_TUTOR_SELECT,
  isTeacherVisibleInMarketplace,
} from "./tutor-visibility.js";
import { supabaseAdmin } from "./supabase.js";

type TutorRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  bio: string | null;
  cv: string | null;
  cv_pdf_path?: string | null;
  hourly_rate: number | null;
  subjects: string[];
  account_status: string;
  profile_setup_complete?: boolean | null;
  campus: { name: string } | null;
};

const TUTOR_SELECT_WITH_CV_PDF = MARKETPLACE_TUTOR_SELECT;
const TUTOR_SELECT_WITHOUT_CV_PDF = MARKETPLACE_TUTOR_SELECT.replace(
  ", cv_pdf_path",
  "",
);

function isMissingColumnError(error: { code?: string } | null): boolean {
  return error?.code === "42703";
}

function asTutorRows(data: unknown): TutorRow[] {
  return (data ?? []) as TutorRow[];
}

function asTutorRow(data: unknown): TutorRow {
  return data as TutorRow;
}

export async function fetchCampusTutors(
  campusId: string,
  excludeUserId: string,
): Promise<{ data: TutorRow[]; error: { message: string } | null }> {
  const withPdf = await supabaseAdmin
    .from("profiles")
    .select(TUTOR_SELECT_WITH_CV_PDF)
    .eq("campus_id", campusId)
    .eq("role", "teacher")
    .eq("account_status", "active")
    .eq("profile_setup_complete", true)
    .neq("id", excludeUserId)
    .order("last_name");

  if (!withPdf.error) {
    return { data: asTutorRows(withPdf.data), error: null };
  }

  if (!isMissingColumnError(withPdf.error)) {
    return { data: [], error: { message: withPdf.error.message } };
  }

  const withoutPdf = await supabaseAdmin
    .from("profiles")
    .select(TUTOR_SELECT_WITHOUT_CV_PDF)
    .eq("campus_id", campusId)
    .eq("role", "teacher")
    .eq("account_status", "active")
    .eq("profile_setup_complete", true)
    .neq("id", excludeUserId)
    .order("last_name");

  if (withoutPdf.error) {
    return { data: [], error: { message: withoutPdf.error.message } };
  }

  const rows = asTutorRows(withoutPdf.data).map((row) => ({
    ...row,
    cv_pdf_path: null,
  }));

  return { data: rows, error: null };
}

export async function fetchCampusTutorById(
  campusId: string,
  tutorId: string,
): Promise<{ data: TutorRow | null; error: { message: string } | null }> {
  const withPdf = await supabaseAdmin
    .from("profiles")
    .select(TUTOR_SELECT_WITH_CV_PDF)
    .eq("id", tutorId)
    .eq("campus_id", campusId)
    .maybeSingle();

  if (!withPdf.error && withPdf.data) {
    const row = asTutorRow(withPdf.data);
    return isTeacherVisibleInMarketplace(row)
      ? { data: row, error: null }
      : { data: null, error: null };
  }

  if (withPdf.error && !isMissingColumnError(withPdf.error)) {
    return { data: null, error: { message: withPdf.error.message } };
  }

  const withoutPdf = await supabaseAdmin
    .from("profiles")
    .select(TUTOR_SELECT_WITHOUT_CV_PDF)
    .eq("id", tutorId)
    .eq("campus_id", campusId)
    .maybeSingle();

  if (withoutPdf.error || !withoutPdf.data) {
    return {
      data: null,
      error: withoutPdf.error
        ? { message: withoutPdf.error.message }
        : null,
    };
  }

  const row: TutorRow = {
    ...asTutorRow(withoutPdf.data),
    cv_pdf_path: null,
  };

  return isTeacherVisibleInMarketplace(row)
    ? { data: row, error: null }
    : { data: null, error: null };
}

export async function fetchTutorCvPdfPath(
  campusId: string,
  tutorId: string,
): Promise<{ cvPdfPath: string | null; error: { message: string } | null }> {
  const withPdf = await supabaseAdmin
    .from("profiles")
    .select(
      "id, cv_pdf_path, account_status, campus_id, role, profile_setup_complete",
    )
    .eq("id", tutorId)
    .eq("campus_id", campusId)
    .maybeSingle();

  if (!withPdf.error && withPdf.data) {
    const tutor = withPdf.data;
    if (!isTeacherVisibleInMarketplace(tutor) || !tutor.cv_pdf_path) {
      return { cvPdfPath: null, error: null };
    }
    return { cvPdfPath: tutor.cv_pdf_path as string, error: null };
  }

  if (withPdf.error && !isMissingColumnError(withPdf.error)) {
    return { cvPdfPath: null, error: { message: withPdf.error.message } };
  }

  return { cvPdfPath: null, error: null };
}
