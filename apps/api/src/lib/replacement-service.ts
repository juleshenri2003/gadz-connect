import { supabaseAdmin } from "./supabase.js";

export interface ReplacementProposalRow {
  id: string;
  notification_id: string;
  original_course_id: string;
  proposed_provider_id: string;
  message: string | null;
  status: string;
  created_at: string;
  proposed_provider?: {
    first_name: string;
    last_name: string;
    bio: string | null;
    subjects: string[];
    hourly_rate: number | null;
  } | null;
}

export async function hasProviderScheduleConflict(
  providerId: string,
  startsAt: string,
  endsAt: string,
  excludeCourseId?: string,
): Promise<boolean> {
  const { data: slots } = await supabaseAdmin
    .from("tutor_slots")
    .select("id, starts_at, ends_at, booked")
    .eq("provider_id", providerId)
    .eq("booked", true)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  if ((slots ?? []).length > 0) return true;

  let coursesQuery = supabaseAdmin
    .from("courses")
    .select("id, scheduled_at, slot_id")
    .eq("provider_id", providerId)
    .in("status", ["scheduled", "awaiting_replacement"])
    .not("scheduled_at", "is", null);

  if (excludeCourseId) {
    coursesQuery = coursesQuery.neq("id", excludeCourseId);
  }

  const { data: courses } = await coursesQuery;

  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();

  for (const course of courses ?? []) {
    const scheduledAt = course.scheduled_at as string;
    const courseStart = new Date(scheduledAt).getTime();
    const courseEnd = courseStart + 60 * 60 * 1000;
    if (courseStart < endMs && courseEnd > startMs) {
      return true;
    }
  }

  return false;
}

export async function acceptReplacementProposal(
  proposalId: string,
  studentId: string,
): Promise<
  | { ok: true; courseId: string; notificationId: string }
  | { ok: false; status: number; message: string }
> {
  const { data: proposal, error: proposalError } = await supabaseAdmin
    .from("replacement_proposals")
    .select(
      `
      id, notification_id, original_course_id, proposed_provider_id, status,
      notification:campus_notifications (
        id, replacement_status, course_id, declared_by, campus_id, scheduled_at
      ),
      course:original_course_id (
        id, client_id, provider_id, campus_id, subject, scheduled_at, slot_id, status,
        slot:slot_id ( id, starts_at, ends_at )
      )
    `,
    )
    .eq("id", proposalId)
    .maybeSingle();

  if (proposalError || !proposal) {
    return { ok: false, status: 404, message: "Proposition introuvable" };
  }

  if (proposal.status !== "pending") {
    return { ok: false, status: 400, message: "Cette proposition n'est plus disponible" };
  }

  const notification = Array.isArray(proposal.notification)
    ? proposal.notification[0]
    : proposal.notification;
  const course = Array.isArray(proposal.course)
    ? proposal.course[0]
    : proposal.course;

  if (!notification || !course) {
    return { ok: false, status: 404, message: "Données de remplacement introuvables" };
  }

  if (notification.replacement_status !== "open") {
    return { ok: false, status: 400, message: "Ce remplacement est déjà traité" };
  }

  const courseClientId = course.client_id as string | null;
  if (!courseClientId || courseClientId !== studentId) {
    return { ok: false, status: 403, message: "Seul l'élève concerné peut accepter" };
  }

  if (course.status !== "awaiting_replacement") {
    return { ok: false, status: 400, message: "Ce cours n'attend plus de remplacement" };
  }

  const slot = Array.isArray(course.slot) ? course.slot[0] : course.slot;
  const startsAt = slot?.starts_at as string | undefined;
  const endsAt = slot?.ends_at as string | undefined;

  if (!startsAt || !endsAt) {
    return {
      ok: false,
      status: 400,
      message: "Créneau du cours introuvable",
    };
  }

  const proposedProviderId = proposal.proposed_provider_id as string;
  const conflict = await hasProviderScheduleConflict(
    proposedProviderId,
    startsAt,
    endsAt,
    course.id as string,
  );

  if (conflict) {
    return {
      ok: false,
      status: 409,
      message: "Le professeur n'est plus disponible à cet horaire",
    };
  }

  const oldSlotId = course.slot_id as string | null;
  if (oldSlotId) {
    await supabaseAdmin
      .from("tutor_slots")
      .update({ booked: false, booked_by: null })
      .eq("id", oldSlotId);
  }

  const { data: existingSlot } = await supabaseAdmin
    .from("tutor_slots")
    .select("id")
    .eq("provider_id", proposedProviderId)
    .eq("starts_at", startsAt)
    .eq("ends_at", endsAt)
    .eq("booked", false)
    .maybeSingle();

  let newSlotId: string;

  if (existingSlot?.id) {
    newSlotId = existingSlot.id as string;
  } else {
    const { data: createdSlot, error: slotError } = await supabaseAdmin
      .from("tutor_slots")
      .insert({
        provider_id: proposedProviderId,
        starts_at: startsAt,
        ends_at: endsAt,
        booked: true,
        booked_by: studentId,
      })
      .select("id")
      .single();

    if (slotError || !createdSlot) {
      return {
        ok: false,
        status: 500,
        message: slotError?.message ?? "Impossible de créer le créneau",
      };
    }
    newSlotId = createdSlot.id as string;
  }

  await supabaseAdmin
    .from("tutor_slots")
    .update({ booked: true, booked_by: studentId })
    .eq("id", newSlotId);

  const { error: courseUpdateError } = await supabaseAdmin
    .from("courses")
    .update({
      provider_id: proposedProviderId,
      status: "scheduled",
      slot_id: newSlotId,
    })
    .eq("id", course.id);

  if (courseUpdateError) {
    return { ok: false, status: 500, message: courseUpdateError.message };
  }

  await supabaseAdmin
    .from("replacement_proposals")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  await supabaseAdmin
    .from("replacement_proposals")
    .update({
      status: "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("notification_id", notification.id as string)
    .eq("status", "pending")
    .neq("id", proposalId);

  await supabaseAdmin
    .from("campus_notifications")
    .update({ replacement_status: "filled" })
    .eq("id", notification.id as string);

  const { error: extendedUpdateError } = await supabaseAdmin
    .from("campus_notifications")
    .update({
      accepted_proposal_id: proposalId,
      replacement_course_id: course.id,
    })
    .eq("id", notification.id as string);

  if (extendedUpdateError?.message.includes("column")) {
    console.warn(
      "[replacements] colonnes migration 008 absentes pour accepted_proposal_id",
    );
  }

  return {
    ok: true,
    courseId: course.id as string,
    notificationId: notification.id as string,
  };
}
