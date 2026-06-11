import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  findOpenProfUnavailableNotification,
  getActiveCampusTeachers,
  getSiteAdministratorIds,
  insertCampusNotification,
  insertNotificationRecipients,
  uniqueRecipientIds,
} from "../lib/notification-helpers.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

const declareSchema = z.object({
  courseId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

async function getProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, role, campus_id, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

/**
 * GET /api/notifications
 */
notificationsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from("notification_recipients")
    .select(
      `
      id,
      read_at,
      created_at,
      notification:campus_notifications (
        id,
        kind,
        title,
        message,
        scheduled_at,
        replacement_status,
        reason,
        created_at,
        declared_by,
        course_id,
        campus:campus_id ( name ),
        declarant:declared_by ( first_name, last_name, role ),
        course:course_id ( subject, client_id )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[notifications] list:", error.message);
    res.status(500).json({ error: error.message });
    return;
  }

  const rows = (data ?? []).map((row) => {
    const raw = row.notification as unknown as Record<string, unknown> | null;
    if (!raw) return row;

    const course = Array.isArray(raw.course) ? raw.course[0] : raw.course;
    const courseRow = course as
      | { subject?: string | null; client_id?: string | null }
      | null
      | undefined;

    const { course: _course, ...notification } = raw;

    return {
      ...row,
      notification: {
        ...notification,
        subject:
          (notification.subject as string | undefined) ??
          courseRow?.subject ??
          null,
        client_id:
          (notification.client_id as string | undefined) ??
          courseRow?.client_id ??
          null,
      },
    };
  });

  res.json({ data: rows });
});

/**
 * GET /api/notifications/unread-count
 */
notificationsRouter.get("/unread-count", async (req: AuthenticatedRequest, res) => {
  const { count, error } = await supabaseAdmin
    .from("notification_recipients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", req.user!.id)
    .is("read_at", null);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data: { count: count ?? 0 } });
});

/**
 * PATCH /api/notifications/:recipientId/read
 */
notificationsRouter.patch(
  "/:recipientId/read",
  async (req: AuthenticatedRequest, res) => {
    const { data, error } = await supabaseAdmin
      .from("notification_recipients")
      .update({ read_at: new Date().toISOString() })
      .eq("id", req.params.recipientId)
      .eq("user_id", req.user!.id)
      .select("id, read_at")
      .maybeSingle();

    if (error || !data) {
      res.status(404).json({ error: "Notification introuvable" });
      return;
    }

    res.json({ data });
  },
);

/**
 * POST /api/notifications/declare-unavailable
 */
notificationsRouter.post(
  "/declare-unavailable",
  async (req: AuthenticatedRequest, res) => {
    const parsed = declareSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed" });
      return;
    }

    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select(
        `
        id, title, subject, status, scheduled_at, campus_id, slot_id,
        provider_id, client_id,
        provider:provider_id ( first_name, last_name ),
        client:client_id ( first_name, last_name )
      `,
      )
      .eq("id", parsed.data.courseId)
      .maybeSingle();

    if (courseError || !course) {
      res.status(404).json({ error: "Cours introuvable" });
      return;
    }

    if (course.campus_id !== profile.campus_id) {
      res.status(403).json({ error: "Cours hors de votre campus" });
      return;
    }

    const isProvider = course.provider_id === profile.id;
    const isClient = course.client_id === profile.id;

    if (!isProvider && !isClient) {
      res.status(403).json({ error: "Vous ne participez pas à ce cours" });
      return;
    }

    const kind = isProvider ? "prof_unavailable" : "student_unavailable";
    const repairMissingNotification =
      kind === "prof_unavailable" && course.status === "awaiting_replacement";

    if (repairMissingNotification) {
      const existing = await findOpenProfUnavailableNotification(
        course.id as string,
      );
      if (existing) {
        res.status(400).json({
          error:
            "Remplacement déjà en cours — consultez Alertes campus pour le suivi",
        });
        return;
      }
    } else if (course.status !== "scheduled") {
      res.status(400).json({
        error: "Ce cours n'est plus planifié (déjà annulé ou terminé)",
      });
      return;
    }

    const declarantName = `${profile.first_name} ${profile.last_name}`.trim();
    const scheduledLabel = course.scheduled_at
      ? new Date(course.scheduled_at as string).toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "date à confirmer";

    const provider = Array.isArray(course.provider)
      ? course.provider[0]
      : course.provider;
    const client = Array.isArray(course.client)
      ? course.client[0]
      : course.client;

    const providerName = provider
      ? `${provider.first_name} ${provider.last_name}`.trim()
      : "Professeur";
    const clientName = client
      ? `${client.first_name} ${client.last_name}`.trim()
      : "Élève";

    const subject =
      (course.subject as string) || (course.title as string) || "Cours";

    const title =
      kind === "prof_unavailable"
        ? `Remplacement professeur — ${subject}`
        : `Remplacement élève — ${subject}`;

    const message =
      kind === "prof_unavailable"
        ? `${declarantName} est indisponible pour le cours « ${subject} » prévu le ${scheduledLabel} avec ${clientName}. Le cours est en attente de remplacement : l'élève sera alerté pour choisir un remplaçant parmi les propositions des professeurs du campus.`
        : `${declarantName} est indisponible pour le cours « ${subject} » prévu le ${scheduledLabel} avec ${providerName}. Merci de proposer un remplacement si possible.`;

    const notificationPayload: Record<string, unknown> = {
      campus_id: course.campus_id,
      course_id: course.id,
      kind,
      title,
      message,
      scheduled_at: course.scheduled_at,
      declared_by: profile.id,
      replacement_status: kind === "prof_unavailable" ? "open" : "dismissed",
      reason: parsed.data.reason ?? null,
      original_provider_id: course.provider_id,
      client_id: course.client_id,
      subject,
      replacement_course_id: course.id,
    };

    const notification = await insertCampusNotification(notificationPayload);

    if (!notification) {
      res.status(500).json({
        error:
          "Impossible de créer l'alerte — vérifiez que la migration 004_campus_notifications.sql est appliquée",
      });
      return;
    }

    let recipientIds: string[] = [];

    if (kind === "prof_unavailable") {
      const teachers = await getActiveCampusTeachers(
        course.campus_id as string,
        profile.id,
      );
      const admins = await getSiteAdministratorIds(
        course.campus_id as string,
        profile.id,
      );
      recipientIds = uniqueRecipientIds([
        profile.id,
        ...(course.client_id ? [course.client_id as string] : []),
        ...teachers,
        ...admins,
      ]);
    } else {
      const { data: campusMembers } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("campus_id", course.campus_id)
        .neq("id", profile.id);
      recipientIds = (campusMembers ?? []).map((m) => m.id as string);
    }

    await insertNotificationRecipients(notification.id, recipientIds);

    if (kind === "prof_unavailable" && !repairMissingNotification) {
      const { error: statusError } = await supabaseAdmin
        .from("courses")
        .update({ status: "awaiting_replacement" })
        .eq("id", course.id);

      if (statusError) {
        res.status(500).json({ error: statusError.message });
        return;
      }
    } else if (kind === "student_unavailable") {
      const { error: cancelError } = await supabaseAdmin
        .from("courses")
        .update({ status: "cancelled" })
        .eq("id", course.id);

      if (cancelError) {
        res.status(500).json({ error: cancelError.message });
        return;
      }

      if (course.slot_id) {
        await supabaseAdmin
          .from("tutor_slots")
          .update({ booked: false, booked_by: null })
          .eq("id", course.slot_id);
      }
    }

    res.status(201).json({
      data: {
        notificationId: notification.id as string,
        recipientsCount: recipientIds.length,
        kind,
        title,
      },
    });
  },
);
