/** Période de facturation au format YYYY-MM (ex. 2026-05). */
export type BillingPeriodYm = `${number}-${string}`;

export interface BillingPeriodBounds {
  period: BillingPeriodYm;
  /** Premier jour du mois (ISO date YYYY-MM-DD). */
  start: string;
  /** Dernier instant du mois (ISO). */
  end: string;
  /** Libellé français (ex. « mai 2026 »). */
  label: string;
  /** Compact pour numéros de facture (ex. 202605). */
  compact: string;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseBillingPeriodYm(value: string): BillingPeriodYm {
  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Période invalide : ${value} (attendu YYYY-MM)`);
  }
  const month = Number.parseInt(match[2]!, 10);
  if (month < 1 || month > 12) {
    throw new Error(`Mois invalide : ${value}`);
  }
  return value as BillingPeriodYm;
}

export function getBillingPeriodBounds(period: BillingPeriodYm): BillingPeriodBounds {
  const [yearStr, monthStr] = period.split("-");
  const year = Number.parseInt(yearStr!, 10);
  const month = Number.parseInt(monthStr!, 10);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const label = start.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    period,
    start: `${year}-${pad2(month)}-01`,
    end: end.toISOString(),
    label,
    compact: `${year}${pad2(month)}`,
  };
}

/** Mois civil en cours (tests pilote : facturer les cours du mois courant). */
export function getCurrentBillingPeriod(
  reference = new Date(),
): BillingPeriodYm {
  return `${reference.getUTCFullYear()}-${pad2(reference.getUTCMonth() + 1)}` as BillingPeriodYm;
}

/** Mois civil précédent (exécution le 1er du mois). */
export function getPreviousBillingPeriod(
  reference = new Date(),
): BillingPeriodYm {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const prev = new Date(Date.UTC(year, month - 1, 1));
  return `${prev.getUTCFullYear()}-${pad2(prev.getUTCMonth() + 1)}` as BillingPeriodYm;
}

/**
 * Résout la période CLI : `current` → mois en cours, `YYYY-MM` → explicite, vide → mois précédent.
 */
export function resolveBillingPeriodInput(
  value: string | undefined,
  reference = new Date(),
): BillingPeriodYm {
  const trimmed = value?.trim();
  if (!trimmed) {
    return getPreviousBillingPeriod(reference);
  }
  if (trimmed === "current") {
    return getCurrentBillingPeriod(reference);
  }
  return parseBillingPeriodYm(trimmed);
}

export function isScheduledInPeriod(
  scheduledAt: string | null | undefined,
  bounds: BillingPeriodBounds,
): boolean {
  if (!scheduledAt) return false;
  const date = new Date(scheduledAt);
  const start = new Date(bounds.start + "T00:00:00.000Z");
  const end = new Date(bounds.end);
  return date >= start && date <= end;
}

/**
 * Rattache une facture à un mois : date du cours si connue, sinon date d'émission
 * de la facture (paiement).
 */
export function isInBillingPeriod(
  courseScheduledAt: string | null | undefined,
  invoiceCreatedAt: string | null | undefined,
  bounds: BillingPeriodBounds,
): boolean {
  const anchor = courseScheduledAt ?? invoiceCreatedAt;
  return isScheduledInPeriod(anchor, bounds);
}
