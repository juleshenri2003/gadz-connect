import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { markPastCoursesCompleted } from "../lib/course-completion.js";
import { loadRatingsByCourseIds } from "../lib/course-ratings-query.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const scheduleRouter = Router();

scheduleRouter.use(requireAuth);

const DEFAULT_SESSION_MS = 60 * 60 * 1000;

export interface ScheduleEventPayload {
  id: string;
  courseId?: string;
  slotId?: string;
  clientId?: string;
  hasSummary?: boolean;
  summaryId?: string;
  folderId?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  kind: "course" | "slot_available" | "slot_booked";
  status?: string;
  counterpartName?: string;
  providerId?: string;
  rating?: { stars: number; createdAt: string };
  canRate?: boolean;
  studentConfirmedAt?: string | null;
  providerConfirmedAt?: string | null;
  studentSessionConfirmedAt?: string | null;
  providerSessionConfirmedAt?: string | null;
  sessionConfirmationCompletedAt?: string | null;
  sessionDisputeStatus?: string | null;
}

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the") ||
    message.includes("schema cache")
  );
}

const TEACHER_COURSE_SELECT_WITH_SESSION = `
        id, title, subject, status, scheduled_at, slot_id, client_id,
        student_confirmed_at, provider_confirmed_at,
        student_session_confirmed_at, provider_session_confirmed_at,
        session_confirmation_completed_at, session_dispute_status,
        client:client_id ( first_name, last_name ),
        slot:slot_id ( starts_at, ends_at )
      `;

const TEACHER_COURSE_SELECT_LEGACY = `
        id, title, subject, status, scheduled_at, slot_id, client_id,
        student_confirmed_at, provider_confirmed_at,
        client:client_id ( first_name, last_name ),
        slot:slot_id ( starts_at, ends_at )
      `;

const STUDENT_COURSE_SELECT_WITH_SESSION = `
        id, title, subject, status, scheduled_at, slot_id, provider_id,
        student_confirmed_at, provider_confirmed_at,
        student_session_confirmed_at, provider_session_confirmed_at,
        session_confirmation_completed_at, session_dispute_status,
        provider:provider_id ( first_name, last_name ),
        slot:slot_id ( starts_at, ends_at )
      `;

const STUDENT_COURSE_SELECT_LEGACY = `
        id, title, subject, status, scheduled_at, slot_id, provider_id,
        student_confirmed_at, provider_confirmed_at,
        provider:provider_id ( first_name, last_name ),
        slot:slot_id ( starts_at, ends_at )
      `;

async function queryCoursesWithSessionFallback(input: {
  selectWithSession: string;
  selectLegacy: string;
  roleField: "provider_id" | "client_id";
  userId: string;
  from?: string;
  to?: string;
  includeCancelled?: boolean;
  excludePaymentPending?: boolean;
}): Promise<{
  data: Record<string, unknown>[] | null;
  error: { message: string } | null;
}> {
  const build = (select: string) => {
    let q = supabaseAdmin
      .from("courses")
      .select(select)
      .eq(input.roleField, input.userId)
      .not("scheduled_at", "is", null)
      .order("scheduled_at");
    if (input.from) q = q.gte("scheduled_at", input.from);
    if (input.to) q = q.lte("scheduled_at", input.to);
    if (!input.includeCancelled) q = q.neq("status", "cancelled");
    if (input.excludePaymentPending) q = q.neq("status", "payment_pending");
    return q;
  };

  const first = await build(input.selectWithSession);
  if (!first.error) {
    return {
      data: (first.data as unknown as Record<string, unknown>[] | null) ?? null,
      error: null,
    };
  }

  if (isMissingColumnError(first.error.message)) {
    console.warn(
      "[schedule] colonnes post-séance absentes — fallback legacy (appliquez migration 030)",
    );
    const legacy = await build(input.selectLegacy);
    return {
      data: (legacy.data as unknown as Record<string, unknown>[] | null) ?? null,
      error: legacy.error,
    };
  }

  return { data: null, error: first.error };
}

function sessionFieldsFromCourse(course: Record<string, unknown>) {
  const hasSessionCols = Object.prototype.hasOwnProperty.call(
    course,
    "student_session_confirmed_at",
  );
  const status = course.status as string;
  const scheduledAt = course.scheduled_at as string | null | undefined;
  const isPastForLegacy =
    status === "completed" ||
    status === "awaiting_session_confirmation" ||
    (Boolean(scheduledAt) && new Date(scheduledAt!).getTime() < Date.now());

  if (!hasSessionCols && isPastForLegacy) {
    const student =
      (course.student_confirmed_at as string | null | undefined) ?? null;
    const provider =
      (course.provider_confirmed_at as string | null | undefined) ?? null;
    return {
      studentSessionConfirmedAt: student,
      providerSessionConfirmedAt: provider,
      sessionConfirmationCompletedAt:
        student && provider ? (student > provider ? student : provider) : null,
      sessionDisputeStatus: null,
    };
  }

  return {
    studentSessionConfirmedAt:
      (course.student_session_confirmed_at as string | null | undefined) ?? null,
    providerSessionConfirmedAt:
      (course.provider_session_confirmed_at as string | null | undefined) ??
      null,
    sessionConfirmationCompletedAt:
      (course.session_confirmation_completed_at as string | null | undefined) ??
      null,
    sessionDisputeStatus:
      (course.session_dispute_status as string | null | undefined) ?? null,
  };
}

