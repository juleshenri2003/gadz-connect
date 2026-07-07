import { supabaseAdmin } from "./supabase.js";
import type { CourseRatingRow } from "./course-ratings.js";

export async function loadRatingsByCourseIds(
  courseIds: string[],
): Promise<Map<string, CourseRatingRow>> {
  const map = new Map<string, CourseRatingRow>();
  if (courseIds.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from("course_ratings")
    .select(
      "id, course_id, campus_id, rater_id, provider_id, stars, comment, created_at",
    )
    .in("course_id", courseIds);

  if (error) {
    console.error("[course-ratings] load:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    map.set(row.course_id as string, row as CourseRatingRow);
  }

  return map;
}

export async function loadRatingByCourseId(
  courseId: string,
): Promise<CourseRatingRow | null> {
  const { data, error } = await supabaseAdmin
    .from("course_ratings")
    .select(
      "id, course_id, campus_id, rater_id, provider_id, stars, comment, created_at",
    )
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    console.error("[course-ratings] load one:", error.message);
    return null;
  }

  return (data as CourseRatingRow | null) ?? null;
}
