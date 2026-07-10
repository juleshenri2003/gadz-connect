import { z } from "zod";
import { supabaseAdmin } from "./supabase.js";

export const LEARNING_FLAG_VALUES = [
  "dyslexie",
  "hpi",
  "tdah",
  "autre",
] as const;

export type LearningFlag = (typeof LEARNING_FLAG_VALUES)[number];

export const CLASS_YEAR_OPTIONS = [
  "L1",
  "L2",
  "L3",
  "GI1",
  "GI2",
  "GI3",
  "GIM",
  "Autre",
] as const;

export const studentLearningProfileSchema = z
  .object({
    classYear: z.string().min(1).max(80),
    studyProgram: z.string().max(120).optional(),
    strongPoints: z.string().min(10).max(3000),
    difficulties: z.string().min(10).max(3000),
    learningFlags: z
      .array(z.enum(LEARNING_FLAG_VALUES))
      .max(LEARNING_FLAG_VALUES.length)
      .default([]),
    learningFlagsOther: z.string().max(500).optional(),
    tutoringGoals: z.string().min(10).max(3000),
  })
  .superRefine((data, ctx) => {
    if (data.learningFlags.includes("autre") && !data.learningFlagsOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Précisez votre besoin si vous sélectionnez « Autre »",
        path: ["learningFlagsOther"],
      });
    }
  });

export type StudentLearningProfileInput = z.infer<
  typeof studentLearningProfileSchema
>;

export interface StudentLearningProfileRow {
  student_id: string;
  class_year: string;
  study_program: string | null;
  strong_points: string;
  difficulties: string;
  learning_flags: string[];
  learning_flags_other: string | null;
  tutoring_goals: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export function mapStudentLearningProfile(row: StudentLearningProfileRow) {
  return {
    studentId: row.student_id,
    classYear: row.class_year,
    studyProgram: row.study_program,
    strongPoints: row.strong_points,
    difficulties: row.difficulties,
    learningFlags: row.learning_flags,
    learningFlagsOther: row.learning_flags_other,
    tutoringGoals: row.tutoring_goals,
    onboardingComplete: row.onboarding_complete,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchStudentLearningProfile(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("student_learning_profiles")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return {
    ok: true as const,
    data: data as StudentLearningProfileRow | null,
  };
}

export async function upsertStudentLearningProfile(
  studentId: string,
  input: StudentLearningProfileInput,
  markOnboardingComplete: boolean,
) {
  const payload = {
    student_id: studentId,
    class_year: input.classYear.trim(),
    study_program: input.studyProgram?.trim() || null,
    strong_points: input.strongPoints.trim(),
    difficulties: input.difficulties.trim(),
    learning_flags: input.learningFlags,
    learning_flags_other: input.learningFlagsOther?.trim() || null,
    tutoring_goals: input.tutoringGoals.trim(),
    onboarding_complete: markOnboardingComplete,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("student_learning_profiles")
    .upsert(payload, { onConflict: "student_id" })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "Erreur serveur" };
  }

  if (markOnboardingComplete) {
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ student_onboarding_complete: true })
      .eq("id", studentId)
      .eq("role", "student_provider");

    if (profileError) {
      return { ok: false as const, error: profileError.message };
    }
  }

  return { ok: true as const, data: data as StudentLearningProfileRow };
}

const ACTIVE_COURSE_STATUSES = [
  "scheduled",
  "completed",
  "payment_pending",
  "awaiting_replacement",
] as const;

export async function canAccessStudentLearningProfile(
  viewerId: string,
  viewerRole: string,
  studentId: string,
): Promise<boolean> {
  if (viewerId === studentId) return true;
  if (viewerRole === "admin_general") return true;

  if (viewerRole === "teacher") {
    const { count, error } = await supabaseAdmin
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("client_id", studentId)
      .eq("provider_id", viewerId)
      .in("status", [...ACTIVE_COURSE_STATUSES]);

    if (error) return false;
    return (count ?? 0) > 0;
  }

  return false;
}

export async function isTrialEligible(
  studentId: string,
  providerId: string,
): Promise<{ eligible: boolean; reason?: string }> {
  const { data, error } = await supabaseAdmin
    .from("student_tutor_trials")
    .select("id")
    .eq("student_id", studentId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error) {
    return { eligible: false, reason: "Impossible de vérifier l'éligibilité" };
  }

  if (data) {
    return {
      eligible: false,
      reason: "Vous avez déjà utilisé votre séance d'essai avec ce tuteur",
    };
  }

  return { eligible: true };
}

export const TRIAL_MAX_DURATION_HOURS = 1;

export function slotDurationHours(startsAt: string, endsAt: string): number {
  return (
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) /
    (1000 * 60 * 60)
  );
}

export function isTrialSlotDurationValid(
  startsAt: string,
  endsAt: string,
): boolean {
  return slotDurationHours(startsAt, endsAt) <= TRIAL_MAX_DURATION_HOURS + 0.001;
}
