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
  course_confirmation_reminder: "Confirmer le cours",
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

/** Catégories métier des alertes (couleurs dédiées). */
export type AlertCategory =
  | "cancelled"
  | "refund"
  | "confirmation"
  | "completed"
  | "other";

export type NotificationFilter =
  | "all"
  | AlertCategory
  | "student_unavailable";

export const ALERT_CATEGORY_META: Record<
  AlertCategory,
  {
    label: string;
    hint: string;
    /** Badge kind */
    badge: string;
    /** Bordure gauche de la section / carte */
    accent: string;
    /** Fond d'en-tête de section */
    header: string;
    /** Fond carte non lue */
    unreadRow: string;
  }
> = {
  cancelled: {
    label: "Séances annulées",
    hint: "Annulation prof ou élève",
    badge: "bg-orange-100 text-orange-900",
    accent: "border-l-orange-500",
    header: "bg-orange-50",
    unreadRow: "border-orange-200 bg-orange-50",
  },
  refund: {
    label: "Remboursements",
    hint: "Remboursement après échec de remplacement",
    badge: "bg-violet-100 text-violet-900",
    accent: "border-l-violet-500",
    header: "bg-violet-50",
    unreadRow: "border-violet-200 bg-violet-50",
  },
  confirmation: {
    label: "Confirmations incomplètes",
    hint: "En attente du prof et/ou de l'élève pour le paiement",
    badge: "bg-warning-bg text-warning",
    accent: "border-l-warning",
    header: "bg-warning-bg/50",
    unreadRow: "border-warning/30 bg-warning-bg",
  },
  completed: {
    label: "Cours bien déroulés",
    hint: "Séance validée — avis et commentaire élève",
    badge: "bg-success-bg text-success",
    accent: "border-l-success",
    header: "bg-success-bg/40",
    unreadRow: "border-success/30 bg-success-bg/50",
  },
  other: {
    label: "Autres alertes",
    hint: "Paiements, documents, URSSAF, remplacements…",
    badge: "bg-paper text-ink-700",
    accent: "border-l-ink-300",
    header: "bg-paper",
    unreadRow: "border-line bg-paper",
  },
};

const CANCELLED_KINDS = new Set(["prof_unavailable", "student_unavailable"]);
const REFUND_KINDS = new Set(["refund_processed"]);
const CONFIRMATION_KINDS = new Set([
  "course_confirmation_reminder",
  "course_confirmation_escalation",
  "session_confirm_reminder",
  "session_dispute",
]);
const COMPLETED_KINDS = new Set([
  "session_both_confirmed",
  "course_rated",
  "course_rated_low",
]);

export function getAlertCategory(kind: string): AlertCategory {
  if (CANCELLED_KINDS.has(kind)) return "cancelled";
  if (REFUND_KINDS.has(kind)) return "refund";
  if (CONFIRMATION_KINDS.has(kind)) return "confirmation";
  if (COMPLETED_KINDS.has(kind)) return "completed";
  return "other";
}

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

const FILTER_VALUES: NotificationFilter[] = [
  "all",
  "cancelled",
  "refund",
  "confirmation",
  "completed",
  "student_unavailable",
];

export function isValidAdminFilter(
  value: string | null,
): value is NotificationFilter {
  return value !== null && FILTER_VALUES.includes(value as NotificationFilter);
}

export function isValidAlertFilter(
  value: string | null,
): value is NotificationFilter {
  return isValidAdminFilter(value);
}

export function formatNotificationDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getKindBadgeClasses(kind: string): string {
  return ALERT_CATEGORY_META[getAlertCategory(kind)].badge;
}

export function getAlertRowClasses(kind: string, isUnread: boolean): string {
  const meta = ALERT_CATEGORY_META[getAlertCategory(kind)];
  if (isUnread) {
    return `border-l-4 ${meta.accent} ${meta.unreadRow}`;
  }
  return `border-l-4 ${meta.accent} border-line bg-paper/50`;
}

export function isCancellationKind(kind: string): boolean {
  return CANCELLED_KINDS.has(kind);
}

/** Qui manque pour la confirmation (pré ou post séance). */
export function getConfirmationMissingParties(item: CampusNotificationItem): {
  missingStudent: boolean;
  missingTeacher: boolean;
  label: string;
} {
  const n = item.notification;
  const kind = n?.kind ?? "";
  const isPostSession =
    kind === "session_confirm_reminder" || kind === "session_dispute";

  const studentAt = isPostSession
    ? (n?.studentSessionConfirmedAt ?? n?.studentConfirmedAt)
    : n?.studentConfirmedAt;
  const teacherAt = isPostSession
    ? (n?.providerSessionConfirmedAt ?? n?.providerConfirmedAt)
    : n?.providerConfirmedAt;

  const missingStudent = !studentAt;
  const missingTeacher = !teacherAt;
  if (missingStudent && missingTeacher) {
    return {
      missingStudent: true,
      missingTeacher: true,
      label: "Manque prof et élève",
    };
  }
  if (missingStudent) {
    return {
      missingStudent: true,
      missingTeacher: false,
      label: "Manque confirmation élève",
    };
  }
  if (missingTeacher) {
    return {
      missingStudent: false,
      missingTeacher: true,
      label: "Manque confirmation prof",
    };
  }
  return {
    missingStudent: false,
    missingTeacher: false,
    label: "Confirmations reçues",
  };
}

