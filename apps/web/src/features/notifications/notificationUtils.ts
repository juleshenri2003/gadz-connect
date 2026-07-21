import { isStudent } from "@/features/auth/roles";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { startOfWeek } from "@/features/scheduling/calendar-utils";
import type { CampusNotificationItem } from "./useNotifications";

export const KIND_LABELS: Record<string, string> = {
  prof_unavailable: "Séance annulée (prof)",
  student_unavailable: "Séance annulée (élève)",
  account_activated: "Compte activé",
  payment_received: "Paiement reçu",
  stripe_connect_email: "Configuration Stripe",
  course_rated: "Avis élève",
  course_rated_low: "Note à améliorer",
  course_follow_up: "Document de cours",
  course_exchange_message: "Message cours",
  course_confirmation_reminder: "Confirmation séance",
  course_confirmation_escalation: "Confirmation incomplète",
  replacement_offer: "Cours à reprendre",
  replacement_candidate: "Remplaçant proposé",
  replacement_accepted: "Remplacement confirmé",
  refund_processed: "Remboursement",
  urssaf_client_actif: "Avance immédiate",
  urssaf_payment_rejected: "URSSAF refusée",
  urssaf_payout_pending: "Reversement URSSAF",
  session_confirm_reminder: "Confirmer le cours",
  session_both_confirmed: "Séance validée",
  session_dispute: "Litige séance",
};

export type NotificationFilter = "all" | "student_unavailable";

export function isSiteAdminRole(role: string | undefined): boolean {
  return role === "admin_general" || role === "admin_campus";
}

export function isAdminStudentUnavailable(item: CampusNotificationItem): boolean {
  return item.notification?.kind === "student_unavailable";
}

export function getUniqueCampusNames(
  items: CampusNotificationItem[],
): string[] {
  const names = new Set<string>();
  for (const item of items) {
    const name = item.notification?.campus?.name;
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, "fr"));
}

export function matchesCampusFilter(
  item: CampusNotificationItem,
  campusName: string | null,
): boolean {
  if (!campusName) return true;
  return item.notification?.campus?.name === campusName;
}

const ADMIN_FILTER_VALUES: NotificationFilter[] = [
  "all",
  "student_unavailable",
];

export function isValidAdminFilter(value: string | null): value is NotificationFilter {
  return value !== null && ADMIN_FILTER_VALUES.includes(value as NotificationFilter);
}

export function formatNotificationDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getKindBadgeClasses(kind: string): string {
  switch (kind) {
    case "prof_unavailable":
      return "bg-warning-bg text-warning";
    case "student_unavailable":
      return "bg-orange-100 text-orange-900";
    case "account_activated":
      return "bg-success-bg text-success";
    case "payment_received":
      return "bg-brand-50 text-brand-700";
    case "stripe_connect_email":
      return "bg-brand-50 text-brand-700";
    case "course_rated":
      return "bg-brand-50 text-brand-700";
    case "course_rated_low":
      return "bg-warning-bg text-warning";
    case "course_follow_up":
      return "bg-brand-50 text-brand-700";
    case "course_exchange_message":
      return "bg-paper text-ink-700";
    case "course_confirmation_reminder":
      return "bg-brand-50 text-brand-700";
    case "course_confirmation_escalation":
      return "bg-warning-bg text-warning";
    case "replacement_offer":
    case "replacement_candidate":
      return "bg-orange-100 text-orange-900";
    case "replacement_accepted":
      return "bg-success-bg text-success";
    case "refund_processed":
      return "bg-paper text-ink-700";
    case "urssaf_client_actif":
      return "bg-success-bg text-success";
    case "urssaf_payment_rejected":
      return "bg-warning-bg text-warning";
    case "urssaf_payout_pending":
      return "bg-orange-100 text-orange-900";
    case "session_confirm_reminder":
      return "bg-brand-50 text-brand-700";
    case "session_both_confirmed":
      return "bg-success-bg text-success";
    case "session_dispute":
      return "bg-warning-bg text-warning";
    default:
      return "bg-paper text-ink-600";
  }
}

