import type { MyProfile } from "@/features/auth/useMyProfile";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { DashboardProgress, DashboardTask } from "./dashboardTypes";

interface StripeStatus {
  onboardingComplete?: boolean;
}

export function computeTeacherActionTasks(
  profile: MyProfile,
  stripe: StripeStatus | undefined,
  notifications: CampusNotificationItem[] | undefined,
  futureSlotCount: number,
): DashboardProgress {
  const tasks: DashboardTask[] = [];

  if (profile.account_status !== "active") {
    return {
      tasks: [],
      completedCount: 0,
      totalCount: 0,
      percent: 100,
      isComplete: true,
    };
  }

  const openReplacements =
    notifications?.filter(
      (n) =>
        !n.read_at &&
        n.notification?.kind === "prof_unavailable" &&
        n.notification.replacement_status === "open" &&
        n.notification.declared_by !== profile.id,
    ) ?? [];

  for (const item of openReplacements) {
    const subject = item.notification?.subject ?? "Cours";
    tasks.push({
      id: `propose-${item.notification?.id ?? item.id}`,
      title: `Proposer un remplacement — ${subject}`,
      description:
        "Un collègue est indisponible : proposez de reprendre le cours au même horaire",
      href: "/app/alertes",
      status: "todo",
    });
  }

  const ownOpen =
    notifications?.filter(
      (n) =>
        n.notification?.kind === "prof_unavailable" &&
        n.notification.replacement_status === "open" &&
        n.notification.declared_by === profile.id,
    ) ?? [];

  for (const item of ownOpen) {
    const subject = item.notification?.subject ?? "Cours";
    tasks.push({
      id: `track-${item.notification?.id ?? item.id}`,
      title: `Suivre le remplacement — ${subject}`,
      description: "Votre indisponibilité : suivez les propositions reçues",
      href: "/app/alertes",
      status: "todo",
    });
  }

  if (!stripe?.onboardingComplete) {
    tasks.push({
      id: "stripe-connect",
      title: "Configurer les paiements Stripe",
      description: "Activez Stripe Connect pour recevoir vos virements",
      href: "/app/paiements",
      status: "todo",
    });
  }

  const monthKey = new Date().toISOString().slice(0, 7);
  tasks.push({
    id: `urssaf-${monthKey}`,
    title: "Déclarer et payer l'URSSAF",
    description:
      "Cotisations micro-entreprise — vérifiez votre périodicité et effectuez la déclaration",
    href: "/app/micro-entreprise",
    status: "todo",
  });

  if (futureSlotCount === 0) {
    tasks.push({
      id: "publish-slots",
      title: "Publier des créneaux de cours",
      description: "Ajoutez au moins un créneau à venir pour être réservable",
      href: "/app/cours",
      status: "todo",
    });
  }

  const unreadOther =
    notifications?.filter(
      (n) =>
        !n.read_at &&
        n.notification?.kind !== "prof_unavailable" &&
        n.notification?.kind !== "replacement_proposed",
    ) ?? [];

  if (unreadOther.length > 0) {
    tasks.push({
      id: "read-alerts",
      title: `${unreadOther.length} alerte(s) à consulter`,
      description: "Notifications campus non lues",
      href: "/app/alertes",
      status: "todo",
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
    isComplete: tasks.length === 0,
  };
}
