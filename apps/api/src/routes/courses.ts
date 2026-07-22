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

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the") ||
    message.includes("schema cache")
  );
}

const COURSE_SELECT_WITH_SESSION =
  "id, status, scheduled_at, campus_id, client_id, provider_id, subject, title, student_confirmed_at, provider_confirmed_at, student_session_confirmed_at, provider_session_confirmed_at, session_confirmation_completed_at, session_dispute_status";

const COURSE_SELECT_LEGACY =
  "id, status, scheduled_at, campus_id, client_id, provider_id, subject, title, student_confirmed_at, provider_confirmed_at";

async function loadCourseForParticipant(courseId: string, userId: string) {
  let course: Record<string, unknown> | null = null;
  let legacySessionStorage = false;

  const withSession = await supabaseAdmin
    .from("courses")
    .select(COURSE_SELECT_WITH_SESSION)
    .eq("id", courseId)
    .maybeSingle();

  if (withSession.error && isMissingColumnError(withSession.error.message)) {
    console.warn(
      "[courses] colonnes post-séance absentes — fallback legacy (appliquez migration 030)",
    );
    const legacy = await supabaseAdmin
      .from("courses")
      .select(COURSE_SELECT_LEGACY)
      .eq("id", courseId)
      .maybeSingle();
    if (legacy.error || !legacy.data) return null;
    course = legacy.data as Record<string, unknown>;
    legacySessionStorage = true;
  } else if (withSession.error || !withSession.data) {
    return null;
  } else {
    course = withSession.data as Record<string, unknown>;
  }

  const isClient = course.client_id === userId;
  const isProvider = course.provider_id === userId;
  if (!isClient && !isProvider) return null;
  return { course, isClient, isProvider, legacySessionStorage };
}

function isPastScheduled(scheduledAt: string | null): boolean {
  if (!scheduledAt) return false;
  return new Date(scheduledAt).getTime() < Date.now();
}

/** Lit les timestamps de confirmation post-séance (ou legacy pré-séance si 030 absente). */
function readSessionConfirmState(
  course: Record<string, unknown>,
  legacySessionStorage: boolean,
) {
  if (legacySessionStorage) {
    return {
      studentAt: (course.student_confirmed_at as string | null) ?? null,
      providerAt: (course.provider_confirmed_at as string | null) ?? null,
      completedAt: null as string | null,
      disputeStatus: "none" as string | null,
    };
  }
  return {
    studentAt: (course.student_session_confirmed_at as string | null) ?? null,
    providerAt: (course.provider_session_confirmed_at as string | null) ?? null,
    completedAt:
      (course.session_confirmation_completed_at as string | null) ?? null,
    disputeStatus: (course.session_dispute_status as string | null) ?? "none",
  };
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

    const { course, isClient, isProvider, legacySessionStorage } = access;
    const status = course.status as string;
    const eligibleStatus =
      status === "awaiting_session_confirmation" ||
      (status === "scheduled" &&
        isPastScheduled(course.scheduled_at as string | null)) ||
      status === "completed";

    if (!eligibleStatus) {
      res.status(400).json({
        error:
          "La confirmation de présence post-séance n'est possible qu'après l'horaire du cours",
      });
      return;
    }

    const state = readSessionConfirmState(course, legacySessionStorage);

    if (state.completedAt || (state.studentAt && state.providerAt)) {
      res.json({
        data: {
          id: course.id,
          student_session_confirmed_at: state.studentAt,
          provider_session_confirmed_at: state.providerAt,
          session_confirmation_completed_at: state.completedAt ?? state.studentAt,
          session_dispute_status: state.disputeStatus,
          payout: { alreadyCompleted: true },
        },
      });
      return;
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {};
    if (isClient) {
      if (state.studentAt) {
        res.status(400).json({ error: "Vous avez déjà confirmé cette séance" });
        return;
      }
      if (legacySessionStorage) update.student_confirmed_at = now;
      else update.student_session_confirmed_at = now;
    }
    if (isProvider) {
      if (state.providerAt) {
        res.status(400).json({ error: "Vous avez déjà confirmé cette séance" });
        return;
      }
      if (legacySessionStorage) update.provider_confirmed_at = now;
      else update.provider_session_confirmed_at = now;
    }

    if (!legacySessionStorage && status === "scheduled") {
      update.status = "awaiting_session_confirmation";
    }

    const studentAt = isClient ? now : state.studentAt;
    const providerAt = isProvider ? now : state.providerAt;
    const bothConfirmed = Boolean(studentAt && providerAt);

    if (bothConfirmed) {
      if (!legacySessionStorage) {
        update.session_confirmation_completed_at = now;
        update.session_dispute_status = "none";
      }
      update.status = "completed";
    }

    const selectCols = legacySessionStorage
      ? "id, status, student_confirmed_at, provider_confirmed_at"
      : "id, status, student_session_confirmed_at, provider_session_confirmed_at, session_confirmation_completed_at, session_dispute_status";

    let { data: updated, error } = await supabaseAdmin
      .from("courses")
      .update(update)
      .eq("id", course.id as string)
      .select(selectCols)
      .single();

    // Enum awaiting_session_confirmation absent (migration 030).
    if (
      error &&
      update.status === "awaiting_session_confirmation" &&
      (error.message.includes("invalid input value for enum") ||
        error.message.includes("awaiting_session_confirmation"))
    ) {
      const retryUpdate: Record<string, unknown> = { ...update };
      if (bothConfirmed) retryUpdate.status = "completed";
      else delete retryUpdate.status;
      const retry = await supabaseAdmin
        .from("courses")
        .update(retryUpdate)
        .eq("id", course.id as string)
        .select(selectCols)
        .single();
      updated = retry.data;
      error = retry.error;
    }

    if (error || !updated) {
      res.status(500).json({ error: error?.message ?? "Erreur serveur" });
      return;
    }

    const updatedRow = updated as unknown as Record<string, unknown>;
    const useLegacyResponse =
      legacySessionStorage ||
      !("student_session_confirmed_at" in updatedRow);
    const responsePayload = useLegacyResponse
      ? {
          id: updatedRow.id,
          status: updatedRow.status,
          student_session_confirmed_at:
            (updatedRow.student_confirmed_at as string | null) ??
            (updatedRow.student_session_confirmed_at as string | null) ??
            null,
          provider_session_confirmed_at:
            (updatedRow.provider_confirmed_at as string | null) ??
            (updatedRow.provider_session_confirmed_at as string | null) ??
            null,
          session_confirmation_completed_at: bothConfirmed ? now : null,
          session_dispute_status: "none",
        }
      : {
          id: updatedRow.id,
          status: updatedRow.status,
          student_session_confirmed_at:
            updatedRow.student_session_confirmed_at ?? null,
          provider_session_confirmed_at:
            updatedRow.provider_session_confirmed_at ?? null,
          session_confirmation_completed_at:
            updatedRow.session_confirmation_completed_at ?? null,
          session_dispute_status: updatedRow.session_dispute_status ?? "none",
        };

    let payout: { ok: boolean; error?: string; channel?: string } | null = null;
    if (bothConfirmed) {
      try {
        const result = await payoutAfterSessionConfirmation(
          course.id as string,
          {
            allowLegacyConfirmFields: useLegacyResponse,
          },
        );
        payout = result.ok
          ? { ok: true, channel: result.channel }
          : { ok: false, error: result.error };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Échec du reversement";
        console.error("[courses] confirm-attendance payout:", message);
        payout = { ok: false, error: message };
      }
    }

    res.json({ data: { ...responsePayload, payout } });
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
