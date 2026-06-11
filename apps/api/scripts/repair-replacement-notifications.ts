/**
 * Recrée les alertes manquantes pour les cours en awaiting_replacement.
 * Usage: pnpm --filter @gadz-connect/api repair-replacement-notifications
 */
import "dotenv/config";
import {
  findOpenProfUnavailableNotification,
  getActiveCampusTeachers,
  getSiteAdministratorIds,
  insertCampusNotification,
  insertNotificationRecipients,
  uniqueRecipientIds,
} from "../src/lib/notification-helpers.js";
import { supabaseAdmin } from "../src/lib/supabase.js";

async function main() {
  const { data: courses, error } = await supabaseAdmin
    .from("courses")
    .select(
      `
      id, title, subject, status, scheduled_at, campus_id, provider_id, client_id,
      provider:provider_id ( first_name, last_name ),
      client:client_id ( first_name, last_name )
    `,
    )
    .eq("status", "awaiting_replacement");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (!courses?.length) {
    console.log("Aucun cours en awaiting_replacement.");
    return;
  }

  for (const course of courses) {
    const existing = await findOpenProfUnavailableNotification(course.id as string);
    if (existing) {
      console.log(`✓ ${course.subject ?? course.title} — alerte déjà présente`);
      continue;
    }

    const provider = Array.isArray(course.provider)
      ? course.provider[0]
      : course.provider;
    const client = Array.isArray(course.client)
      ? course.client[0]
      : course.client;
    const subject =
      (course.subject as string) || (course.title as string) || "Cours";
    const declarantName = provider
      ? `${provider.first_name} ${provider.last_name}`.trim()
      : "Professeur";
    const clientName = client
      ? `${client.first_name} ${client.last_name}`.trim()
      : "Élève";
    const scheduledLabel = course.scheduled_at
      ? new Date(course.scheduled_at as string).toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "date à confirmer";

    const notification = await insertCampusNotification({
      campus_id: course.campus_id,
      course_id: course.id,
      kind: "prof_unavailable",
      title: `Remplacement professeur — ${subject}`,
      message: `${declarantName} est indisponible pour le cours « ${subject} » prévu le ${scheduledLabel} avec ${clientName}. Le cours est en attente de remplacement.`,
      scheduled_at: course.scheduled_at,
      declared_by: course.provider_id,
      replacement_status: "open",
      reason: null,
      original_provider_id: course.provider_id,
      client_id: course.client_id,
      subject,
      replacement_course_id: course.id,
    });

    if (!notification) {
      console.error(`✗ ${subject} — échec création alerte`);
      continue;
    }

    const teachers = await getActiveCampusTeachers(
      course.campus_id as string,
      course.provider_id as string,
    );
    const admins = await getSiteAdministratorIds(
      course.campus_id as string,
      course.provider_id as string,
    );
    const recipientIds = uniqueRecipientIds([
      course.provider_id as string,
      ...(course.client_id ? [course.client_id as string] : []),
      ...teachers,
      ...admins,
    ]);

    await insertNotificationRecipients(notification.id, recipientIds);
    console.log(
      `✓ ${subject} — alerte créée (${recipientIds.length} destinataire(s))`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
