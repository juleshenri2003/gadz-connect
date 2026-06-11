import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getActiveCampusTeachers,
  notifyUsers,
  courseFromNotification,
  loadCampusNotification,
  replacementProposalsAvailable,
} from "../lib/notification-helpers.js";
import {
  acceptReplacementProposal,
  hasProviderScheduleConflict,
  type ReplacementProposalRow,
} from "../lib/replacement-service.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const replacementsRouter = Router();

replacementsRouter.use(requireAuth);

const proposeSchema = z.object({
  message: z.string().max(500).optional(),
});

async function getProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, role, campus_id, first_name, last_name, account_status")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function loadOpenNotification(notificationId: string) {
  return loadCampusNotification(notificationId);
}

function mapProposal(row: Record<string, unknown>): ReplacementProposalRow {
  const provider = Array.isArray(row.proposed_provider)
    ? row.proposed_provider[0]
    : row.proposed_provider;
  return {
    id: row.id as string,
    notification_id: row.notification_id as string,
    original_course_id: row.original_course_id as string,
    proposed_provider_id: row.proposed_provider_id as string,
    message: row.message as string | null,
    status: row.status as string,
    created_at: row.created_at as string,
    proposed_provider: provider as ReplacementProposalRow["proposed_provider"],
  };
}

/**
 * GET /api/replacements/pending-for-student
 */
replacementsRouter.get(
  "/pending-for-student",
  async (req: AuthenticatedRequest, res) => {
    const studentId = req.user!.id;

    const { data: studentCourses, error: coursesError } = await supabaseAdmin
      .from("courses")
      .select("id, subject, scheduled_at")
      .eq("client_id", studentId);

    if (coursesError) {
      res.status(500).json({ error: coursesError.message });
      return;
    }

    const courseIds = (studentCourses ?? []).map((c) => c.id as string);
    if (courseIds.length === 0) {
      res.json({ data: [] });
      return;
    }

    const { data: notifications, error } = await supabaseAdmin
      .from("campus_notifications")
      .select("id, subject, scheduled_at, replacement_status, course_id")
      .in("course_id", courseIds)
      .eq("kind", "prof_unavailable")
      .eq("replacement_status", "open");

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const courseMeta = new Map(
      (studentCourses ?? []).map((c) => [c.id as string, c]),
    );

    const results = [];
    for (const notif of notifications ?? []) {
      const { count, error: proposalError } = await supabaseAdmin
        .from("replacement_proposals")
        .select("id", { count: "exact", head: true })
        .eq("notification_id", notif.id)
        .eq("status", "pending");

      if (proposalError) {
        continue;
      }

      if ((count ?? 0) > 0) {
        const course = courseMeta.get(notif.course_id as string);
        results.push({
          ...notif,
          subject:
            (notif.subject as string | null) ??
            (course?.subject as string | null) ??
            null,
          scheduled_at:
            (notif.scheduled_at as string | null) ??
            (course?.scheduled_at as string | null) ??
            null,
          pendingProposalsCount: count,
        });
      }
    }

    res.json({ data: results });
  },
);

/**
 * GET /api/replacements/:notificationId/proposals
 */
replacementsRouter.get(
  "/:notificationId/proposals",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const notification = await loadOpenNotification(String(req.params.notificationId));
    if (!notification) {
      res.status(404).json({ error: "Notification introuvable" });
      return;
    }

    const course = courseFromNotification(notification);
    const clientId = notification.client_id as string | null | undefined;
    const isClient = clientId === profile.id;
    const isTeacher = profile.role === "teacher";

    if (!isClient && !isTeacher) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    let query = supabaseAdmin
      .from("replacement_proposals")
      .select(
        `
        id, notification_id, original_course_id, proposed_provider_id,
        message, status, created_at,
        proposed_provider:proposed_provider_id (
          first_name, last_name, bio, subjects, hourly_rate
        )
      `,
      )
      .eq("notification_id", notification.id)
      .order("created_at");

    if (isClient) {
      query = query.eq("status", "pending");
    } else if (isTeacher) {
      query = query.eq("proposed_provider_id", profile.id);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: (data ?? []).map((r) => mapProposal(r as Record<string, unknown>)) });
  },
);

/**
 * POST /api/replacements/:notificationId/propose
 */