export function isCancellationKind(kind: string): boolean {
  return kind === "prof_unavailable" || kind === "student_unavailable";
}

export function sortByScheduledAt(
  items: CampusNotificationItem[],
): CampusNotificationItem[] {
  return [...items].sort((a, b) => {
    const aTime = a.notification?.scheduled_at
      ? new Date(a.notification.scheduled_at).getTime()
      : Number.POSITIVE_INFINITY;
    const bTime = b.notification?.scheduled_at
      ? new Date(b.notification.scheduled_at).getTime()
      : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

export function getStudentNotificationTitle(
  kind: string,
  subject: string,
  declarant: string,
): string {
  if (kind === "prof_unavailable") {
    return `${declarant} a annulé — ${subject}`;
  }
  return subject;
}

export function matchesFilter(
  item: CampusNotificationItem,
  filter: NotificationFilter,
): boolean {
  const n = item.notification;
  if (!n) return false;
  if (filter === "all") return true;
  if (filter === "student_unavailable") {
    return isAdminStudentUnavailable(item);
  }
  return false;
}

export function getFilterOptions(
  profile: MyProfile | undefined,
  isAdminRoute = false,
): { value: NotificationFilter; label: string }[] {
  if (isAdminRoute && isSiteAdminRole(profile?.role)) {
    return [
      { value: "all", label: "Toutes" },
      { value: "student_unavailable", label: "Annulations élève" },
    ];
  }
  return [{ value: "all", label: "Toutes" }];
}

export function getPageSubtitle(profile: MyProfile | undefined): string {
  if (!profile?.role) {
    return "Annulations de séances et informations campus";
  }
  if (profile?.role && isStudent(profile.role)) {
    return "Séances annulées, documents déposés, confirmations de cours et remplacements.";
  }
  if (profile.role === "teacher") {
    return "Paiements, annulations, remplacements et confirmations de séance";
  }
  if (profile.role === "admin_general" || profile.role === "admin_campus") {
    return "Supervision des annulations et alertes";
  }
  return "Annulations de séances et informations";
}

export function getEmptyStateMessage(profile: MyProfile | undefined): string {
  if (profile?.role === "teacher") {
    return "Aucune alerte — paiements et annulations apparaîtront ici.";
  }
  if (profile?.role && isStudent(profile.role)) {
    return "Aucune alerte pour le moment — vous serez notifié en cas d'annulation ou de dépôt de document.";
  }
  if (profile?.role === "admin_general" || profile?.role === "admin_campus") {
    return "Aucune alerte sur votre périmètre pour le moment.";
  }
  return "Aucune alerte pour le moment.";
}

export function getPlanningPath(isAdmin: boolean): string {
  return isAdmin ? "/admin/planning" : "/app/planning";
}

export function buildPlanningWeekHref(
  scheduledAt: string | null | undefined,
  isAdmin = false,
): string {
  const base = getPlanningPath(isAdmin);
  if (!scheduledAt) return base;
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return base;
  const weekStart = startOfWeek(d);
  const week = weekStart.toISOString().slice(0, 10);
  return `${base}?week=${week}`;
}

export function formatClientName(
  client: { first_name: string; last_name: string } | null | undefined,
): string | null {
  if (!client) return null;
  const name = `${client.first_name} ${client.last_name}`.trim();
  return name || null;
}

export function buildMarketplaceSubjectHref(subject: string | null | undefined): string {
  if (!subject?.trim()) return "/app/cours";
  return `/app/cours?subject=${encodeURIComponent(subject.trim())}`;
}

export function buildAlertFocusHref(
  recipientId: string,
  notificationId?: string | null,
  basePath = "/app/alertes",
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  params.set("focus", recipientId);
  if (notificationId) params.set("nid", notificationId);
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }
  }
  return `${basePath}?${params.toString()}`;
}

export function buildAdminAlertHref(
  recipientId?: string | null,
  filter: NotificationFilter = "all",
): string {
  if (recipientId) {
    return buildAlertFocusHref(recipientId, null, "/admin/alertes", {
      filter,
    });
  }
  return `/admin/alertes?filter=${filter}`;
}
