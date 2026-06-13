import { isStudent } from "@/features/auth/roles";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { startOfWeek } from "@/features/scheduling/calendar-utils";
import type { CampusNotificationItem } from "./useNotifications";

export const KIND_LABELS: Record<string, string> = {
  prof_unavailable: "Prof indisponible",
  student_unavailable: "Élève indisponible",
  replacement_proposed: "Proposition de remplacement",
  replacement_accepted: "Remplacement confirmé",
  replacement_declined: "Proposition refusée",
};

export type NotificationFilter =
  | "all"
  | "replacements"
  | "confirmed"
  | "to_answer"
  | "my_declarations"
  | "to_choose"
  | "waiting"
  | "in_progress"
  | "proposals_received"
  | "no_teacher_response"
  | "student_unavailable";

export function isSiteAdminRole(role: string | undefined): boolean {
  return role === "admin_general" || role === "admin_campus";
}

export function isAdminWaitingProposals(item: CampusNotificationItem): boolean {
  return isOpenProfReplacement(item) && getPendingProposalCount(item) === 0;
}

export function isAdminProposalsReceived(item: CampusNotificationItem): boolean {
  return isOpenProfReplacement(item) && getPendingProposalCount(item) > 0;
}

export function isAdminStudentUnavailable(item: CampusNotificationItem): boolean {
  return item.notification?.kind === "student_unavailable";
}

export function countAdminWaitingProposals(
  items: CampusNotificationItem[] | undefined,
): number {
  return items?.filter(isAdminWaitingProposals).length ?? 0;
}

export function countAdminProposalsReceived(
  items: CampusNotificationItem[] | undefined,
): number {
  return items?.filter(isAdminProposalsReceived).length ?? 0;
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
  "in_progress",
  "proposals_received",
  "no_teacher_response",
  "student_unavailable",
  "confirmed",
  "replacements",
];

export function isValidAdminFilter(value: string | null): value is NotificationFilter {
  return value !== null && ADMIN_FILTER_VALUES.includes(value as NotificationFilter);
}

export type TeacherResponseStatus = "none" | "proposed" | "declined";

export function formatNotificationDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getReplacementStatusLabel(status: string): string | null {
  switch (status) {
    case "open":
      return "En cours";
    case "filled":
      return "Confirmé";
    case "dismissed":
      return "Clôturé";
    default:
      return null;
  }
}

export function getReplacementStatusClasses(status: string): string {
  switch (status) {
    case "open":
      return "bg-warning-bg text-warning";
    case "filled":
      return "bg-success-bg text-success";
    case "dismissed":
      return "bg-paper text-ink-600";
    default:
      return "bg-paper text-ink-600";
  }
}

export function getKindBadgeClasses(kind: string): string {
  switch (kind) {
    case "prof_unavailable":
      return "bg-warning-bg text-warning";
    case "student_unavailable":
      return "bg-orange-100 text-orange-900";
    case "replacement_proposed":
      return "bg-brand-100 text-brand-700";
    case "replacement_accepted":
      return "bg-success-bg text-success";
    case "replacement_declined":
      return "bg-paper text-ink-600";
    default:
      return "bg-paper text-ink-600";
  }
}

export function getTeacherResponseLabel(
  status: TeacherResponseStatus | undefined,
): string | null {
  switch (status) {
    case "proposed":
      return "Réponse : Proposé";
    case "declined":
      return "Réponse : Refusé";
    case "none":
      return "Réponse : À traiter";
    default:
      return null;
  }
}

export function getTeacherResponseClasses(
  status: TeacherResponseStatus | undefined,
): string {
  switch (status) {
    case "proposed":
      return "bg-success-bg text-success";
    case "declined":
      return "bg-paper text-ink-600";
    case "none":
      return "bg-brand-100 text-brand-700";
    default:
      return "bg-paper text-ink-600";
  }
}

export function getTeacherResponse(
  item: CampusNotificationItem,
): TeacherResponseStatus {
  return item.notification?.teacher_response ?? "none";
}

export function isOpenProfReplacement(item: CampusNotificationItem): boolean {
  const n = item.notification;
  return Boolean(
    n?.kind === "prof_unavailable" && n.replacement_status === "open",
  );
}

