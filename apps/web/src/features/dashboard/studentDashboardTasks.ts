import type { MyProfile } from "@/features/auth/useMyProfile";
import type { ScheduleEvent } from "@/features/scheduling/types";
import type { DashboardProgress, DashboardTask } from "./dashboardTypes";

export type StudentTaskId =
  | "profile"
  | "explore_tutors"
  | "book_session"
  | "planning"
  | "repository";

const TASK_DEFINITIONS: Omit<DashboardTask, "status">[] = [
  {
    id: "profile",
    title: "Profil complété",
    description: "Identité et campus",
    href: "/app/profil",
  },
  {
    id: "explore_tutors",
    title: "Découvrir les tuteurs",
    description: "Parcourir les profils de votre campus",
    href: "/app#trouver-un-tuteur",
  },
  {
    id: "book_session",
    title: "Réserver un cours",
    description: "Choisir un créneau avec un tuteur",
    href: "/app#trouver-un-tuteur",
  },
  {
    id: "planning",
    title: "Consulter l'emploi du temps",
    description: "Voir vos sessions planifiées",
    href: "/app/planning",
  },
  {
    id: "repository",
    title: "Consulter mon répertoire",
    description: "Résumés de cours par matière",
    href: "/app/repertoire",
  },
];

function hasBookedCourse(events: ScheduleEvent[] | undefined): boolean {
  return (events ?? []).some((e) => e.kind === "course");
}

function isTaskDone(
  id: StudentTaskId,
  profile: MyProfile,
  events: ScheduleEvent[] | undefined,
  campusTutorCount = 0,
): boolean {
  switch (id) {
    case "profile":
      return profile.profile_setup_complete;
    case "explore_tutors":
      return (
        hasBookedCourse(events) ||
        (profile.profile_setup_complete && campusTutorCount > 0)
      );
    case "book_session":
      return hasBookedCourse(events);
    case "planning":
      return hasBookedCourse(events);
    case "repository":
      return hasBookedCourse(events);
  }
}

export function computeStudentDashboardProgress(
  profile: MyProfile,
  events: ScheduleEvent[] | undefined,
  campusTutorCount = 0,
): DashboardProgress {
  const tasks: DashboardTask[] = TASK_DEFINITIONS.map((def) => {
    const done = isTaskDone(
      def.id as StudentTaskId,
      profile,
      events,
      campusTutorCount,
    );
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