export interface CourseOutcomeMeta {
  hasRating: boolean;
  hasComment: boolean;
  starsLabel: string | null;
  ratingLabel: string;
  commentLabel: string;
}

/** Infos avis / commentaire pour les alertes « cours bien déroulé ». */
export function getCourseOutcomeMeta(
  kind: string,
  message: string,
): CourseOutcomeMeta {
  const hasRating = kind === "course_rated" || kind === "course_rated_low";
  const hasComment = hasRating && /Commentaire\s*:/i.test(message);
  const starsMatch = message.match(/(\d+(?:[.,]\d+)?)\s*\/\s*5/);
  const starsLabel = starsMatch?.[1]?.replace(",", ".") ?? null;

  return {
    hasRating,
    hasComment,
    starsLabel,
    ratingLabel: hasRating
      ? starsLabel
        ? `Avis ${starsLabel}/5`
        : "Avis laissé"
      : "Sans avis",
    commentLabel: hasComment ? "Avec commentaire" : "Sans commentaire",
  };
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
  if (
    kind === "session_confirm_reminder" ||
    kind === "course_confirmation_reminder"
  ) {
    return `Confirmer le cours — ${subject}`;
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
  if (filter === "other") {
    return getAlertCategory(n.kind) === "other";
  }
  return getAlertCategory(n.kind) === filter;
}

const CATEGORY_FILTER_ORDER: AlertCategory[] = [
  "cancelled",
  "refund",
  "confirmation",
  "completed",
];

export function getFilterOptions(
  _profile?: MyProfile,
  _isAdminRoute = false,
): { value: NotificationFilter; label: string }[] {
  return [
    { value: "all", label: "Toutes" },
    ...CATEGORY_FILTER_ORDER.map((value) => ({
      value,
      label: ALERT_CATEGORY_META[value].label,
    })),
  ];
}

export function groupAlertsByCategory(
  items: CampusNotificationItem[],
): Array<{
  category: AlertCategory;
  label: string;
  hint: string;
  items: CampusNotificationItem[];
}> {
  const buckets: Record<AlertCategory, CampusNotificationItem[]> = {
    cancelled: [],
    refund: [],
    confirmation: [],
    completed: [],
    other: [],
  };

  for (const item of items) {
    const kind = item.notification?.kind;
    if (!kind) continue;
    buckets[getAlertCategory(kind)].push(item);
  }

  const order: AlertCategory[] = [
    "cancelled",
    "refund",
    "confirmation",
    "completed",
    "other",
  ];

  return order
    .map((category) => ({
      category,
      label: ALERT_CATEGORY_META[category].label,
      hint: ALERT_CATEGORY_META[category].hint,
      items: buckets[category],
    }))
    .filter((group) => group.items.length > 0);
}

export function countAlertsByCategory(
  items: CampusNotificationItem[],
): Record<AlertCategory, number> {
  const counts: Record<AlertCategory, number> = {
    cancelled: 0,
    refund: 0,
    confirmation: 0,
    completed: 0,
    other: 0,
  };
  for (const item of items) {
    const kind = item.notification?.kind;
    if (!kind) continue;
    counts[getAlertCategory(kind)] += 1;
  }
  return counts;
}

export function getPageSubtitle(profile: MyProfile | undefined): string {
  if (!profile?.role) {
    return "Actions à traiter — les alertes lues disparaissent d'ici";
  }
  if (profile?.role && isStudent(profile.role)) {
    return "À faire aujourd'hui — annulations, confirmations, documents. Une fois lues, elles quittent cette liste.";
  }
  if (profile.role === "teacher") {
    return "À traiter — confirmations, remplacements, avis. Les alertes lues sortent de cette liste.";
  }
  if (profile.role === "admin_general" || profile.role === "admin_campus") {
    return "File du jour — uniquement le non traité. L'historique des sessions est dans Cours.";
  }
  return "Actions à traiter — les alertes lues disparaissent d'ici";
}

export function getEmptyStateMessage(profile: MyProfile | undefined): string {
  if (profile?.role === "teacher") {
    return "Rien à traiter — les nouvelles alertes apparaîtront ici.";
  }
  if (profile?.role && isStudent(profile.role)) {
    return "Rien à traiter pour le moment.";
  }
  if (profile?.role === "admin_general" || profile?.role === "admin_campus") {
    return "Aucune alerte non lue — le registre des sessions est dans Cours.";
  }
  return "Rien à traiter pour le moment.";
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

export function buildMarketplaceSubjectHref(
  subject: string | null | undefined,
): string {
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
