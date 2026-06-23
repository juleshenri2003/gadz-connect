import type { TutorRowWithAvailability } from "./tutor-query.js";

const BIO_EXCERPT_LENGTH = 300;

export interface PublicTutorDto {
  id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  has_cv_pdf: boolean;
  hourly_rate: number | null;
  subjects: string[];
  campus: { name: string } | null;
  available_slot_count: number;
  next_available_slot_at: string | null;
}

export interface PublicTutorSlotDto {
  id: string;
  starts_at: string;
  ends_at: string;
}

const INTERNAL_FIELDS = [
  "cv",
  "cv_pdf_path",
  "role",
  "account_status",
  "stripe_connect_onboarding_complete",
  "profile_setup_complete",
  "siret",
  "is_autoentrepreneur_verified",
] as const;

function excerptBio(bio: string | null): string | null {
  if (!bio?.trim()) return null;
  const trimmed = bio.trim();
  if (trimmed.length <= BIO_EXCERPT_LENGTH) return trimmed;
  return `${trimmed.slice(0, BIO_EXCERPT_LENGTH).trimEnd()}…`;
}

export function toPublicTutorDto(
  row: TutorRowWithAvailability,
  options?: { fullBio?: boolean },
): PublicTutorDto {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    bio: options?.fullBio ? row.bio : excerptBio(row.bio),
    has_cv_pdf: Boolean(row.cv_pdf_path),
    hourly_rate: row.hourly_rate,
    subjects: row.subjects ?? [],
    campus: row.campus,
    available_slot_count: row.available_slot_count,
    next_available_slot_at: row.next_available_slot_at,
  };
}

export function assertNoInternalFields(dto: Record<string, unknown>): void {
  for (const field of INTERNAL_FIELDS) {
    if (field in dto) {
      throw new Error(`Internal field leaked in public DTO: ${field}`);
    }
  }
}

export function toPublicTutorSlotDto(row: {
  id: string;
  starts_at: string;
  ends_at: string;
  booked?: boolean;
  booked_by?: string | null;
  client?: unknown;
}): PublicTutorSlotDto {
  return {
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  };
}
