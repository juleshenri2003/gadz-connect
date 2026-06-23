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
  stripe_connect_onboarding_complete?: boolean | null;
  siret?: string | null;
  is_autoentrepreneur_verified?: boolean | null;
  campus: { name: string } | null;
};

export type TutorRowWithAvailability = TutorRow & {
  available_slot_count: number;
  next_available_slot_at: string | null;
};

type SlotAvailability = {
  count: number;
  next: string | null;
};

async function fetchSlotAvailabilityByProvider(
  providerIds: string[],
): Promise<Map<string, SlotAvailability>> {
  const result = new Map<string, SlotAvailability>();
  for (const id of providerIds) {
    result.set(id, { count: 0, next: null });
  }

  if (providerIds.length === 0) return result;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("tutor_slots")
    .select("provider_id, starts_at")
    .in("provider_id", providerIds)
    .eq("booked", false)
    .gt("starts_at", nowIso)
    .order("starts_at");

  if (error || !data) return result;

  for (const row of data) {
    const providerId = row.provider_id as string;
    const entry = result.get(providerId);
    if (!entry) continue;
    entry.count += 1;
    if (!entry.next) entry.next = row.starts_at as string;
  }

  return result;
}

function attachSlotAvailability(
  rows: TutorRow[],
  availability: Map<string, SlotAvailability>,
): TutorRowWithAvailability[] {
  return rows.map((row) => {
    const slots = availability.get(row.id) ?? { count: 0, next: null };
    return {
      ...row,
      available_slot_count: slots.count,
      next_available_slot_at: slots.next,
    };
  });
}

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
  excludeUserId: string | null = null,
): Promise<{
  data: TutorRowWithAvailability[];
  error: { message: string } | null;
}> {
  let withPdfQuery = supabaseAdmin
    .from("profiles")
    .select(TUTOR_SELECT_WITH_CV_PDF)
    .eq("campus_id", campusId)
    .eq("role", "teacher")
    .eq("account_status", "active")
    .eq("profile_setup_complete", true);

  if (excludeUserId) {
    withPdfQuery = withPdfQuery.neq("id", excludeUserId);
  }

  const withPdf = await withPdfQuery.order("last_name");

  if (!withPdf.error) {
    const visible = asTutorRows(withPdf.data).filter((row) =>
      isTeacherVisibleInMarketplace(row),
    );
    const availability = await fetchSlotAvailabilityByProvider(
      visible.map((row) => row.id),
    );
    return {
      data: attachSlotAvailability(visible, availability),
      error: null,
    };
  }

  if (!isMissingColumnError(withPdf.error)) {
    return { data: [], error: { message: withPdf.error.message } };
  }

  let withoutPdfQuery = supabaseAdmin
    .from("profiles")
    .select(TUTOR_SELECT_WITHOUT_CV_PDF)
    .eq("campus_id", campusId)
    .eq("role", "teacher")
    .eq("account_status", "active")
    .eq("profile_setup_complete", true);

  if (excludeUserId) {
    withoutPdfQuery = withoutPdfQuery.neq("id", excludeUserId);
  }

  const withoutPdf = await withoutPdfQuery.order("last_name");

  if (withoutPdf.error) {
    return { data: [], error: { message: withoutPdf.error.message } };
  }

  const rows = asTutorRows(withoutPdf.data)
    .map((row) => ({
      ...row,
      cv_pdf_path: null,
    }))
    .filter((row) => isTeacherVisibleInMarketplace(row));

  const availability = await fetchSlotAvailabilityByProvider(
    rows.map((row) => row.id),
  );
  return {
    data: attachSlotAvailability(rows, availability),
    error: null,
  };
}

export async function fetchCampusTutorById(
  campusId: string,
  tutorId: string,
): Promise<{
  data: TutorRowWithAvailability | null;
  error: { message: string } | null;
}> {
  const withPdf = await supabaseAdmin
    .from("profiles")
    .select(TUTOR_SELECT_WITH_CV_PDF)
    .eq("id", tutorId)
    .eq("campus_id", campusId)
    .maybeSingle();

  if (!withPdf.error && withPdf.data) {
    const row = asTutorRow(withPdf.data);
    if (!isTeacherVisibleInMarketplace(row)) {
      return { data: null, error: null };
    }
    const availability = await fetchSlotAvailabilityByProvider([row.id]);
    return {
      data: attachSlotAvailability([row], availability)[0] ?? null,
      error: null,
    };
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

  if (!isTeacherVisibleInMarketplace(row)) {
    return { data: null, error: null };
  }

  const availability = await fetchSlotAvailabilityByProvider([row.id]);
  return {
    data: attachSlotAvailability([row], availability)[0] ?? null,
    error: null,
  };
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
