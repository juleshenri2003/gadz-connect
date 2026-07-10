import type { MyProfile } from "@/features/auth/useMyProfile";
import type { ScheduleEvent } from "@/features/scheduling/types";
import type { DashboardProgress, DashboardTask } from "./dashboardTypes";

export type StudentTaskId =
  | "profile"
  | "learning_profile"
  | "find_tutor"
  | "follow_courses";

const TUTOR_PROFILE_VIEWED_KEY = "gadz_tutor_profile_viewed";

export function markTutorProfileViewed(): void {
  try {
    sessionStorage.setItem(TUTOR_PROFILE_VIEWED_KEY, "1");
  } catch {
    // ignore
  }
}

export function hasViewedTutorProfile(): boolean {
  try {
    return sessionStorage.getItem(TUTOR_PROFILE_VIEWED_KEY) === "1";
  } catch {
    return false;
  }
}

const TASK_DEFINITIONS: Omit<DashboardTask, "status">[] = [
  {
    id: "profile",
    title: "Profil complété",
    description: "Identité et campus",
    href: "/app/profil",
  },
  {
    id: "learning_profile",
    title: "Mon profil d'apprentissage",
    description: "Forces, difficultés et objectifs de tutorat",
    href: "/app/profil",
  },
  {
    id: "find_tutor",
    title: "Trouver un tuteur",
    description: "Parcourir les profils et réserver une séance d'essai ou un cours",
    href: "/app/cours",
  },
  {
    id: "follow_courses",
    title: "Suivi & entraide",
    description: "Emploi du temps, comptes-rendus et échanges",
    href: "/app/suivi-cours",
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
  void campusTutorCount;
  switch (id) {
    case "profile":
      return profile.profile_setup_complete;
    case "learning_profile":
      return profile.student_onboarding_complete === true;
    case "find_tutor":
      return hasBookedCourse(events) || hasViewedTutorProfile();
    case "follow_courses":
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

export function isStudentCampusEmpty(campusTutorCount: number): boolean {
  return campusTutorCount === 0;
}
