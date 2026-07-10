import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loadAccountStatus,
  rejectSuspended,
} from "../middleware/account-status.js";
import { supabaseAdmin } from "../lib/supabase.js";
import {
  fetchStudentLearningProfile,
  mapStudentLearningProfile,
  studentLearningProfileSchema,
  upsertStudentLearningProfile,
} from "../lib/student-learning-profile.js";

export const studentLearningProfileRouter = Router();

studentLearningProfileRouter.use(requireAuth);

/**
 * GET /api/profile/student-learning-profile
 */
studentLearningProfileRouter.get(
  "/student-learning-profile",
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!profile || profile.role !== "student_provider") {
      res.status(403).json({ error: "Réservé aux comptes élève" });
      return;
    }

    const result = await fetchStudentLearningProfile(userId);
    if (!result.ok) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.json({
      data: result.data ? mapStudentLearningProfile(result.data) : null,
    });
  },
);

/**
 * PATCH /api/profile/student-learning-profile
 */
studentLearningProfileRouter.patch(
  "/student-learning-profile",
  loadAccountStatus,
  rejectSuspended,
  async (req: AuthenticatedRequest, res) => {
    const parsed = studentLearningProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
      return;
    }

    const userId = req.user!.id;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, profile_setup_complete")
      .eq("id", userId)
      .maybeSingle();

    if (!profile || profile.role !== "student_provider") {
      res.status(403).json({ error: "Réservé aux comptes élève" });
      return;
    }

    if (!profile.profile_setup_complete) {
      res.status(400).json({
        error: "Complétez d'abord votre profil (identité et campus)",
      });
      return;
    }

    const result = await upsertStudentLearningProfile(
      userId,
      parsed.data,
      true,
    );

    if (!result.ok) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.json({ data: mapStudentLearningProfile(result.data) });
  },
);

