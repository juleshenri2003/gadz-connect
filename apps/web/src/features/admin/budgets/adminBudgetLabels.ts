import type {
  TransactionStripeStatus,
  TransactionUrssafStatus,
} from "@gadz-connect/types";

export const STRIPE_STATUS_LABELS: Record<TransactionStripeStatus, string> = {
  pending: "En attente",
  succeeded: "Encaissé",
  failed: "Échoué",
  refunded: "Remboursé",
};

export const URSSAF_STATUS_LABELS: Record<TransactionUrssafStatus, string> = {
  pending: "À déclarer",
  declared: "Déclaré",
};

export const PERIOD_LABELS: Record<string, string> = {
  month: "Mois en cours",
  week: "Semaine en cours",
  "30d": "30 derniers jours",
  all: "Tout l'historique",
};

export function stripeBadgeClass(status: TransactionStripeStatus): string {
  switch (status) {
    case "succeeded":
      return "border-success/20 bg-success-bg text-success";
    case "pending":
      return "border-warning/20 bg-warning-bg text-warning";
    case "failed":
      return "border-danger/20 bg-danger-bg text-danger";
    default:
      return "border-line bg-paper text-ink-600";
  }
}

export function urssafBadgeClass(status: TransactionUrssafStatus): string {
  switch (status) {
    case "declared":
      return "border-success/20 bg-success-bg text-success";
    default:
      return "border-warning/20 bg-warning-bg text-warning";
  }
}

export function formatPersonName(
  person: { first_name: string; last_name: string } | null,
  fallback = "—",
): string {
  if (!person) return fallback;
  const name = `${person.first_name} ${person.last_name}`.trim();
  return name || fallback;
}

export function formatTransactionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
