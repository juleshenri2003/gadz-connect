import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { payoutAfterSessionConfirmation } from "../lib/billing/session-payout.js";
import { notifyUsers } from "../lib/notification-helpers.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const coursesRouter = Router();

coursesRouter.use(requireAuth);

async function getProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, role, campus_id, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function loadCourseForParticipant(courseId: string, userId: string) {
  const { data: course, error } = await supabaseAdmin
    .from("courses")
    .select(
      "id, status, scheduled_at, campus_id, client_id, provider_id, subject, title, student_confirmed_at, provider_confirmed_at, student_session_confirmed_at, provider_session_confirmed_at, session_confirmation_completed_at, session_dispute_status",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error || !course) return null;
  const isClient = course.client_id === userId;
  const isProvider = course.provider_id === userId;
  if (!isClient && !isProvider) return null;
  return { course, isClient, isProvider };
}

function isPastScheduled(scheduledAt: string | null): boolean {
  if (!scheduledAt) return false;
  return new Date(scheduledAt).getTime() < Date.now();
}

/**
 * POST /api/courses/:courseId/confirm-session
 * Confirmation de présence ~24 h avant (pré-cours).
 */
coursesRouter.post(
  "/:courseId/confirm-session",
  async (req: AuthenticatedRequest, res) => {
    const access = await loadCourseForParticipant(
      req.params.courseId as string,
      req.user!.id,
    );
    if (!access) {
      res.status(404).json({ error: "Cours introuvable" });
      return;
    }

    const { course, isClient, isProvider } = access;
    if (course.status !== "scheduled") {
      res.status(400).json({
        error: "Seuls les cours planifiés peuvent être confirmés",
      });
      return;
    }

    const now = new Date().toISOString();
    const update: Record<string, string> = {};
    if (isClient) update.student_confirmed_at = now;
    if (isProvider) update.provider_confirmed_at = now;

    const { data: updated, error } = await supabaseAdmin
      .from("courses")
      .update(update)
      .eq("id", course.id)
      .select(
        "id, student_confirmed_at, provider_confirmed_at, status, scheduled_at",
      )
      .single();

    if (error || !updated) {
      res.status(500).json({ error: error?.message ?? "Erreur serveur" });
      return;
    }

    res.json({ data: updated });
  },
);

/**
 * POST /api/courses/:courseId/confirm-attendance
 * Confirmation post-séance : le cours a bien eu lieu (élève + prof).
 * Quand les deux ont confirmé → déclenche le payout professeur.
 */