function slotEnd(startsAt: string, endsAt: string): string {
  return endsAt || startsAt;
}

function defaultEndFromStart(startsAt: string): string {
  return new Date(new Date(startsAt).getTime() + DEFAULT_SESSION_MS).toISOString();
}

async function loadSummaryMetaByCourseId(
  courseIds: string[],
): Promise<Map<string, { id: string; folder_id: string }>> {
  const map = new Map<string, { id: string; folder_id: string }>();
  if (courseIds.length === 0) return map;

  const { data: summaries } = await supabaseAdmin
    .from("course_summaries")
    .select("id, course_id, folder_id")
    .in("course_id", courseIds);

  for (const row of summaries ?? []) {
    if (row.course_id) {
      map.set(row.course_id as string, {
        id: row.id as string,
        folder_id: row.folder_id as string,
      });
    }
  }

  return map;
}

function parseIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
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

function courseCanBeRated(
  status: string | undefined,
  endsAt: string,
  hasRating: boolean,
): boolean {
  if (hasRating || status !== "completed") return false;
  return new Date(endsAt).getTime() < Date.now();
}

function attachRatingsToEvents(
  events: ScheduleEventPayload[],
  ratingsByCourseId: Map<
    string,
    { stars: number; created_at: string; rater_id: string }
  >,
  options: { studentId?: string },
): void {
  for (const event of events) {
    if (!event.courseId) continue;
    const rating = ratingsByCourseId.get(event.courseId);
    if (rating) {
      const visibleToStudent =
        !options.studentId || rating.rater_id === options.studentId;
      if (visibleToStudent) {
        event.rating = {
          stars: Number(rating.stars),
          createdAt: rating.created_at,
        };
      }
    }
    if (options.studentId) {
      const studentHasRated = rating?.rater_id === options.studentId;
      event.canRate = courseCanBeRated(
        event.status,
        event.endsAt,
        Boolean(studentHasRated),
      );
    }
  }
}

function pickOne<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? value[0] : value) as T;
}

/**
 * GET /api/schedule/me
 * Emploi du temps personnel (élève ou professeur).
 * Query: from, to (ISO), includeCancelled
 */
scheduleRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const from = parseIsoDate(req.query.from);
  const to = parseIsoDate(req.query.to);
  const includeCancelled = req.query.includeCancelled === "true";

  await markPastCoursesCompleted();

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
    let slotsQuery = supabaseAdmin
      .from("tutor_slots")
      .select("id, starts_at, ends_at, booked, booked_by")
      .eq("provider_id", userId)
      .order("starts_at");

    if (from) slotsQuery = slotsQuery.gte("starts_at", from);
    if (to) slotsQuery = slotsQuery.lte("starts_at", to);

    const { data: slots, error: slotsError } = await slotsQuery;

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
      {
        id: string;
        status: string;
        subject: string | null;
        title: string;
        client_id: string | null;
      }
    >();

    if (bookedSlotIds.length > 0) {
      const { data: slotCourses } = await supabaseAdmin
        .from("courses")
        .select("id, slot_id, status, subject, title, client_id")
        .in("slot_id", bookedSlotIds);

      for (const c of slotCourses ?? []) {
        if (c.slot_id) {
          courseBySlotId.set(c.slot_id as string, {
            id: c.id as string,
            status: c.status as string,
            subject: c.subject as string | null,
            title: c.title as string,
            client_id: c.client_id as string | null,
          });
        }
      }
    }

    const orphanBookedSlots = (slots ?? []).filter(
      (s) => s.booked && !courseBySlotId.has(s.id as string),
    );

    if (orphanBookedSlots.length > 0) {
      for (const slot of orphanBookedSlots) {
        const bookerId = slot.booked_by as string | null;
        if (!bookerId) continue;

        const { data: fallbackCourse } = await supabaseAdmin
          .from("courses")
          .select("id, slot_id, status, subject, title, client_id, scheduled_at")
          .eq("provider_id", userId)
          .eq("client_id", bookerId)
          .eq("scheduled_at", slot.starts_at as string)
          .maybeSingle();

        if (fallbackCourse) {
          courseBySlotId.set(slot.id as string, {
            id: fallbackCourse.id as string,
            status: fallbackCourse.status as string,
            subject: fallbackCourse.subject as string | null,
            title: fallbackCourse.title as string,
            client_id: fallbackCourse.client_id as string | null,
          });

          if (!fallbackCourse.slot_id) {
            await supabaseAdmin
              .from("courses")
              .update({ slot_id: slot.id })
              .eq("id", fallbackCourse.id);
          }
        }
      }
    }

    for (const slot of slots ?? []) {
      const booked = Boolean(slot.booked);
      const linked = courseBySlotId.get(slot.id as string);
      const slotId = slot.id as string;
      events.push({
        id: slotId,
        slotId,
        courseId: linked?.id,
        clientId: linked?.client_id ?? (slot.booked_by as string | undefined),
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

    const { data: courses, error: coursesError } =
      await queryCoursesWithSessionFallback({
        selectWithSession: TEACHER_COURSE_SELECT_WITH_SESSION,
        selectLegacy: TEACHER_COURSE_SELECT_LEGACY,
        roleField: "provider_id",
        userId,
        from,
        to,
        includeCancelled,
      });

    if (coursesError) {
      res.status(500).json({ error: coursesError.message });
      return;
    }

    const courseIds = (courses ?? []).map((c) => c.id as string);
    const summaryMetaByCourseId = await loadSummaryMetaByCourseId(courseIds);

    const slotIds = new Set((slots ?? []).map((s) => s.id as string));
    for (const course of courses ?? []) {
      if (course.slot_id && slotIds.has(course.slot_id as string)) continue;
      const client = profileName(course.client);
      const slot = pickOne<{ starts_at: string; ends_at: string }>(course.slot);
      const scheduledAt = course.scheduled_at as string;
      const startsAt = slot?.starts_at ?? scheduledAt;
      const endsAt = slot?.ends_at
        ? slotEnd(startsAt, slot.ends_at)
        : defaultEndFromStart(startsAt);
      const courseId = course.id as string;
      const summaryMeta = summaryMetaByCourseId.get(courseId);

      events.push({
        id: courseId,
        courseId,
        slotId: (course.slot_id as string | null) ?? undefined,
        clientId: (course.client_id as string | null) ?? undefined,
        hasSummary: summaryMeta != null,
        summaryId: summaryMeta?.id,
        folderId: summaryMeta?.folder_id,
        title: (course.subject as string) || (course.title as string),
        startsAt,
        endsAt,
        kind: "course",
        status: course.status as string,
        counterpartName: client
          ? `${client.first_name} ${client.last_name}`.trim()
          : undefined,
        studentConfirmedAt: course.student_confirmed_at as string | null,
        providerConfirmedAt: course.provider_confirmed_at as string | null,
        ...sessionFieldsFromCourse(course),
      });
    }

    for (const event of events) {
      if (!event.courseId) continue;
      const summaryMeta = summaryMetaByCourseId.get(event.courseId);
      if (summaryMeta) {
        event.hasSummary = true;
        event.summaryId = summaryMeta.id;
        event.folderId = summaryMeta.folder_id;
      }
    }

    const teacherCourseIds = events
      .filter((e) => e.courseId)
      .map((e) => e.courseId as string);
    const ratingsByCourseId = await loadRatingsByCourseIds(teacherCourseIds);
    attachRatingsToEvents(events, ratingsByCourseId, {});
  } else {
    const { data: courses, error: coursesError } =
      await queryCoursesWithSessionFallback({
        selectWithSession: STUDENT_COURSE_SELECT_WITH_SESSION,
        selectLegacy: STUDENT_COURSE_SELECT_LEGACY,
        roleField: "client_id",
        userId,
        from,
        to,
        includeCancelled,
        excludePaymentPending: true,
      });

    if (coursesError) {
      res.status(500).json({ error: coursesError.message });
      return;
    }

    const courseIds = (courses ?? []).map((c) => c.id as string);
    const summaryMetaByCourseId = await loadSummaryMetaByCourseId(courseIds);

    for (const course of courses ?? []) {
      const provider = profileName(course.provider);
      const slot = pickOne<{ starts_at: string; ends_at: string }>(course.slot);
      const scheduledAt = course.scheduled_at as string;
      const startsAt = slot?.starts_at ?? scheduledAt;
      const endsAt = slot?.ends_at
        ? slotEnd(startsAt, slot.ends_at)
        : defaultEndFromStart(startsAt);
      const courseId = course.id as string;
      const summaryMeta = summaryMetaByCourseId.get(courseId);
      events.push({
        id: courseId,
        courseId,
        providerId: (course.provider_id as string | null) ?? undefined,
        hasSummary: summaryMeta != null,
        summaryId: summaryMeta?.id,
        folderId: summaryMeta?.folder_id,
        title: (course.subject as string) || (course.title as string),
        startsAt,
        endsAt,
        kind: "course",
        status: course.status as string,
        counterpartName: provider
          ? `${provider.first_name} ${provider.last_name}`.trim()
          : undefined,
        studentConfirmedAt: course.student_confirmed_at as string | null,
        providerConfirmedAt: course.provider_confirmed_at as string | null,
        ...sessionFieldsFromCourse(course),
      });
    }

    const studentCourseIds = events
      .filter((e) => e.courseId)
      .map((e) => e.courseId as string);
    const ratingsByCourseId = await loadRatingsByCourseIds(studentCourseIds);
    attachRatingsToEvents(events, ratingsByCourseId, { studentId: userId });
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
