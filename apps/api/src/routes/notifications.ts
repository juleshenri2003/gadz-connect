import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  computeTeacherActionCount,
  enrichNotificationsForUser,
} from "../lib/notification-enrichment.js";
import {
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

const NOTIFICATIONS_SELECT_WITH_CLIENT = `
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
    course:course_id (
      subject,
      client_id,
      client:client_id ( first_name, last_name )
    )
  )
`;

const NOTIFICATIONS_SELECT_BASE = `
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
`;

function isSchemaJoinError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("Could not find a relationship") ||
    message.includes("schema cache")
  );
}

async function fetchNotificationRecipients(userId: string) {
  const withClient = await supabaseAdmin
    .from("notification_recipients")
    .select(NOTIFICATIONS_SELECT_WITH_CLIENT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!withClient.error) return withClient;

  if (!isSchemaJoinError(withClient.error.message)) {
    return withClient;
  }

  console.warn(
    "[notifications] jointure client indisponible — repli sans nom élève:",
    withClient.error.message,
  );

  return supabaseAdmin
    .from("notification_recipients")
    .select(NOTIFICATIONS_SELECT_BASE)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
}

/**
 * GET /api/notifications
 */
notificationsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const profile = await getProfile(userId);

  const { data, error } = await fetchNotificationRecipients(userId);

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
      | {
          subject?: string | null;
          client_id?: string | null;
          client?:
            | { first_name?: string | null; last_name?: string | null }
            | { first_name?: string | null; last_name?: string | null }[]
            | null;
        }
      | null
      | undefined;
    const courseClient = courseRow?.client;
    const clientRow = Array.isArray(courseClient)
      ? courseClient[0]
      : courseClient;

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
        client:
          clientRow?.first_name || clientRow?.last_name ? clientRow : null,
      },
    };
  });

  const enriched = await enrichNotificationsForUser(
    rows as Array<{
      read_at: string | null;
      notification: Record<string, unknown> | null;
    }>,
    profile,
  );
  res.json({ data: enriched });
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
 * GET /api/notifications/action-count
 */
notificationsRouter.get("/action-count", async (req: AuthenticatedRequest, res) => {
  try {
    const count = await computeTeacherActionCount(req.user!.id);
    res.json({ data: { count } });
  } catch (err) {
    console.error("[notifications] action-count:", err);
    res.status(500).json({ error: "Impossible de calculer les actions requises" });
  }
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

    if (course.status !== "scheduled") {
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

    const title = `Séance annulée — ${subject}`;

    const message =
      kind === "prof_unavailable"
        ? `${declarantName} a annulé le cours « ${subject} » prévu le ${scheduledLabel} avec ${clientName}. Le créneau est libéré — l'élève peut réserver un autre tuteur sur la marketplace.`
        : `${declarantName} a annulé le cours « ${subject} » prévu le ${scheduledLabel} avec ${providerName}. Le créneau est libéré.`;

    const notificationPayload: Record<string, unknown> = {
      campus_id: course.campus_id,
      course_id: course.id,
      kind,
      title,
      message,
      scheduled_at: course.scheduled_at,
      declared_by: profile.id,
      replacement_status: "dismissed",
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

    const admins = await getSiteAdministratorIds(
      course.campus_id as string,
      profile.id,
    );

    const recipientIds = uniqueRecipientIds([
      ...(kind === "prof_unavailable"
        ? [
            ...(course.client_id ? [course.client_id as string] : []),
            ...(course.provider_id ? [course.provider_id as string] : []),
          ]
        : [
            ...(course.provider_id ? [course.provider_id as string] : []),
            ...(course.client_id ? [course.client_id as string] : []),
          ]),
      ...admins,
    ]);

    await insertNotificationRecipients(notification.id, recipientIds);

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
