import type { AccountStatus, UserRole } from "@gadz-connect/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  student_provider: "Élève",
  teacher: "Enseignant",
  admin_campus: "Admin campus",
  admin_general: "Admin général",
};

export const STATUS_LABELS: Record<AccountStatus, string> = {
  pending_siret: "En attente SIRET",
  active: "Validé",
  suspended: "Suspendu",
};

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
