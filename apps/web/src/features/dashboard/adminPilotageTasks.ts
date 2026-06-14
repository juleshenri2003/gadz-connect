import { buildAdminAlertHref } from "@/features/notifications/notificationUtils";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { DashboardProgress } from "./dashboardTypes";

export function computeAdminPilotageTasks(
  profiles: Array<{
    account_status: string;
    siret: string | null;
    siret_verification_failed?: boolean;
  }> | undefined,
  notifications: CampusNotificationItem[] | undefined,
  suspendedCount = 0,
): DashboardProgress {
  const tasks: DashboardProgress["tasks"] = [];

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
  if (unreadCount > 0) {
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
