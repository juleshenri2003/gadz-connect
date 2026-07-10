import {
  getSiteAdministratorIds,
  insertCampusNotification,
  insertNotificationRecipients,
  uniqueRecipientIds,
} from "./notification-helpers.js";
import { supabaseAdmin } from "./supabase.js";

interface CourseNotifyContext {
  id: string;
  campus_id: string;
  scheduled_at: string | null;
  subject: string | null;
  title: string;
  client_id: string | null;
  provider_id: string | null;
}

function courseSubject(course: CourseNotifyContext): string {
  return course.subject || course.title || "Cours";
}

function scheduledLabel(scheduledAt: string | null): string {
  if (!scheduledAt) return "date à confirmer";
  return new Date(scheduledAt).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function getCampusTeacherIds(
  campusId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("campus_id", campusId)
    .eq("role", "teacher")
    .eq("account_status", "active");

  if (error) {
    console.error("[course-session] campus teachers:", error.message);
    return [];
  }

  const ids = (data ?? []).map((row) => row.id as string);
  return excludeUserId
    ? ids.filter((id) => id !== excludeUserId)
    : ids;
}

export async function notifyCourseConfirmationReminder(
  course: CourseNotifyContext,
): Promise<void> {
  const subject = courseSubject(course);
  const when = scheduledLabel(course.scheduled_at);
  const recipientIds = uniqueRecipientIds(
    [course.client_id, course.provider_id].filter(Boolean) as string[],
  );
  if (recipientIds.length === 0) return;

  const notification = await insertCampusNotification({
    campus_id: course.campus_id,
    course_id: course.id,
    kind: "course_confirmation_reminder",
    title: `Confirmez votre présence — ${subject}`,
    message: `Séance prévue le ${when}. Professeur et élève doivent confirmer leur présence avant le début du cours.`,
    scheduled_at: course.scheduled_at,
    declared_by: course.provider_id,
    replacement_status: "dismissed",
    reason: null,
    client_id: course.client_id,
    subject,
    original_provider_id: course.provider_id,
  });

  if (!notification) return;
  await insertNotificationRecipients(notification.id, recipientIds);
}

export async function notifyCourseConfirmationEscalation(
  course: CourseNotifyContext,
  missingParty: "student" | "provider" | "both",
): Promise<void> {
  const subject = courseSubject(course);
  const when = scheduledLabel(course.scheduled_at);
  const missingLabel =
    missingParty === "both"
      ? "le professeur et l'élève"
      : missingParty === "student"
        ? "l'élève"
        : "le professeur";

  const admins = await getSiteAdministratorIds(course.campus_id);
  const recipientIds = uniqueRecipientIds([
    ...(course.client_id ? [course.client_id] : []),
    ...admins,
  ]);

  const notification = await insertCampusNotification({
    campus_id: course.campus_id,
    course_id: course.id,
    kind: "course_confirmation_escalation",
    title: `Confirmation incomplète — ${subject}`,
    message: `À 2 h du cours (${when}), ${missingLabel} n'a pas encore confirmé sa présence. Intervention admin recommandée.`,
    scheduled_at: course.scheduled_at,
    declared_by: course.provider_id,
    replacement_status: "dismissed",
    reason: null,
    client_id: course.client_id,
    subject,
    original_provider_id: course.provider_id,
  });

  if (!notification) return;
  await insertNotificationRecipients(notification.id, recipientIds);
}

export async function notifyReplacementOfferBroadcast(
  course: CourseNotifyContext,
  originalProviderName: string,
): Promise<string | null> {
  const subject = courseSubject(course);
  const when = scheduledLabel(course.scheduled_at);
  const teacherIds = await getCampusTeacherIds(
    course.campus_id,
    course.provider_id ?? undefined,
  );
  if (teacherIds.length === 0) return null;

  const notification = await insertCampusNotification({
    campus_id: course.campus_id,
    course_id: course.id,
    kind: "replacement_offer",
    title: `Cours à reprendre — ${subject}`,
    message: `${originalProviderName} a annulé le cours du ${when}. Un remplaçant est recherché sur le campus — proposez-vous si vous êtes disponible.`,
    scheduled_at: course.scheduled_at,
    declared_by: course.provider_id,
    replacement_status: "open",
    reason: null,
    client_id: course.client_id,
    subject,
    original_provider_id: course.provider_id,
    replacement_course_id: course.id,
  });

  if (!notification) return null;
  await insertNotificationRecipients(notification.id, teacherIds);
  return notification.id as string;
}

export async function notifyReplacementCandidate(
  course: CourseNotifyContext,
  providerName: string,
  proposalId: string,
): Promise<void> {
  if (!course.client_id) return;
  const subject = courseSubject(course);
  const when = scheduledLabel(course.scheduled_at);

  const notification = await insertCampusNotification({
    campus_id: course.campus_id,
    course_id: course.id,
    kind: "replacement_candidate",
    title: `Remplaçant proposé — ${subject}`,
    message: `${providerName} se propose pour reprendre le cours du ${when}. Acceptez ou refusez ce remplaçant.`,
    scheduled_at: course.scheduled_at,
    declared_by: course.provider_id,
    replacement_status: "open",
    reason: null,
    client_id: course.client_id,
    subject,
    original_provider_id: course.provider_id,
    replacement_course_id: course.id,
    accepted_proposal_id: proposalId,
  });

  if (!notification) return;
  await insertNotificationRecipients(notification.id, [course.client_id]);
}

export async function notifyReplacementAccepted(
  course: CourseNotifyContext,
  newProviderName: string,
  oldProviderId: string,
  newProviderId: string,
): Promise<void> {
  const subject = courseSubject(course);
  const when = scheduledLabel(course.scheduled_at);
  const admins = await getSiteAdministratorIds(course.campus_id);

  const recipientIds = uniqueRecipientIds([
    oldProviderId,
    newProviderId,
    ...(course.client_id ? [course.client_id] : []),
    ...admins,
  ]);

  const notification = await insertCampusNotification({
    campus_id: course.campus_id,
    course_id: course.id,
    kind: "replacement_accepted",
    title: `Remplacement confirmé — ${subject}`,
    message: `${newProviderName} reprendra le cours du ${when}. La séance est maintenue.`,
    scheduled_at: course.scheduled_at,
    declared_by: course.client_id,
    replacement_status: "filled",
    reason: null,
    client_id: course.client_id,
    subject,
    original_provider_id: oldProviderId,
    replacement_course_id: course.id,
  });

  if (!notification) return;
  await insertNotificationRecipients(notification.id, recipientIds);
}

function formatRefundAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export async function notifyRefundProcessed(
  course: CourseNotifyContext,
  reason: string,
): Promise<void> {
  const subject = courseSubject(course);
  const when = scheduledLabel(course.scheduled_at);
  const admins = await getSiteAdministratorIds(course.campus_id);
  const recipientIds = uniqueRecipientIds([
    ...(course.client_id ? [course.client_id] : []),
    ...admins,
  ]);

  const { data: transaction } = await supabaseAdmin
    .from("transactions")
    .select("amount_gross, total_paid_parent")
    .eq("course_id", course.id)
    .maybeSingle();

  const refundAmount =
    (transaction?.total_paid_parent as number | null) ??
    (transaction?.amount_gross as number | null);
  const amountSentence =
    refundAmount != null && Number.isFinite(refundAmount)
      ? ` Remboursement de ${formatRefundAmount(refundAmount)} en cours sur la carte utilisée lors du paiement.`
      : " Le remboursement est en cours sur la carte utilisée lors du paiement.";

  const notification = await insertCampusNotification({
    campus_id: course.campus_id,
    course_id: course.id,
    kind: "refund_processed",
    title: `Remboursement — ${subject}`,
    message: `Aucun remplaçant n'a été validé pour le cours du ${when}. ${reason}${amountSentence} Délai habituel : 5 à 10 jours ouvrés.`,
    scheduled_at: course.scheduled_at,
    declared_by: course.provider_id,
    replacement_status: "dismissed",
    reason: null,
    client_id: course.client_id,
    subject,
    original_provider_id: course.provider_id,
  });

  if (!notification) return;
  await insertNotificationRecipients(notification.id, recipientIds);
}
