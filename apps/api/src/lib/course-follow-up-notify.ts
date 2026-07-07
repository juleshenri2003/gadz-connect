import {
  getSiteAdministratorIds,
  insertCampusNotification,
  insertNotificationRecipients,
} from "./notification-helpers.js";
import { supabaseAdmin } from "./supabase.js";

interface CourseFollowUpNotifyContext {
  course: {
    id: string;
    campus_id: string;
    scheduled_at: string | null;
    subject: string | null;
    title: string;
    client_id: string | null;
    provider_id: string | null;
  };
  declaredBy: string;
  providerName: string;
  studentName: string;
  subject: string;
  materialLabel: string;
}

export async function notifyCourseFollowUpPublished(
  ctx: CourseFollowUpNotifyContext,
): Promise<void> {
  if (!ctx.course.client_id) return;

  const scheduledLabel = ctx.course.scheduled_at
    ? new Date(ctx.course.scheduled_at).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "date à confirmer";

  const message = `${ctx.providerName} a déposé « ${ctx.materialLabel} » pour le cours « ${ctx.subject} » (${scheduledLabel}). Consultez votre répertoire ou le suivi des cours.`;

  const notification = await insertCampusNotification({
    campus_id: ctx.course.campus_id,
    course_id: ctx.course.id,
    kind: "course_follow_up",
    title: `Nouveau document — ${ctx.subject}`,
    message,
    scheduled_at: ctx.course.scheduled_at,
    declared_by: ctx.declaredBy,
    replacement_status: "dismissed",
    reason: null,
  });

  if (!notification) return;

  await insertNotificationRecipients(notification.id, [ctx.course.client_id]);
}

export async function notifyCourseExchangeMessage(
  course: {
    id: string;
    campus_id: string;
    scheduled_at: string | null;
    subject: string | null;
    title: string;
    client_id: string | null;
    provider_id: string | null;
  },
  authorId: string,
  authorName: string,
  recipientId: string,
  bodyPreview: string,
): Promise<void> {
  const subject =
    (course.subject as string) || (course.title as string) || "Cours";
  const preview =
    bodyPreview.length > 120 ? `${bodyPreview.slice(0, 117)}…` : bodyPreview;

  const notification = await insertCampusNotification({
    campus_id: course.campus_id,
    course_id: course.id,
    kind: "course_exchange_message",
    title: `Message — ${subject}`,
    message: `${authorName} : « ${preview} »`,
    scheduled_at: course.scheduled_at,
    declared_by: authorId,
    replacement_status: "dismissed",
    reason: null,
  });

  if (!notification) return;

  await insertNotificationRecipients(notification.id, [recipientId]);
}

export async function loadCourseNotifyContext(courseId: string) {
  const { data: course } = await supabaseAdmin
    .from("courses")
    .select(
      `
      id, campus_id, scheduled_at, subject, title, client_id, provider_id,
      client:client_id ( first_name, last_name ),
      provider:provider_id ( first_name, last_name )
    `,
    )
    .eq("id", courseId)
    .maybeSingle();

  if (!course) return null;

  const client = Array.isArray(course.client) ? course.client[0] : course.client;
  const provider = Array.isArray(course.provider)
    ? course.provider[0]
    : course.provider;

  const subject =
    (course.subject as string) || (course.title as string) || "Cours";
  const studentName = client
    ? `${client.first_name} ${client.last_name}`.trim()
    : "Élève";
  const providerName = provider
    ? `${provider.first_name} ${provider.last_name}`.trim()
    : "Professeur";

  return { course, subject, studentName, providerName };
}
