/**
 * Données de démo : remplacements + répertoire matières (campus Paris).
 * Usage: pnpm --filter @gadz-connect/api seed-replacement-demo
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getDemoCampusId } from "./lib/demo-campus.js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface DemoUser {
  email: string;
  firstName: string;
  lastName: string;
  role: "teacher" | "student_provider";
  subjects?: string[];
  bio?: string;
  hourlyRate?: number;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: "prof.dubois@ensam.eu",
    firstName: "Sophie",
    lastName: "Dubois",
    role: "teacher",
    subjects: ["Maths", "Physique"],
    bio: "Doctorante en mécanique — tutorat maths et physique L1/L2.",
    hourlyRate: 38,
  },
  {
    email: "prof.bernard@ensam.eu",
    firstName: "Luc",
    lastName: "Bernard",
    role: "teacher",
    subjects: ["RDM", "Mécanique"],
    bio: "Ingénieur RDM — accompagnement projets et révisions.",
    hourlyRate: 42,
  },
  {
    email: "eleve.martin@ensam.eu",
    firstName: "Léa",
    lastName: "Martin",
    role: "student_provider",
  },
];

async function ensureAuthUser(user: DemoUser): Promise<string> {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === user.email.toLowerCase(),
  );
  if (existing) return existing.id;

  const { data: created, error } = await admin.auth.admin.createUser({
    email: user.email,
    email_confirm: true,
    user_metadata: { first_name: user.firstName, last_name: user.lastName },
  });
  if (error || !created.user) {
    throw new Error(`createUser ${user.email}: ${error?.message}`);
  }
  return created.user.id;
}

async function ensureProfile(
  userId: string,
  user: DemoUser,
  campusId: string,
): Promise<void> {
  const payload = {
    id: userId,
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
    campus_id: campusId,
    account_status: "active" as const,
    profile_setup_complete: true,
    siret: user.role === "teacher" ? "98765432109876" : null,
    micro_enterprise_activity:
      user.role === "teacher" ? ("enseignement" as const) : null,
    urssaf_periodicity: user.role === "teacher" ? ("monthly" as const) : null,
    versement_liberatoire: false,
    bio: user.bio ?? null,
    subjects: user.subjects ?? [],
    hourly_rate: user.hourlyRate ?? null,
  };

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    await admin.from("profiles").update(payload).eq("id", userId);
  } else {
    await admin.from("profiles").insert(payload);
  }
}

async function getUserIdByEmail(email: string): Promise<string | null> {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return (
    list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ??
    null
  );
}

async function main() {
  const campusId = await getDemoCampusId(admin);
  if (!campusId) process.exit(1);

  for (const user of DEMO_USERS) {
    const id = await ensureAuthUser(user);
    await ensureProfile(id, user, campusId);
    console.log(`✓ ${user.email}`);
  }

  const profMartin = await getUserIdByEmail("prof.martin@ensam.eu");
  const profDubois = await getUserIdByEmail("prof.dubois@ensam.eu");
  const eleveDupont = await getUserIdByEmail("eleve.dupont@ensam.eu");
  const eleveMartin = await getUserIdByEmail("eleve.martin@ensam.eu");

  if (!profMartin || !profDubois || !eleveDupont) {
    console.error("Lancez d'abord seed-professor et seed-student");
    process.exit(1);
  }

  const futureStart = new Date();
  futureStart.setDate(futureStart.getDate() + 5);
  futureStart.setHours(10, 0, 0, 0);
  const futureEnd = new Date(futureStart);
  futureEnd.setHours(11, 0, 0, 0);

  const pastStart = new Date();
  pastStart.setDate(pastStart.getDate() - 14);
  pastStart.setHours(14, 0, 0, 0);
  const pastEnd = new Date(pastStart);
  pastEnd.setHours(15, 0, 0, 0);

  const bookedStart = new Date();
  bookedStart.setDate(bookedStart.getDate() + 7);
  bookedStart.setHours(14, 0, 0, 0);
  const bookedEnd = new Date(bookedStart);
  bookedEnd.setHours(15, 0, 0, 0);

  await admin.from("tutor_slots").delete().eq("provider_id", profDubois);
  await admin
    .from("courses")
    .delete()
    .eq("client_id", eleveDupont)
    .eq("provider_id", profMartin)
    .eq("subject", "SolidWorks")
    .eq("status", "scheduled");

  const { data: martinSlot } = await admin
    .from("tutor_slots")
    .insert({
      provider_id: profMartin,
      starts_at: bookedStart.toISOString(),
      ends_at: bookedEnd.toISOString(),
      booked: true,
      booked_by: eleveDupont,
    })
    .select("id")
    .single();

  const { data: scheduledCourse } = await admin
    .from("courses")
    .insert({
      title: "SolidWorks — Prise en main",
      subject: "SolidWorks",
      campus_id: campusId,
      provider_id: profMartin,
      client_id: eleveDupont,
      scheduled_at: bookedStart.toISOString(),
      slot_id: martinSlot?.id ?? null,
      status: "scheduled",
    })
    .select("id")
    .single();

  const { data: duboisSlot } = await admin
    .from("tutor_slots")
    .insert({
      provider_id: profDubois,
      starts_at: futureStart.toISOString(),
      ends_at: futureEnd.toISOString(),
    })
    .select("id")
    .single();

  const { data: completedCourse } = await admin
    .from("courses")
    .insert({
      title: "Maths — Intégrales",
      subject: "Maths",
      campus_id: campusId,
      provider_id: profDubois,
      client_id: eleveDupont,
      scheduled_at: pastStart.toISOString(),
      status: "completed",
    })
    .select("id")
    .single();

  if (eleveMartin && completedCourse) {
    const past2 = new Date(pastStart);
    past2.setDate(past2.getDate() - 7);
    await admin.from("courses").insert({
      title: "Physique — Mécanique",
      subject: "Physique",
      campus_id: campusId,
      provider_id: profDubois,
      client_id: eleveMartin,
      scheduled_at: past2.toISOString(),
      status: "completed",
    });
  }

  const replaceStart = new Date();
  replaceStart.setDate(replaceStart.getDate() + 3);
  replaceStart.setHours(16, 0, 0, 0);
  const replaceEnd = new Date(replaceStart);
  replaceEnd.setHours(17, 0, 0, 0);

  const { data: replaceSlot } = await admin
    .from("tutor_slots")
    .insert({
      provider_id: profMartin,
      starts_at: replaceStart.toISOString(),
      ends_at: replaceEnd.toISOString(),
      booked: true,
      booked_by: eleveDupont,
    })
    .select("id")
    .single();

  const { data: awaitingCourse } = await admin
    .from("courses")
    .insert({
      title: "CAO — Assemblages",
      subject: "CAO",
      campus_id: campusId,
      provider_id: profMartin,
      client_id: eleveDupont,
      scheduled_at: replaceStart.toISOString(),
      slot_id: replaceSlot?.id,
      status: "awaiting_replacement",
    })
    .select("id")
    .single();

  if (awaitingCourse) {
    const { insertCampusNotification, insertNotificationRecipients } =
      await import("../src/lib/notification-helpers.js");

    const notification = await insertCampusNotification({
        campus_id: campusId,
        course_id: awaitingCourse.id,
        kind: "prof_unavailable",
        title: "Remplacement professeur — CAO",
        message:
          "Marie Martin est indisponible — propositions de remplacement ouvertes.",
        scheduled_at: replaceStart.toISOString(),
        declared_by: profMartin,
        replacement_status: "open",
        original_provider_id: profMartin,
        client_id: eleveDupont,
        subject: "CAO",
        replacement_course_id: awaitingCourse.id,
    });

    if (notification) {
      await insertNotificationRecipients(notification.id, [
        eleveDupont,
        profDubois,
      ]);

      const profBernard = await getUserIdByEmail("prof.bernard@ensam.eu");
      if (profBernard) {
        await insertNotificationRecipients(notification.id, [profBernard]);

        const { error: proposalError } = await admin
          .from("replacement_proposals")
          .insert({
            notification_id: notification.id,
            original_course_id: awaitingCourse.id,
            proposed_provider_id: profDubois,
            message: "Disponible à 16h, je maîtrise la CAO.",
            status: "pending",
          });

        if (proposalError) {
          console.warn(
            "⚠ Proposition démo ignorée — migration 008 requise:",
            proposalError.message,
          );
        }
      }
    }
  }

  if (completedCourse) {
    const { data: folder } = await admin
      .from("student_subject_folders")
      .upsert(
        { student_id: eleveDupont, subject: "Maths" },
        { onConflict: "student_id,subject" },
      )
      .select("id")
      .single();

    if (folder) {
      await admin.from("course_summaries").upsert(
        {
          course_id: completedCourse.id,
          folder_id: folder.id,
          student_id: eleveDupont,
          provider_id: profDubois,
          title: "Intégrales — méthode par parties",
          content:
            "• Rappel primitives usuelles\n• Intégration par parties : u'v + uv'\n• Exercices types sur fonctions polynomiales et ln",
        },
        { onConflict: "course_id" },
      );
    }
  }

  console.log("");
  console.log("── Démo remplacement + répertoire ──");
  console.log("Élève       : eleve.dupont@ensam.eu");
  console.log("  → Cours SolidWorks avec prof.martin dans /app/planning (J+7 14h-15h)");
  console.log("Profs       : prof.dubois@ensam.eu, prof.bernard@ensam.eu");
  console.log("Créneau libre Dubois :", duboisSlot?.id, "(J+5 10h — réserver via /app/cours)");
  console.log("Cours planifié Martin :", scheduledCourse?.id);
  console.log("");
  console.log("pnpm --filter @gadz-connect/api align-demo-campus");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
