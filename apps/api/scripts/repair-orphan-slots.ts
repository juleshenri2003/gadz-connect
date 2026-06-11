/**
 * Répare les créneaux réservés sans cours + supprime les doublons.
 * Usage: pnpm --filter @gadz-connect/api repair-orphan-slots
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: bookedSlots, error } = await admin
    .from("tutor_slots")
    .select("id, provider_id, starts_at, ends_at, booked, booked_by")
    .eq("booked", true)
    .order("starts_at");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const seen = new Map<string, string>();

  for (const slot of bookedSlots ?? []) {
    const key = `${slot.provider_id}:${slot.starts_at}:${slot.ends_at}`;
    const { data: linkedCourse } = await admin
      .from("courses")
      .select("id, status, subject")
      .eq("slot_id", slot.id)
      .maybeSingle();

    if (linkedCourse) {
      console.log(
        `✓ Créneau ${slot.id.slice(0, 8)}… → cours ${linkedCourse.subject ?? linkedCourse.id}`,
      );
      seen.set(key, slot.id as string);
      continue;
    }

    if (seen.has(key)) {
      await admin
        .from("tutor_slots")
        .delete()
        .eq("id", slot.id);
      console.log(`✗ Doublon supprimé ${slot.id.slice(0, 8)}… (${key})`);
      continue;
    }

    seen.set(key, slot.id as string);

    if (!slot.booked_by) {
      await admin
        .from("tutor_slots")
        .update({ booked: false, booked_by: null })
        .eq("id", slot.id);
      console.log(`✗ Créneau orphelin libéré ${slot.id.slice(0, 8)}… (sans élève)`);
      continue;
    }

    const { data: provider } = await admin
      .from("profiles")
      .select("campus_id, first_name, last_name")
      .eq("id", slot.provider_id)
      .maybeSingle();

    if (!provider?.campus_id) {
      console.log(`✗ Créneau ${slot.id.slice(0, 8)}… ignoré (prof sans campus)`);
      continue;
    }

    const { data: course, error: courseError } = await admin
      .from("courses")
      .insert({
        title: "Cours réservé — réparation",
        subject: "Tutorat",
        description: "Cours recréé automatiquement pour un créneau réservé orphelin",
        campus_id: provider.campus_id,
        provider_id: slot.provider_id,
        client_id: slot.booked_by,
        scheduled_at: slot.starts_at,
        slot_id: slot.id,
        status: "scheduled",
      })
      .select("id")
      .single();

    if (courseError || !course) {
      console.error(`✗ Échec cours pour ${slot.id}:`, courseError?.message);
      continue;
    }

    console.log(
      `✓ Cours recréé ${course.id.slice(0, 8)}… pour créneau ${slot.id.slice(0, 8)}…`,
    );
  }

  console.log("");
  console.log("Terminé — les créneaux réservés ont maintenant un cours lié.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
