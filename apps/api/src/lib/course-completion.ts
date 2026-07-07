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
