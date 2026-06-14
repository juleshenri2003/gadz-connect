import type { MyProfile } from "@/features/auth/useMyProfile";
import type { CampusNotificationItem } from "@/features/notifications/useNotifications";
import type { DashboardProgress } from "./dashboardTypes";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";

interface StripeStatus {
  onboardingComplete?: boolean;
}

function shouldShowUrssafReminder(
  periodicity: string | null | undefined,
): boolean {
  if (periodicity === "monthly") return true;
  const month = new Date().getMonth();
  return [0, 3, 6, 9].includes(month);
}

export function computeTeacherActionTasks(
  profile: MyProfile,
  stripe: StripeStatus | undefined,
  notifications: CampusNotificationItem[] | undefined,
  futureSlotCount: number,
): DashboardProgress {
  const tasks: DashboardProgress["tasks"] = [];

  if (profile.account_status !== "active") {
    return {
      tasks: [],
      completedCount: 0,
      totalCount: 0,
      percent: 100,
      isComplete: true,
    };
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

  if (shouldShowUrssafReminder(profile.urssaf_periodicity)) {
    const periodKey =
      profile.urssaf_periodicity === "quarterly"
        ? `Q${Math.floor(new Date().getMonth() / 3) + 1}-${new Date().getFullYear()}`
        : new Date().toISOString().slice(0, 7);
    tasks.push({
      id: `urssaf-${periodKey}`,
      title: "Déclarer et payer l'URSSAF",
      description:
        profile.urssaf_periodicity === "quarterly"
          ? "Déclaration trimestrielle — espace auto-entrepreneur URSSAF"
          : "Déclaration mensuelle — espace auto-entrepreneur URSSAF",
      href: "https://www.autoentrepreneur.urssaf.fr/portail/accueil.html",
      status: "todo",
    });
  }

  if (futureSlotCount === 0) {
    tasks.push({
      id: "publish-slots",
      title: "Publier des créneaux de cours",
      description: "Ajoutez au moins un créneau à venir pour être réservable",
      href: coursesTabHref("slots"),
      status: "todo",
    });
  }

  const unreadOther = notifications?.filter((n) => !n.read_at) ?? [];

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