replacementsRouter.post(
  "/:notificationId/propose",
  async (req: AuthenticatedRequest, res) => {
    const parsed = proposeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed" });
      return;
    }

    const profile = await getProfile(req.user!.id);
    if (!profile || profile.role !== "teacher" || profile.account_status !== "active") {
      res.status(403).json({ error: "Seuls les professeurs actifs peuvent proposer" });
      return;
    }

    if (!(await replacementProposalsAvailable())) {
      res.status(503).json({
        error:
          "Propositions de remplacement indisponibles — exécutez la migration 008_replacement_workflow.sql dans Supabase",
      });
      return;
    }

    const notification = await loadOpenNotification(String(req.params.notificationId));
    if (!notification) {
      res.status(404).json({ error: "Notification introuvable" });
      return;
    }

    if (notification.kind !== "prof_unavailable") {
      res.status(400).json({ error: "Cette alerte ne concerne pas un remplacement prof" });
      return;
    }

    if (notification.replacement_status !== "open") {
      res.status(400).json({ error: "Remplacement déjà pourvu ou clos" });
      return;
    }

    if (notification.declared_by === profile.id) {
      res.status(400).json({ error: "Vous ne pouvez pas vous remplacer vous-même" });
      return;
    }

    const course = courseFromNotification(notification);

    if (!course || course.status !== "awaiting_replacement") {
      res.status(400).json({ error: "Ce cours n'attend plus de remplacement" });
      return;
    }

    const slot = Array.isArray(course.slot) ? course.slot[0] : course.slot;
    if (!slot?.starts_at || !slot?.ends_at) {
      res.status(400).json({ error: "Créneau du cours introuvable" });
      return;
    }

    const conflict = await hasProviderScheduleConflict(
      profile.id,
      slot.starts_at as string,
      slot.ends_at as string,
      course.id as string,
    );

    if (conflict) {
      res.status(409).json({
        error: "Vous avez déjà un cours ou créneau à cet horaire",
      });
      return;
    }

    const { data: proposal, error } = await supabaseAdmin
      .from("replacement_proposals")
      .insert({
        notification_id: notification.id,
        original_course_id: course.id,
        proposed_provider_id: profile.id,
        message: parsed.data.message ?? null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Vous avez déjà proposé pour ce cours" });
        return;
      }
      res.status(500).json({ error: error.message });
      return;
    }

    const profName = `${profile.first_name} ${profile.last_name}`.trim();
    const subject =
      (notification.subject as string) ||
      (course.subject as string) ||
      "Cours";

    const studentId = (notification.client_id ?? course.client_id) as
      | string
      | null
      | undefined;
    if (studentId) {
      await notifyUsers([studentId], {
        campusId: notification.campus_id as string,
        kind: "replacement_proposed",
        title: `Nouvelle proposition — ${subject}`,
        message: `${profName} propose de remplacer le cours « ${subject} ». Consultez vos alertes pour accepter ou refuser.`,
        scheduledAt: notification.scheduled_at as string | null,
        courseId: course.id as string,
        declaredBy: profile.id,
        replacementStatus: "open",
      });
    }

    res.status(201).json({ data: { proposalId: proposal.id } });
  },
);

/**
 * POST /api/replacements/proposals/:id/accept
 */