coursesRouter.post(
  "/:courseId/confirm-attendance",
  async (req: AuthenticatedRequest, res) => {
    const access = await loadCourseForParticipant(
      req.params.courseId as string,
      req.user!.id,
    );
    if (!access) {
      res.status(404).json({ error: "Cours introuvable" });
      return;
    }

    const { course, isClient, isProvider } = access;
    const eligibleStatus =
      course.status === "awaiting_session_confirmation" ||
      (course.status === "scheduled" &&
        isPastScheduled(course.scheduled_at as string | null)) ||
      course.status === "completed";

    if (!eligibleStatus) {
      res.status(400).json({
        error:
          "La confirmation de présence post-séance n'est possible qu'après l'horaire du cours",
      });
      return;
    }

    if (course.session_confirmation_completed_at) {
      res.json({
        data: {
          id: course.id,
          student_session_confirmed_at: course.student_session_confirmed_at,
          provider_session_confirmed_at: course.provider_session_confirmed_at,
          session_confirmation_completed_at:
            course.session_confirmation_completed_at,
          payout: { alreadyCompleted: true },
        },
      });
      return;
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {};
    if (isClient) {
      if (course.student_session_confirmed_at) {
        res.status(400).json({ error: "Vous avez déjà confirmé cette séance" });
        return;
      }
      update.student_session_confirmed_at = now;
    }
    if (isProvider) {
      if (course.provider_session_confirmed_at) {
        res.status(400).json({ error: "Vous avez déjà confirmé cette séance" });
        return;
      }
      update.provider_session_confirmed_at = now;
    }

    if (course.status === "scheduled") {
      update.status = "awaiting_session_confirmation";
    }

    const studentAt = isClient
      ? now
      : (course.student_session_confirmed_at as string | null);
    const providerAt = isProvider
      ? now
      : (course.provider_session_confirmed_at as string | null);
    const bothConfirmed = Boolean(studentAt && providerAt);

    if (bothConfirmed) {
      update.session_confirmation_completed_at = now;
      update.status = "completed";
      update.session_dispute_status = "none";
    }

    const { data: updated, error } = await supabaseAdmin
      .from("courses")
      .update(update)
      .eq("id", course.id)
      .select(
        "id, status, student_session_confirmed_at, provider_session_confirmed_at, session_confirmation_completed_at, session_dispute_status",
      )
      .single();

    if (error || !updated) {
      res.status(500).json({ error: error?.message ?? "Erreur serveur" });
      return;
    }

    let payout: { ok: boolean; error?: string; channel?: string } | null = null;
    if (bothConfirmed) {
      const result = await payoutAfterSessionConfirmation(course.id as string);
      payout = result.ok
        ? { ok: true, channel: result.channel }
        : { ok: false, error: result.error };
    }

    res.json({ data: { ...updated, payout } });
  },
);

const pingSchema = z.object({
  message: z.string().max(500).optional(),
});

/**
 * POST /api/courses/:courseId/ping-session
 * Message « toujours bon pour demain ? » à l'autre partie.
 */
coursesRouter.post(
  "/:courseId/ping-session",
  async (req: AuthenticatedRequest, res) => {
    const parsed = pingSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed" });
      return;
    }

    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const access = await loadCourseForParticipant(
      req.params.courseId as string,
      req.user!.id,
    );
    if (!access) {
      res.status(404).json({ error: "Cours introuvable" });
      return;
    }

    const { course, isClient, isProvider } = access;
    if (course.status !== "scheduled") {
      res.status(400).json({ error: "Ce cours n'est plus planifié" });
      return;
    }

    const recipientId = isClient
      ? (course.provider_id as string)
      : isProvider
        ? (course.client_id as string)
        : null;

    if (!recipientId) {
      res.status(400).json({ error: "Destinataire introuvable" });
      return;
    }

    const subject =
      (course.subject as string) || (course.title as string) || "Cours";
    const declarantName =
      `${profile.first_name} ${profile.last_name}`.trim() || "Participant";
    const when = course.scheduled_at
      ? new Date(course.scheduled_at as string).toLocaleString("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "date à confirmer";

    const custom = parsed.data.message?.trim();
    const message =
      custom ??
      `${declarantName} vous demande de confirmer la séance « ${subject} » du ${when}.`;

    await notifyUsers([recipientId], {
      campusId: course.campus_id as string,
      courseId: course.id as string,
      kind: "course_confirmation_reminder",
      title: `Rappel séance — ${subject}`,
      message,
      scheduledAt: course.scheduled_at as string | null,
      declaredBy: profile.id as string,
    });

    res.json({ data: { sent: true } });
  },
);

/**
 * GET /api/courses/:courseId/replacement-proposals
 * Liste des candidats remplaçants (élève ou admin).
 */
coursesRouter.get(
  "/:courseId/replacement-proposals",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id, client_id, campus_id, status")
      .eq("id", req.params.courseId)
      .maybeSingle();

    if (!course) {
      res.status(404).json({ error: "Cours introuvable" });
      return;
    }

    const isAdmin =
      profile.role === "admin_general" ||
      profile.role === "admin_campus";
    const isClient = course.client_id === profile.id;

    if (!isClient && !isAdmin) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    if (course.status !== "awaiting_replacement") {
      res.json({ data: [] });
      return;
    }

    const { data: proposals, error } = await supabaseAdmin
      .from("replacement_proposals")
      .select(
        `
        id, status, message, created_at, responded_at,
        proposed_provider:proposed_provider_id ( id, first_name, last_name )
      `,
      )
      .eq("original_course_id", course.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: proposals ?? [] });
  },
);
