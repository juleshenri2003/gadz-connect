import { buildAdminAlertHref } from "@/features/notifications/notificationUtils";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { DashboardProgress, DashboardTask } from "./dashboardTypes";

export function computeAdminPilotageTasks(
  profiles: Array<{
    account_status: string;
    siret: string | null;
    siret_verification_failed?: boolean;
  }> | undefined,
  notifications: CampusNotificationItem[] | undefined,
  suspendedCount = 0,
  awaitingReplacementCount = 0,
): DashboardProgress {
  const tasks: DashboardTask[] = [];

  const verificationFailed =
    profiles?.filter((p) => p.siret_verification_failed) ?? [];

  if (verificationFailed.length > 0) {
    tasks.push({
      id: "siret-verification-failed",
      title: `${verificationFailed.length} vérification(s) SIRET en échec`,
      description: "Dossiers à contrôler manuellement dans Utilisateurs",
      href: "/admin/utilisateurs?filter=verification_failed",
      status: "todo",
    });
  }

  const siretCounts = new Map<string, number>();
  for (const p of profiles ?? []) {
    if (!p.siret) continue;
    siretCounts.set(p.siret, (siretCounts.get(p.siret) ?? 0) + 1);
  }
  const duplicateCount = [...siretCounts.values()].filter((c) => c > 1).length;
  if (duplicateCount > 0) {
    tasks.push({
      id: "duplicate-siret",
      title: `${duplicateCount} SIRET en doublon`,
      description: "Résoudre les conflits d'attribution SIRET",
      href: "/admin/utilisateurs?filter=duplicates",
      status: "todo",
    });
  }

  const openReplacements =
    notifications?.filter(
      (n) =>
        n.notification?.kind === "prof_unavailable" &&
        n.notification.replacement_status === "open",
    ) ?? [];

  if (openReplacements.length > 0) {
    const firstOpen = openReplacements[0];
    tasks.push({
      id: "review-replacements",
      title: `${openReplacements.length} remplacement(s) en cours`,
      description:
        "Superviser les indisponibilités prof et le choix des remplaçants",
      href: buildAdminAlertHref(firstOpen?.id, "in_progress"),
      status: "todo",
    });
  }

  if (awaitingReplacementCount > 0) {
    tasks.push({
      id: "courses-awaiting-replacement",
      title: `${awaitingReplacementCount} cours en attente de remplaçant`,
      description: "Cours dont le statut est « awaiting_replacement »",
      href: "/admin/planning?status=awaiting_replacement",
      status: "todo",
    });
  }

  if (suspendedCount > 0) {
    tasks.push({
      id: "review-suspended",
      title: `${suspendedCount} compte(s) suspendu(s)`,
      description: "Vérifier les comptes suspendus et réactiver si besoin",
      href: "/admin/utilisateurs?filter=suspended",
      status: "todo",
    });
  }

  const unreadCount =
    notifications?.filter((n) => !n.read_at).length ?? 0;
  if (unreadCount > 0 && openReplacements.length === 0) {
    tasks.push({
      id: "read-alerts",
      title: `${unreadCount} alerte(s) non lue(s)`,
      description: "Consulter les alertes campus du pilotage",
      href: buildAdminAlertHref(),
      status: "todo",
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      id: "all-clear",
      title: "Pilotage à jour",
      description: "Aucune action urgente pour le moment",
      status: "done",
      readOnly: true,
    });
  }

  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const percent =
    totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);

  return {
    tasks,
    completedCount,
    totalCount,
    percent,
    isComplete: tasks.every((t) => t.status === "done"),
  };
}