export function getPendingProposalCount(item: CampusNotificationItem): number {
  return item.notification?.pending_proposals_count ?? 0;
}

export function isStudentToChoose(item: CampusNotificationItem): boolean {
  return isOpenProfReplacement(item) && getPendingProposalCount(item) > 0;
}

export function isStudentWaiting(item: CampusNotificationItem): boolean {
  return isOpenProfReplacement(item) && getPendingProposalCount(item) === 0;
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

export function countStudentToChoose(
  items: CampusNotificationItem[] | undefined,
): number {
  return items?.filter(isStudentToChoose).length ?? 0;
}

export function countStudentWaiting(
  items: CampusNotificationItem[] | undefined,
): number {
  return items?.filter(isStudentWaiting).length ?? 0;
}

export function getStudentNotificationTitle(
  kind: string,
  subject: string,
  declarant: string,
): string {
  if (kind === "prof_unavailable") {
    return `${declarant} indisponible — ${subject}`;
  }
  return subject;
}

export function isTeacherActiveAction(
  item: CampusNotificationItem,
  profileId: string | undefined,
): boolean {
  if (!isOpenProfReplacement(item) || !profileId) return false;
  const n = item.notification!;
  const response = getTeacherResponse(item);

  if (n.declared_by === profileId) return true;
  if (response === "declined") return false;
  if (response === "proposed") return true;
  return response === "none";
}

export function isTeacherToAnswer(
  item: CampusNotificationItem,
  profileId: string | undefined,
): boolean {
  if (!isOpenProfReplacement(item) || !profileId) return false;
  const n = item.notification!;
  return n.declared_by !== profileId && getTeacherResponse(item) === "none";
}

export function isTeacherOwnDeclaration(
  item: CampusNotificationItem,
  profileId: string | undefined,
): boolean {
  if (!isOpenProfReplacement(item) || !profileId) return false;
  return item.notification!.declared_by === profileId;
}

export function isTeacherAwaitingStudent(
  item: CampusNotificationItem,
  profileId: string | undefined,
): boolean {
  if (!isOpenProfReplacement(item) || !profileId) return false;
  const n = item.notification!;
  return n.declared_by !== profileId && getTeacherResponse(item) === "proposed";
}

export function isActiveAction(item: CampusNotificationItem): boolean {
  const n = item.notification;
  if (!n) return false;
  return n.kind === "prof_unavailable" && n.replacement_status === "open";
}

export function matchesFilter(
  item: CampusNotificationItem,
  filter: NotificationFilter,
  profileId?: string,
): boolean {
  const n = item.notification;
  if (!n) return false;
  if (filter === "all") return true;
  if (filter === "to_answer") {
    return isTeacherToAnswer(item, profileId);
  }
  if (filter === "my_declarations") {
    return isTeacherOwnDeclaration(item, profileId);
  }
  if (filter === "to_choose") {
    return isStudentToChoose(item);
  }
  if (filter === "waiting") {
    return isStudentWaiting(item);
  }
  if (filter === "in_progress") {
    return isOpenProfReplacement(item);
  }
  if (filter === "proposals_received") {
    return isAdminProposalsReceived(item);
  }
  if (filter === "no_teacher_response") {
    return isAdminWaitingProposals(item);
  }
  if (filter === "student_unavailable") {
    return isAdminStudentUnavailable(item);
  }
  if (filter === "replacements") {
    return (
      n.kind === "prof_unavailable" ||
      n.kind === "replacement_proposed" ||
      n.kind === "replacement_accepted" ||
      n.kind === "replacement_declined"
    );
  }
  if (filter === "confirmed") {
    return (
      n.replacement_status === "filled" || n.kind === "replacement_accepted"
    );
  }
  return false;
}

export function getFilterOptions(
  profile: MyProfile | undefined,
  items?: CampusNotificationItem[],
  isAdminRoute = false,
): { value: NotificationFilter; label: string }[] {
  if (isAdminRoute && isSiteAdminRole(profile?.role)) {
    const waiting = countAdminWaitingProposals(items);
    const received = countAdminProposalsReceived(items);
    const inProgress = countOpenReplacements(items);
    return [
      { value: "all", label: "Toutes" },
      {
        value: "in_progress",
        label: inProgress > 0 ? `En cours (${inProgress})` : "En cours",
      },
      {
        value: "proposals_received",
        label:
          received > 0
            ? `Propositions reçues (${received})`
            : "Propositions reçues",
      },
      {
        value: "no_teacher_response",
        label:
          waiting > 0 ? `Sans réponse prof (${waiting})` : "Sans réponse prof",
      },
      { value: "student_unavailable", label: "Indisponibilités élève" },
      { value: "confirmed", label: "Confirmées" },
      { value: "replacements", label: "Remplacements" },
    ];
  }
  if (profile?.role === "teacher") {
    return [
      { value: "all", label: "Toutes" },
      { value: "to_answer", label: "À répondre" },
      { value: "my_declarations", label: "Mes déclarations" },
      { value: "confirmed", label: "Confirmées" },
    ];
  }
  if (profile?.role && isStudent(profile.role)) {
    const toChoose = countStudentToChoose(items);
    const waiting = countStudentWaiting(items);
    return [
      { value: "all", label: "Toutes" },
      {
        value: "to_choose",
        label: toChoose > 0 ? `À choisir (${toChoose})` : "À choisir",
      },
      {
        value: "waiting",
        label: waiting > 0 ? `En attente (${waiting})` : "En attente",
      },
      { value: "replacements", label: "Remplacements" },
      { value: "confirmed", label: "Confirmées" },
    ];
  }
  const toChoose = countStudentToChoose(items);
  const waiting = countStudentWaiting(items);
  return [
    { value: "all", label: "Toutes" },
    {
      value: "to_choose",
      label: toChoose > 0 ? `À choisir (${toChoose})` : "À choisir",
    },
    {
      value: "waiting",
      label: waiting > 0 ? `En attente (${waiting})` : "En attente",
    },
    { value: "replacements", label: "Remplacements" },
    { value: "confirmed", label: "Confirmées" },
  ];
}

export function getPageSubtitle(profile: MyProfile | undefined): string {
  if (!profile?.role) {
    return "Indisponibilités, propositions de remplacement et confirmations";
  }
  if (isStudent(profile.role)) {
    return "Indisponibilités de vos professeurs, choix de remplaçant et confirmations de cours";
  }
  if (profile.role === "teacher") {
    return "Indisponibilités collègues, propositions de remplacement et suivi de vos déclarations";
  }
  if (profile.role === "admin_general" || profile.role === "admin_campus") {
    return "Supervision des indisponibilités prof, remplacements en cours et confirmations campus";
  }
  return "Indisponibilités prof, propositions de remplacement et confirmations";
}

export function getEmptyStateMessage(profile: MyProfile | undefined): string {
  if (profile?.role === "teacher") {
    return "Aucune alerte — les indisponibilités déclarées depuis votre emploi du temps apparaîtront ici.";
  }
  if (profile?.role && isStudent(profile.role)) {
    return "Aucune alerte pour le moment — vous serez notifié en cas d'indisponibilité ou de proposition de remplacement.";
  }
  if (profile?.role === "admin_general" || profile?.role === "admin_campus") {
    return "Aucune alerte campus sur votre périmètre pour le moment.";
  }
  return "Aucune alerte pour le moment.";
}

export function countOpenReplacements(
  items: CampusNotificationItem[] | undefined,
): number {
  return (
    items?.filter(
      (item) =>
        item.notification?.kind === "prof_unavailable" &&
        item.notification.replacement_status === "open",
    ).length ?? 0
  );
}

export function countTeacherToAnswer(
  items: CampusNotificationItem[] | undefined,
  profileId: string | undefined,
): number {
  return (
    items?.filter((item) => isTeacherToAnswer(item, profileId)).length ?? 0
  );
}

export function countTeacherOwnDeclarations(
  items: CampusNotificationItem[] | undefined,
  profileId: string | undefined,
): number {
  return (
    items?.filter((item) => isTeacherOwnDeclaration(item, profileId)).length ??
    0
  );
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
  filter: NotificationFilter = "in_progress",
): string {
  if (recipientId) {
    return buildAlertFocusHref(recipientId, null, "/admin/alertes", {
      filter,
    });
  }
  return `/admin/alertes?filter=${filter}`;
}
