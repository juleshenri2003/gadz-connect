import {
  formatCourseRatingStars,
  isLowCourseRating,
  type CourseRatingRow,
} from "./course-ratings.js";
import {
  getSiteAdministratorIds,
  insertCampusNotification,
  insertNotificationRecipients,
  uniqueRecipientIds,
} from "./notification-helpers.js";

interface CourseRatingNotificationContext {
  course: {
    id: string;
    campus_id: string;
    scheduled_at: string | null;
    subject: string | null;
    title: string;
    provider_id: string | null;
  };
  rating: CourseRatingRow;
  raterName: string;
  providerName: string;
}

export async function notifyCourseRated(
  ctx: CourseRatingNotificationContext,
): Promise<void> {
  const subject =
    (ctx.course.subject as string) || (ctx.course.title as string) || "Cours";
  const starsLabel = formatCourseRatingStars(Number(ctx.rating.stars));
  const scheduledLabel = ctx.course.scheduled_at
    ? new Date(ctx.course.scheduled_at).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "date à confirmer";

  const adminMessage = ctx.rating.comment?.trim()
    ? `${ctx.raterName} a noté le cours « ${subject} » (${scheduledLabel}) avec ${providerName(ctx.providerName)} : ${starsLabel}/5. Commentaire : « ${ctx.rating.comment.trim()} »`
    : `${ctx.raterName} a noté le cours « ${subject} » (${scheduledLabel}) avec ${providerName(ctx.providerName)} : ${starsLabel}/5.`;

  const adminNotification = await insertCampusNotification({
    campus_id: ctx.course.campus_id,
    course_id: ctx.course.id,
    kind: "course_rated",
    title: `Avis élève — ${subject}`,
    message: adminMessage,
    scheduled_at: ctx.course.scheduled_at,
    declared_by: ctx.rating.rater_id,
    replacement_status: "dismissed",
    reason: null,
  });

  if (!adminNotification) return;

  const adminIds = await getSiteAdministratorIds(
    ctx.course.campus_id as string,
    ctx.rating.rater_id,
  );

  await insertNotificationRecipients(
    adminNotification.id,
    uniqueRecipientIds(adminIds),
  );

  if (
    !isLowCourseRating(Number(ctx.rating.stars)) ||
    !ctx.course.provider_id
  ) {
    return;
  }

  const providerMessage = `${ctx.raterName} a laissé une note de ${starsLabel}/5 pour le cours « ${subject} » du ${scheduledLabel}. Consultez le suivi des cours pour échanger avec l'élève si besoin.`;

  const providerNotification = await insertCampusNotification({
    campus_id: ctx.course.campus_id,
    course_id: ctx.course.id,
    kind: "course_rated_low",
    title: `Note à améliorer — ${subject}`,
    message: providerMessage,
    scheduled_at: ctx.course.scheduled_at,
    declared_by: ctx.rating.rater_id,
    replacement_status: "dismissed",
    reason: null,
  });

  if (!providerNotification) return;

  await insertNotificationRecipients(providerNotification.id, [
    ctx.course.provider_id as string,
  ]);
}

function providerName(name: string): string {
  return name.trim() || "Professeur";
}
