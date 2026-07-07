import { supabaseAdmin } from "./supabase.js";

/** Passe les cours passés encore « scheduled » en « completed ». */
export async function markPastCoursesCompleted(): Promise<void> {
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("courses")
    .update({ status: "completed" })
    .eq("status", "scheduled")
    .lt("scheduled_at", now);
}

export function isCourseFollowUpEligible(course: {
  status: string;
  scheduled_at: string | null;
}): boolean {
  if (course.status === "completed") return true;
  if (course.status === "scheduled" && course.scheduled_at) {
    return new Date(course.scheduled_at).getTime() < Date.now();
  }
  return false;
}
