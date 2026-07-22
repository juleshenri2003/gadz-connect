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
      // Colonne absente (migration 027) : la fiche est quand même enregistrée.
      const missingColumn =
        profileError.message.includes("student_onboarding_complete") ||
        profileError.code === "42703" ||
        profileError.message.includes("schema cache");
      if (!missingColumn) {
        return { ok: false as const, error: profileError.message };
      }
      console.warn(
        "[student-learning-profile] student_onboarding_complete absent — appliquez migration 027",
      );
    }
  }

  return { ok: true as const, data: data as StudentLearningProfileRow };
}

const ACTIVE_COURSE_STATUSES = [
  "scheduled",
  "completed",
  "payment_pending",
  "awaiting_replacement",
  "awaiting_session_confirmation",
] as const;

export async function canAccessStudentLearningProfile(
  viewerId: string,
  viewerRole: string,
  studentId: string,
): Promise<boolean> {
  if (viewerId === studentId) return true;

  if (viewerRole === "admin_general") return true;

  if (viewerRole === "admin_campus") {
    const [{ data: viewer }, { data: student }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("campus_id")
        .eq("id", viewerId)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("campus_id")
        .eq("id", studentId)
        .maybeSingle(),
    ]);
    return Boolean(
      viewer?.campus_id &&
        student?.campus_id &&
        viewer.campus_id === student.campus_id,
    );
  }

  if (viewerRole === "teacher") {
    const { count, error } = await supabaseAdmin
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("client_id", studentId)
      .eq("provider_id", viewerId)
      .in("status", [...ACTIVE_COURSE_STATUSES]);

    if (error) {
      // Enum awaiting_session_confirmation absent (migration 030).
      const { count: legacyCount, error: legacyError } = await supabaseAdmin
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("client_id", studentId)
        .eq("provider_id", viewerId)
        .in("status", [
          "scheduled",
          "completed",
          "payment_pending",
          "awaiting_replacement",
        ]);
      if (legacyError) return false;
      return (legacyCount ?? 0) > 0;
    }
    return (count ?? 0) > 0;
  }

  return false;
}

/** Statuts qui comptent comme « déjà eu un cours » avec ce tuteur (plus d'essai). */
const PRIOR_COURSE_STATUSES = [
  "scheduled",
  "completed",
  "payment_pending",
  "awaiting_replacement",
  "awaiting_session_confirmation",
] as const;

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

  // Filet de sécurité : tout cours déjà pris avec ce tuteur (même sans ligne
  // student_tutor_trials) consomme l'essai gratuit.
  const { count, error: coursesError } = await supabaseAdmin
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("client_id", studentId)
    .eq("provider_id", providerId)
    .in("status", [...PRIOR_COURSE_STATUSES]);

  if (coursesError) {
    // Si le statut awaiting_session_confirmation n'existe pas encore (migration 030),
    // retenter sans lui.
    const { count: legacyCount, error: legacyError } = await supabaseAdmin
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("client_id", studentId)
      .eq("provider_id", providerId)
      .in("status", [
        "scheduled",
        "completed",
        "payment_pending",
        "awaiting_replacement",
      ]);

    if (legacyError) {
      return { eligible: false, reason: "Impossible de vérifier l'éligibilité" };
    }

    if ((legacyCount ?? 0) > 0) {
      return {
        eligible: false,
        reason: "Vous avez déjà suivi un cours avec ce tuteur",
      };
    }

    return { eligible: true };
  }

  if ((count ?? 0) > 0) {
    return {
      eligible: false,
      reason: "Vous avez déjà suivi un cours avec ce tuteur",
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
