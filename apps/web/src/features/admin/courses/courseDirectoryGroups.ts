import type { AdminCourseRow } from "@/features/admin/types";
import {
  COURSE_VISUAL_META,
  getCourseVisualCategory,
  type CourseVisualCategory,
} from "@/features/scheduling/calendar-utils";

const COURSE_GROUP_ORDER: CourseVisualCategory[] = [
  "pending",
  "awaiting_data",
  "completed",
  "replaced",
  "cancelled",
  "other",
];

export interface CourseClassGroup {
  id: CourseVisualCategory;
  label: string;
  hint: string;
  courses: AdminCourseRow[];
}

const COURSE_GROUP_HINTS: Record<CourseVisualCategory, string> = {
  pending: "Planifiés ou paiement en attente",
  awaiting_data: "Confirmations / données manquantes pour clôturer",
  completed: "Séances validées — cours donné",
  replaced: "Remplacement en cours ou effectué",
  cancelled: "Annulés, renoncés ou abandonnés",
  slot: "Créneaux",
  other: "Autres statuts",
};

function sortByScheduledDesc(a: AdminCourseRow, b: AdminCourseRow): number {
  const aAt = a.scheduled_at ?? a.starts_at ?? "";
  const bAt = b.scheduled_at ?? b.starts_at ?? "";
  return new Date(bAt).getTime() - new Date(aAt).getTime();
}

export function groupCoursesByVisualCategory(
  courses: AdminCourseRow[],
): CourseClassGroup[] {
  const buckets: Record<CourseVisualCategory, AdminCourseRow[]> = {
    pending: [],
    awaiting_data: [],
    completed: [],
    replaced: [],
    cancelled: [],
    slot: [],
    other: [],
  };

  for (const course of courses) {
    let category = getCourseVisualCategory(
      "course",
      course.status,
      course.starts_at ?? undefined,
      course.ends_at ?? undefined,
    );
    // CR manquant sur un cours terminé → traité comme données attendues
    if (category === "completed" && course.missing_summary) {
      category = "awaiting_data";
    }
    buckets[category].push(course);
  }

  return COURSE_GROUP_ORDER.filter((id) => buckets[id].length > 0).map(
    (id) => ({
      id,
      label: COURSE_VISUAL_META[id].label,
      hint: COURSE_GROUP_HINTS[id],
      courses: buckets[id].slice().sort(sortByScheduledDesc),
    }),
  );
}

export function countCoursesByVisualCategory(
  courses: AdminCourseRow[],
): Partial<Record<CourseVisualCategory, number>> {
  const counts: Partial<Record<CourseVisualCategory, number>> = {};
  for (const group of groupCoursesByVisualCategory(courses)) {
    counts[group.id] = group.courses.length;
  }
  return counts;
}
