import {
  ACRE_DURATION_MONTHS,
  getAcreDaysRemaining,
  getAcreEndDate,
  isAcreActive,
} from "@gadz-connect/types";

export type AcreState = "none" | "active" | "expiring" | "expired";

export interface AcreStatusView {
  state: AcreState;
  granted: boolean;
  startDate: string | null;
  endDate: Date | null;
  daysRemaining: number;
  /** Seuil d'alerte "expire bientôt" (jours). */
  expiringSoon: boolean;
}

/** Alerte quand il reste moins de 60 jours d'ACRE. */
export const ACRE_EXPIRING_THRESHOLD_DAYS = 60;

export function getAcreStatusView(
  statusAcre: boolean,
  acreStartDate: string | null | undefined,
  reference: Date = new Date(),
): AcreStatusView {
  if (!statusAcre) {
    return {
      state: "none",
      granted: false,
      startDate: null,
      endDate: null,
      daysRemaining: 0,
      expiringSoon: false,
    };
  }

  const endDate = getAcreEndDate(acreStartDate);
  const daysRemaining = getAcreDaysRemaining(acreStartDate, reference);
  const active = isAcreActive(acreStartDate, reference);
  const expiringSoon =
    active && daysRemaining > 0 && daysRemaining <= ACRE_EXPIRING_THRESHOLD_DAYS;

  let state: AcreState;
  if (!acreStartDate || !endDate) {
    // ACRE accordée mais sans date : considérée active (compat pré-migration).
    state = "active";
  } else if (active) {
    state = expiringSoon ? "expiring" : "active";
  } else {
    state = "expired";
  }

  return {
    state,
    granted: true,
    startDate: acreStartDate ?? null,
    endDate,
    daysRemaining,
    expiringSoon,
  };
}

export function formatAcreDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const ACRE_DURATION_LABEL = `${ACRE_DURATION_MONTHS} mois`;
