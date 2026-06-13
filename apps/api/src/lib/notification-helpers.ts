import { getRhAllowedEmails } from "./rh-access.js";
import { supabaseAdmin } from "./supabase.js";

export function uniqueRecipientIds(
  userIds: string[],
  excludeUserId?: string,
): string[] {
  const ids = new Set(userIds);
  if (excludeUserId) ids.delete(excludeUserId);
  return [...ids];
}

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("Could not find the") ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

/** Insère une alerte campus (compatible migration 004 seule si 008 absente). */
export async function insertCampusNotification(
  payload: Record<string, unknown>,
): Promise<{ id: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("campus_notifications")
    .insert(payload)
    .select("id")
    .single();

  if (!error && data) {
    return data as { id: string };
  }

  if (!isMissingColumnError(error?.message)) {
    console.error("[notifications] insert:", error?.message);
    return null;
  }

  const basePayload = {
    campus_id: payload.campus_id,
    course_id: payload.course_id,
    kind: payload.kind,
    title: payload.title,
    message: payload.message,
    scheduled_at: payload.scheduled_at,
    declared_by: payload.declared_by,
    replacement_status: payload.replacement_status,
    reason: payload.reason,
  };

  const { data: fallback, error: fallbackError } = await supabaseAdmin
    .from("campus_notifications")
    .insert(basePayload)
    .select("id")
    .single();

  if (fallbackError || !fallback) {
    console.error("[notifications] insert fallback:", fallbackError?.message);
    return null;
  }

  console.warn(
    "[notifications] colonnes migration 008 absentes — exécutez 008_replacement_workflow.sql",
  );
  return fallback as { id: string };
}

export async function findOpenProfUnavailableNotification(
  courseId: string,
): Promise<{ id: string } | null> {
  const { data } = await supabaseAdmin
    .from("campus_notifications")
    .select("id")
    .eq("course_id", courseId)
    .eq("kind", "prof_unavailable")
    .eq("replacement_status", "open")
    .maybeSingle();

  return data ? (data as { id: string }) : null;
}

export async function insertNotificationRecipients(
  notificationId: string,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;

  const rows = userIds.map((userId) => ({
    notification_id: notificationId,
    user_id: userId,
  }));

  const { error } = await supabaseAdmin
    .from("notification_recipients")
    .insert(rows);

  if (error) {
    console.error("[notifications] recipients:", error.message);
  }
}

export async function notifyUsers(
  userIds: string[],
  payload: {
    campusId: string;
    kind: string;
    title: string;
    message: string;
    scheduledAt?: string | null;
    courseId?: string | null;
    declaredBy: string;
    replacementStatus?: string;
  },
): Promise<string | null> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return null;

  const { data: notification, error } = await supabaseAdmin
    .from("campus_notifications")
    .insert({
      campus_id: payload.campusId,
      course_id: payload.courseId ?? null,
      kind: payload.kind,
      title: payload.title,
      message: payload.message,
      scheduled_at: payload.scheduledAt ?? null,
      declared_by: payload.declaredBy,
      replacement_status: payload.replacementStatus ?? "open",
    })
    .select("id")
    .single();

  if (error || !notification) {
    console.error("[notifications] insert:", error?.message);
    return null;
  }

  await insertNotificationRecipients(
    notification.id as string,
    uniqueIds,
  );

  return notification.id as string;
}

export async function getActiveCampusTeachers(
  campusId: string,
  excludeUserId?: string,
): Promise<string[]> {
  let query = supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("campus_id", campusId)
    .eq("role", "teacher")
    .eq("account_status", "active")
    .eq("profile_setup_complete", true);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[replacements] teachers:", error.message);
    return [];
  }

  return (data ?? []).map((r) => r.id as string);
}

/** Admins plateforme (admin_general, admin_campus du campus, e-mails RH). */
export async function getSiteAdministratorIds(
  campusId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const ids = new Set<string>();

  const { data: roleAdmins, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, campus_id")
    .in("role", ["admin_general", "admin_campus"]);

  if (error) {
    console.error("[notifications] admins:", error.message);
  } else {
    for (const row of roleAdmins ?? []) {
      if (row.role === "admin_general") {
        ids.add(row.id as string);
      } else if (row.campus_id === campusId) {
        ids.add(row.id as string);
      }
    }
  }

  const rhEmails = new Set(getRhAllowedEmails());
  if (rhEmails.size > 0) {
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.listUsers({ page, perPage });

      if (authError) {
        console.error("[notifications] auth users:", authError.message);
        break;
      }

      for (const user of authData.users) {
        if (user.email && rhEmails.has(user.email.toLowerCase())) {
          ids.add(user.id);
        }
      }

      if (authData.users.length < perPage) break;
      page += 1;
    }
  }

  return uniqueRecipientIds([...ids], excludeUserId);
}

export type NotificationWithCourse = Record<string, unknown> & {
  id: string;
  course_id: string | null;
  course?: unknown;
  client_id?: string | null;
  subject?: string | null;
  original_provider_id?: string | null;
};

export function courseFromNotification(
  notification: NotificationWithCourse,
): Record<string, unknown> | null {
  const course = notification.course;
  if (!course) return null;
  return (Array.isArray(course) ? course[0] : course) as Record<string, unknown>;
}

export function enrichNotificationWithCourse(
  notification: NotificationWithCourse,
): NotificationWithCourse {
  const course = courseFromNotification(notification);
  if (!course) return notification;

  return {
    ...notification,
    client_id:
      (notification.client_id as string | null | undefined) ??
      (course.client_id as string | null) ??
      null,
    subject:
      (notification.subject as string | null | undefined) ??
      (course.subject as string | null) ??
      null,
    original_provider_id:
      (notification.original_provider_id as string | null | undefined) ??
      (course.provider_id as string | null) ??
      null,
    scheduled_at:
      (notification.scheduled_at as string | null | undefined) ??
      (course.scheduled_at as string | null) ??
      null,
  };
}

export async function loadCampusNotification(
  notificationId: string,
): Promise<NotificationWithCourse | null> {
  const { data, error } = await supabaseAdmin
    .from("campus_notifications")
    .select(
      `
      id, kind, replacement_status, campus_id, course_id,
      declared_by, scheduled_at, reason, title, message,
      course:course_id (
        id, status, slot_id, client_id, provider_id, subject, scheduled_at,
        slot:slot_id ( starts_at, ends_at )
      )
    `,
    )
    .eq("id", notificationId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[notifications] load:", error.message);
    }
    return null;
  }

  return enrichNotificationWithCourse(data as NotificationWithCourse);
}

export async function replacementProposalsAvailable(): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("replacement_proposals")
    .select("id")
    .limit(0);
  return !error;
}

export async function replacementTeacherDeclinesAvailable(): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("replacement_teacher_declines")
    .select("notification_id")
    .limit(0);
  return !error;
}

export function isNotificationClient(
  notification: NotificationWithCourse,
  userId: string,
): boolean {
  const course = courseFromNotification(notification);
  const clientId =
    (notification.client_id as string | null | undefined) ??
    (course?.client_id as string | null | undefined);
  return clientId === userId;
}

/** Notification personnelle lors de l'activation automatique du compte prestataire. */
export async function notifyAccountActivated(
  userId: string,
  campusId: string,
): Promise<void> {
  await notifyUsers([userId], {
    campusId,
    kind: "account_activated",
    title: "Compte prestataire activé",
    message:
      "Votre SIRET a été enregistré et votre compte est actif. Configurez Stripe et publiez vos créneaux pour recevoir des réservations.",
    declaredBy: userId,
  });
}
