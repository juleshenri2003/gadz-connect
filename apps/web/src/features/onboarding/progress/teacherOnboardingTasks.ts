import type { MyProfile } from "@/features/auth/useMyProfile";
import type {
  DashboardProgress,
  DashboardTask,
} from "@/features/dashboard/dashboardTypes";

export type OnboardingTaskStatus = DashboardTask["status"];
export type OnboardingTaskId =
  | "profile"
  | "questionnaire"
  | "inpi"
  | "siret"
  | "rh_validation"
  | "stripe"
  | "publish_slots";

export type OnboardingTask = DashboardTask & { id: OnboardingTaskId };
export type OnboardingProgress = DashboardProgress;

interface StripeStatus {
  onboardingComplete: boolean;
}

function hasValidSiret(siret: string | null | undefined): boolean {
  return /^\d{14}$/.test(siret?.replace(/\s/g, "") ?? "");
}

function countFutureSlots(
  slots: { starts_at: string }[] | undefined,
): number {
  const now = Date.now();
  return (slots ?? []).filter((s) => new Date(s.starts_at).getTime() > now)
    .length;
}

const TASK_DEFINITIONS: Omit<OnboardingTask, "status">[] = [
  {
    id: "profile",
    title: "Profil complété",
    description: "Identité, campus et rôle enseignant",
    href: "/app/setup",
  },
  {
    id: "questionnaire",
    title: "Questionnaire fiscal",
    description: "Activité, URSSAF et options fiscales",
    href: "/app/micro-entreprise?step=questionnaire",
  },
  {
    id: "inpi",
    title: "Créer sa micro-entreprise sur l'INPI",
    description: "Immatriculation sur le Guichet Unique",
    href: "/app/micro-entreprise?step=guide",
    manualAction: "inpi_sent",
  },
  {
    id: "siret",
    title: "Déclarer son SIRET",
    description: "Numéro à 14 chiffres reçu de l'INSEE",
    href: "/app/micro-entreprise?step=siret",
  },
  {
    id: "rh_validation",
    title: "Validation RH",
    description: "Vérification de votre dossier par l'équipe campus",
    readOnly: true,
  },
  {
    id: "stripe",
    title: "Configurer les paiements",
    description: "Stripe Connect pour recevoir vos virements",
    href: "/app/paiements",
  },
  {
    id: "publish_slots",
    title: "Publier des créneaux",
    description: "Tarif horaire et au moins un créneau à venir",
    href: "/app/cours",
  },
];

function isTaskDone(
  id: OnboardingTaskId,
  profile: MyProfile,
  stripe: StripeStatus | undefined,
  futureSlotsCount: number,
): boolean {
  switch (id) {
    case "profile":
      return profile.profile_setup_complete;
    case "questionnaire":
      return Boolean(profile.micro_enterprise_activity);
    case "inpi":
      return (
        Boolean(profile.inpi_declaration_sent_at) || hasValidSiret(profile.siret)
      );
    case "siret":
      return hasValidSiret(profile.siret);
    case "rh_validation":
      return profile.account_status === "active";
    case "stripe":
      return Boolean(stripe?.onboardingComplete);
    case "publish_slots":
      return (
        profile.hourly_rate != null &&
        profile.hourly_rate > 0 &&
        futureSlotsCount > 0
      );
  }
}

export function computeTeacherOnboardingProgress(
  profile: MyProfile,
  stripe: StripeStatus | undefined,
  slots: { starts_at: string }[] | undefined,
): OnboardingProgress {
  const futureSlotsCount = countFutureSlots(slots);

  const tasks: OnboardingTask[] = TASK_DEFINITIONS.map((def) => {
    const done = isTaskDone(def.id, profile, stripe, futureSlotsCount);
    return { ...def, status: done ? "done" : "todo" };
  });

  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  return {
    tasks,
    completedCount,
    totalCount,
    percent,
    isComplete: completedCount === totalCount,
  };
}

export function isTeacherOnboardingIncomplete(
  profile: MyProfile,
  stripe: StripeStatus | undefined,
  slots: { starts_at: string }[] | undefined,
): boolean {
  return !computeTeacherOnboardingProgress(profile, stripe, slots).isComplete;
}
