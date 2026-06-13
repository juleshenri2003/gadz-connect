import type { MyProfile } from "@/features/auth/useMyProfile";
import type { ScheduleEvent } from "@/features/scheduling/types";
import type { DashboardProgress, DashboardTask } from "./dashboardTypes";

export type StudentTaskId = "profile" | "find_tutor" | "follow_courses";

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
    id: "find_tutor",
    title: "Trouver un tuteur",
    description: "Parcourir les profils et réserver un cours",
    href: "/app/cours",
  },
  {
    id: "follow_courses",
    title: "Suivre mes cours",
    description: "Emploi du temps et répertoire de cours",
    href: "/app/planning",
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
