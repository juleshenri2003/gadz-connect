import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const scheduleRouter = Router();

scheduleRouter.use(requireAuth);

export interface ScheduleEventPayload {
  id: string;
  courseId?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  kind: "course" | "slot_available" | "slot_booked";
  status?: string;
  counterpartName?: string;
}

function slotEnd(startsAt: string, endsAt: string): string {
  return endsAt || startsAt;
}

function profileName(
  value: unknown,
): { first_name: string; last_name: string } | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const p = row as { first_name?: string; last_name?: string };
  if (!p.first_name && !p.last_name) return null;
  return {
    first_name: p.first_name ?? "",
    last_name: p.last_name ?? "",
  };
}

/**
 * GET /api/schedule/me
 * Emploi du temps personnel (élève ou professeur).
 */
scheduleRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  const events: ScheduleEventPayload[] = [];

  if (profile.role === "teacher") {
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from("tutor_slots")
      .select("id, starts_at, ends_at, booked, booked_by")
      .eq("provider_id", userId)
      .order("starts_at");

    if (slotsError) {
      res.status(500).json({ error: slotsError.message });
      return;
    }

    const bookerIds = [
      ...new Set(
        (slots ?? [])
          .map((s) => s.booked_by as string | null)
          .filter(Boolean),
      ),
    ] as string[];

    const bookerNames = new Map<string, string>();
    if (bookerIds.length > 0) {
      const { data: bookers } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", bookerIds);
      for (const b of bookers ?? []) {
        bookerNames.set(
          b.id as string,
          `${b.first_name} ${b.last_name}`.trim(),
        );
      }
    }

    const bookedSlotIds = (slots ?? [])
      .filter((s) => s.booked)
      .map((s) => s.id as string);

    const courseBySlotId = new Map<
      string,
      { id: string; status: string; subject: string | null; title: string }
    >();

    if (bookedSlotIds.length > 0) {
      const { data: slotCourses } = await supabaseAdmin
        .from("courses")
        .select("id, slot_id, status, subject, title")
        .in("slot_id", bookedSlotIds);

      for (const c of slotCourses ?? []) {
        if (c.slot_id) {
          courseBySlotId.set(c.slot_id as string, {
            id: c.id as string,
            status: c.status as string,
            subject: c.subject as string | null,
            title: c.title as string,
          });
        }
      }
    }

    for (const slot of slots ?? []) {
      const booked = Boolean(slot.booked);
      const linked = courseBySlotId.get(slot.id as string);
      events.push({
        id: slot.id as string,
        courseId: linked?.id,
        title: booked
          ? linked?.subject || linked?.title || "Cours réservé"
          : "Créneau disponible",
        startsAt: slot.starts_at as string,
        endsAt: slotEnd(slot.starts_at as string, slot.ends_at as string),
        kind: booked ? "slot_booked" : "slot_available",
        status: linked?.status,
        counterpartName: slot.booked_by
          ? bookerNames.get(slot.booked_by as string)
          : undefined,
      });
    }

    const { data: courses, error: coursesError } = await supabaseAdmin
      .from("courses")
      .select(
        `
        id, title, subject, status, scheduled_at, slot_id,
        client:client_id ( first_name, last_name )
      `,
      )
      .eq("provider_id", userId)
      .not("scheduled_at", "is", null)
      .order("scheduled_at");

    if (coursesError) {
      res.status(500).json({ error: coursesError.message });
      return;
    }

    const slotIds = new Set((slots ?? []).map((s) => s.id as string));
    for (const course of courses ?? []) {
      if (course.slot_id && slotIds.has(course.slot_id as string)) continue;
      const client = profileName(course.client);
      const scheduledAt = course.scheduled_at as string;
      events.push({
        id: course.id as string,
        courseId: course.id as string,
        title: (course.subject as string) || (course.title as string),
        startsAt: scheduledAt,
        endsAt: scheduledAt,
        kind: "course",
        status: course.status as string,
        counterpartName: client
          ? `${client.first_name} ${client.last_name}`.trim()
          : undefined,
      });
    }
  } else {
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from("courses")
      .select(
        `
        id, title, subject, status, scheduled_at, slot_id,
        provider:provider_id ( first_name, last_name ),
        slot:slot_id ( starts_at, ends_at )
      `,
      )
      .eq("client_id", userId)
      .not("scheduled_at", "is", null)
      .neq("status", "cancelled")
      .order("scheduled_at");

    if (coursesError) {
      res.status(500).json({ error: coursesError.message });
      return;
    }

    for (const course of courses ?? []) {
      const provider = profileName(course.provider);
      const slot = Array.isArray(course.slot) ? course.slot[0] : course.slot;
      const scheduledAt = course.scheduled_at as string;
      const startsAt = (slot?.starts_at as string | undefined) ?? scheduledAt;
      const endsAt =
        (slot?.ends_at as string | undefined) ??
        scheduledAt;
      events.push({
        id: course.id as string,
        courseId: course.id as string,
        title: (course.subject as string) || (course.title as string),
        startsAt,
        endsAt: slotEnd(startsAt, endsAt),
        kind: "course",
        status: course.status as string,
        counterpartName: provider
          ? `${provider.first_name} ${provider.last_name}`.trim()
          : undefined,
      });
    }
  }

  events.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  res.json({
    data: {
      role: profile.role,
      events,
    },
  });
});
