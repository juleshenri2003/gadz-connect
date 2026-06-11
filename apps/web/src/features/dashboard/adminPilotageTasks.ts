import type { AdminDashboardData, AdminProfileRow } from "@/features/admin/types";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { DashboardProgress, DashboardTask } from "./dashboardTypes";

export function computeAdminPilotageTasks(
  dashboard: AdminDashboardData | undefined,
  profiles: AdminProfileRow[] | undefined,
  notifications: CampusNotificationItem[] | undefined,
): DashboardProgress {
  const tasks: DashboardTask[] = [];

  const pendingWithSiret =
    profiles?.filter(
      (p) => p.account_status === "pending_siret" && Boolean(p.siret),
    ) ?? [];

  if (pendingWithSiret.length > 0) {
    tasks.push({
      id: "validate-siret",
      title: `Valider ${pendingWithSiret.length} SIRET`,
      description:
        "Professeurs en attente de validation RH après déclaration SIRET",
      href: "/admin/membres",
      status: "todo",
    });
  }

  const pendingNoSiret =
    profiles?.filter(
      (p) => p.account_status === "pending_siret" && !p.siret,
    ) ?? [];

  if (pendingNoSiret.length > 0) {
    tasks.push({
      id: "follow-pending-profs",
      title: `${pendingNoSiret.length} prof(s) en attente de SIRET`,
      description: "Relancer les dossiers micro-entreprise incomplets",
      href: "/admin/membres",
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
    tasks.push({
      id: "review-replacements",
      title: `${openReplacements.length} remplacement(s) en cours`,
      description:
        "Superviser les indisponibilités prof et le choix des remplaçants",
      href: "/admin/alertes",
      status: "todo",
    });
  }

  const awaitingCount =
    dashboard?.courses.byStatus.awaiting_replacement ?? 0;

  if (awaitingCount > 0) {
    tasks.push({
      id: "courses-awaiting-replacement",
      title: `${awaitingCount} cours en attente de remplaçant`,
      description: "Cours dont le statut est « awaiting_replacement »",
      href: "/admin/cours",
      status: "todo",
    });
  }

  const suspended = dashboard?.profiles.byStatus.suspended ?? 0;
  if (suspended > 0) {
    tasks.push({
      id: "review-suspended",
      title: `${suspended} compte(s) suspendu(s)`,
      description: "Vérifier les comptes suspendus et réactiver si besoin",
      href: "/admin/membres",
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
      href: "/admin/alertes",
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
