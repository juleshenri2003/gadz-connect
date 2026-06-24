import type { TutorRowWithAvailability } from "./tutor-query.js";
import { getProfilePhotoPublicUrl } from "./profile-photo.js";
import {
  normalizeProfileLinks,
  type PublicProfileLink,
} from "./profile-links.js";

const BIO_EXCERPT_LENGTH = 300;

export interface PublicCheapestSlotDto {
  id: string;
  starts_at: string;
  ends_at: string;
  price: number;
}

export interface PublicTutorDto {
  id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  has_cv_pdf: boolean;
  avatar_url: string | null;
  hourly_rate: number | null;
  subjects: string[];
  campus: { name: string } | null;
  profile_links: PublicProfileLink[];
  available_slot_count: number;
  next_available_slot_at: string | null;
  validated_by_rh: true;
  cheapest_upcoming_slot?: PublicCheapestSlotDto | null;
}

export interface PublicTutorSlotDto {
  id: string;
  starts_at: string;
  ends_at: string;
}

const INTERNAL_FIELDS = [
  "cv",
  "cv_pdf_path",
  "avatar_path",
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

function computeSlotPrice(
  hourlyRate: number,
  startsAt: string,
  endsAt: string,
): number {
  const durationHours =
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) /
    (1000 * 60 * 60);
  return Math.round(hourlyRate * durationHours * 100) / 100;
}

export function computeCheapestUpcomingSlot(
  slots: { id: string; starts_at: string; ends_at: string }[],
  hourlyRate: number | null,
): PublicCheapestSlotDto | null {
  if (!hourlyRate || slots.length === 0) return null;

  let cheapest: PublicCheapestSlotDto | null = null;
  for (const slot of slots) {
    const price = computeSlotPrice(hourlyRate, slot.starts_at, slot.ends_at);
    if (!cheapest || price < cheapest.price) {
      cheapest = {
        id: slot.id,
        starts_at: slot.starts_at,
        ends_at: slot.ends_at,
        price,
      };
    }
  }
  return cheapest;
}

export function toPublicTutorDto(
  row: TutorRowWithAvailability,
  options?: {
    fullBio?: boolean;
    cheapestUpcomingSlot?: PublicCheapestSlotDto | null;
  },
): PublicTutorDto {
  const dto: PublicTutorDto = {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    bio: options?.fullBio ? row.bio : excerptBio(row.bio),
    has_cv_pdf: Boolean(row.cv_pdf_path),
    avatar_url: getProfilePhotoPublicUrl(
      (row as { avatar_path?: string | null }).avatar_path,
    ),
    hourly_rate: row.hourly_rate,
    subjects: row.subjects ?? [],
    campus: row.campus,
    profile_links: normalizeProfileLinks(
      (row as { profile_links?: unknown }).profile_links,
    ),
    available_slot_count: row.available_slot_count,
    next_available_slot_at: row.next_available_slot_at,
    validated_by_rh: true,
  };

  if (options && "cheapestUpcomingSlot" in options) {
    dto.cheapest_upcoming_slot = options.cheapestUpcomingSlot ?? null;
  }

  return dto;
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