replacementsRouter.post(
  "/proposals/:id/accept",
  async (req: AuthenticatedRequest, res) => {
    const result = await acceptReplacementProposal(
      String(req.params.id),
      req.user!.id,
    );

    if (!result.ok) {
      res.status(result.status).json({ error: result.message });
      return;
    }

    const { data: proposal } = await supabaseAdmin
      .from("replacement_proposals")
      .select(
        `
        id, proposed_provider_id, notification_id,
        proposed_provider:proposed_provider_id ( first_name, last_name ),
        notification:campus_notifications (
          subject, scheduled_at, declared_by, client_id, campus_id, course_id
        )
      `,
      )
      .eq("id", req.params.id)
      .maybeSingle();

    if (proposal) {
      const provider = Array.isArray(proposal.proposed_provider)
        ? proposal.proposed_provider[0]
        : proposal.proposed_provider;
      const notif = Array.isArray(proposal.notification)
        ? proposal.notification[0]
        : proposal.notification;
      const providerName = provider
        ? `${provider.first_name} ${provider.last_name}`.trim()
        : "Professeur";
      const subject = (notif?.subject as string) ?? "Cours";

      const notifyIds: string[] = [];
      if (notif?.declared_by) notifyIds.push(notif.declared_by as string);
      if (proposal.proposed_provider_id) {
        notifyIds.push(proposal.proposed_provider_id as string);
      }

      await notifyUsers(notifyIds, {
        campusId: notif?.campus_id as string,
        kind: "replacement_accepted",
        title: `Remplacement confirmé — ${subject}`,
        message: `L'élève a choisi ${providerName} pour le cours « ${subject} ». Le créneau est replanifié au même horaire.`,
        scheduledAt: notif?.scheduled_at as string | null,
        courseId: notif?.course_id as string,
        declaredBy: req.user!.id,
        replacementStatus: "filled",
      });

      const { data: declined } = await supabaseAdmin
        .from("replacement_proposals")
        .select("proposed_provider_id")
        .eq("notification_id", proposal.notification_id as string)
        .eq("status", "declined");

      const declinedIds = (declined ?? [])
        .map((d) => d.proposed_provider_id as string)
        .filter((id) => id !== proposal.proposed_provider_id);

      if (declinedIds.length > 0) {
        await notifyUsers(declinedIds, {
          campusId: notif?.campus_id as string,
          kind: "replacement_declined",
          title: `Proposition non retenue — ${subject}`,
          message: `L'élève a choisi un autre professeur pour le cours « ${subject} ».`,
          scheduledAt: notif?.scheduled_at as string | null,
          courseId: notif?.course_id as string,
          declaredBy: req.user!.id,
          replacementStatus: "filled",
        });
      }
    }

    res.json({ data: { courseId: result.courseId } });
  },
);

/**
 * POST /api/replacements/proposals/:id/decline
 */
replacementsRouter.post(
  "/proposals/:id/decline",
  async (req: AuthenticatedRequest, res) => {
    const { data: proposal, error } = await supabaseAdmin
      .from("replacement_proposals")
      .select(
        `
        id, status, proposed_provider_id,
        notification:campus_notifications (
          course_id, subject, campus_id, scheduled_at
        )
      `,
      )
      .eq("id", req.params.id)
      .maybeSingle();

    if (error || !proposal) {
      res.status(404).json({ error: "Proposition introuvable" });
      return;
    }

    const notif = Array.isArray(proposal.notification)
      ? proposal.notification[0]
      : proposal.notification;

    const { data: linkedCourse } = await supabaseAdmin
      .from("courses")
      .select("client_id")
      .eq("id", notif?.course_id as string)
      .maybeSingle();

    if (linkedCourse?.client_id !== req.user!.id) {
      res.status(403).json({ error: "Seul l'élève concerné peut refuser" });
      return;
    }

    if (proposal.status !== "pending") {
      res.status(400).json({ error: "Proposition déjà traitée" });
      return;
    }

    await supabaseAdmin
      .from("replacement_proposals")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    await notifyUsers([proposal.proposed_provider_id as string], {
      campusId: notif?.campus_id as string,
      kind: "replacement_declined",
      title: `Proposition refusée — ${(notif?.subject as string) ?? "Cours"}`,
      message: `L'élève a refusé votre proposition de remplacement.`,
      scheduledAt: notif?.scheduled_at as string | null,
      courseId: notif?.course_id as string,
      declaredBy: req.user!.id,
      replacementStatus: "open",
    });

    res.json({ data: { ok: true } });
  },
);

/**
 * POST /api/replacements/:notificationId/dismiss
 */
replacementsRouter.post(
  "/:notificationId/dismiss",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const notification = await loadOpenNotification(String(req.params.notificationId));
    if (!notification) {
      res.status(404).json({ error: "Notification introuvable" });
      return;
    }

    const isDeclarant = notification.declared_by === profile.id;
    const isAdmin = profile.role === "admin_campus" || profile.role === "admin_general";

    if (!isDeclarant && !isAdmin) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    const course = courseFromNotification(notification);

    if (course) {
      await supabaseAdmin
        .from("courses")
        .update({ status: "cancelled" })
        .eq("id", course.id);

      if (course.slot_id) {
        await supabaseAdmin
          .from("tutor_slots")
          .update({ booked: false, booked_by: null })
          .eq("id", course.slot_id);
      }
    }

    await supabaseAdmin
      .from("replacement_proposals")
      .update({ status: "expired", responded_at: new Date().toISOString() })
      .eq("notification_id", notification.id)
      .eq("status", "pending");

    await supabaseAdmin
      .from("campus_notifications")
      .update({ replacement_status: "dismissed" })
      .eq("id", notification.id);

    res.json({ data: { ok: true } });
  },
);
