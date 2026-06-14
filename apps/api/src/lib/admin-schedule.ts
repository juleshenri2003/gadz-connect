import { supabaseAdmin } from "./supabase.js";

const DEFAULT_SESSION_MS = 60 * 60 * 1000;

export interface AdminScheduleQuery {
  from?: string;
  to?: string;
  campusId?: string;
  status?: string[];
  includeCancelled?: boolean;
  search?: string;
}

export interface AdminScheduleEvent {
  id: string;
  courseId: string;
  slotId?: string;
  clientId?: string;
  providerId?: string;
  campusId?: string;
  hasSummary?: boolean;
  summaryId?: string;
  cancellationNotificationId?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  kind: "course";
  status: string;
  providerName?: string;
  clientName?: string;
  campusName?: string;
}

export interface AdminScheduleSummary {
  totalSessions: number;
  byStatus: Record<string, number>;
  byCampus: Array<{ campusId: string; campusName: string; count: number }>;
  missingSummaries: number;
  openSlots?: number;
}

function pickOne<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? value[0] : value) as T;
}

function defaultEndFromStart(startsAt: string): string {
  return new Date(new Date(startsAt).getTime() + DEFAULT_SESSION_MS).toISOString();
}

function parseIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function resolveAdminScheduleCampusId(
  scopeCampusId: string | undefined,
  requestedCampusId?: string,
): string | undefined {
  if (scopeCampusId) return scopeCampusId;
  return requestedCampusId;
}

export function parseAdminScheduleQuery(query: Record<string, unknown>): AdminScheduleQuery {
  const from = parseIsoDate(query.from);
  const to = parseIsoDate(query.to);
  const campusId =
    typeof query.campusId === "string" && query.campusId.trim()
      ? query.campusId.trim()
      : undefined;
  const includeCancelled = query.includeCancelled === "true";
  const search =
    typeof query.search === "string" && query.search.trim()
      ? query.search.trim().toLowerCase()
      : undefined;

  let status: string[] | undefined;
  const rawStatus = query.status;
  if (typeof rawStatus === "string" && rawStatus.trim()) {
    status = rawStatus.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(rawStatus)) {
    status = rawStatus
      .flatMap((s) => (typeof s === "string" ? s.split(",") : []))
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return { from, to, campusId, status, includeCancelled, search };
}

async function loadSummaryMetaByCourseId(
  courseIds: string[],
): Promise<Map<string, { id: string }>> {
  const map = new Map<string, { id: string }>();
  if (courseIds.length === 0) return map;

  const { data: summaries } = await supabaseAdmin
    .from("course_summaries")
    .select("id, course_id")
    .in("course_id", courseIds);

  for (const row of summaries ?? []) {
    if (row.course_id) {
      map.set(row.course_id as string, { id: row.id as string });
    }
  }

  return map;
}

async function loadCancellationNotificationByCourseId(
  courseIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (courseIds.length === 0) return map;

  const { data: notifications } = await supabaseAdmin
    .from("campus_notifications")
    .select("id, course_id")
    .in("course_id", courseIds)
    .in("kind", ["prof_unavailable", "student_unavailable"]);

  for (const n of notifications ?? []) {
    const courseId = n.course_id as string;
    if (!courseId) continue;
    map.set(courseId, n.id as string);
  }

  return map;
}

type CourseRow = {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  scheduled_at: string;
  campus_id: string;
  provider_id: string | null;
  client_id: string | null;
  slot_id: string | null;
  provider: unknown;
  client: unknown;
  campus: unknown;
  slot: unknown;
};

function buildCoursesQuery(
  scopeCampusId: string | undefined,
  params: AdminScheduleQuery,
) {
  let query = supabaseAdmin
    .from("courses")
    .select(
      `
      id, title, subject, status, scheduled_at, campus_id,
      provider_id, client_id, slot_id,
      provider:provider_id ( first_name, last_name ),
      client:client_id ( first_name, last_name ),
      campus:campus_id ( id, name ),
      slot:slot_id ( starts_at, ends_at )
    `,
    )
    .not("scheduled_at", "is", null)
    .order("scheduled_at");

  const effectiveCampusId = resolveAdminScheduleCampusId(
    scopeCampusId,
    params.campusId,
  );
  if (effectiveCampusId) {
    query = query.eq("campus_id", effectiveCampusId);
  }

  if (params.from) {
    query = query.gte("scheduled_at", params.from);
  }
  if (params.to) {
    query = query.lte("scheduled_at", params.to);
  }

  if (params.status && params.status.length > 0) {
    query = query.in("status", params.status);
  } else if (!params.includeCancelled) {
    query = query.neq("status", "cancelled");
  }

  return query;
}

function mapCourseToEvent(
  course: CourseRow,
  summaryMeta: Map<string, { id: string }>,
  cancellationMeta: Map<string, string>,
): AdminScheduleEvent {
  const provider = pickOne<{ first_name: string; last_name: string }>(
    course.provider,
  );
  const client = pickOne<{ first_name: string; last_name: string }>(
    course.client,
  );
  const campus = pickOne<{ id: string; name: string }>(course.campus);
  const slot = pickOne<{ starts_at: string; ends_at: string }>(course.slot);
  const scheduledAt = course.scheduled_at;
  const startsAt = slot?.starts_at ?? scheduledAt;
  const endsAt = slot?.ends_at ?? defaultEndFromStart(startsAt);
  const courseId = course.id;
  const summary = summaryMeta.get(courseId);
  const cancellationNotificationId = cancellationMeta.get(courseId);

  return {
    id: courseId,
    courseId,
    slotId: course.slot_id ?? undefined,
    clientId: course.client_id ?? undefined,
    providerId: course.provider_id ?? undefined,
    campusId: course.campus_id,
    hasSummary: summary != null,
    summaryId: summary?.id,
    cancellationNotificationId,
    title: course.subject || course.title,
    startsAt,
    endsAt,
    kind: "course",
    status: course.status,
    providerName: provider
      ? `${provider.first_name} ${provider.last_name}`.trim()
      : undefined,
    clientName: client
      ? `${client.first_name} ${client.last_name}`.trim()
      : undefined,
    campusName: campus?.name,
  };
}

function matchesSearch(event: AdminScheduleEvent, search: string): boolean {
  const haystack = [
    event.title,
    event.providerName,
    event.clientName,
    event.campusName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(search);
}

export async function fetchAdminScheduleEvents(
  scopeCampusId: string | undefined,
  params: AdminScheduleQuery,
): Promise<AdminScheduleEvent[]> {
  const { data, error } = await buildCoursesQuery(scopeCampusId, params);

  if (error) {
    throw new Error(error.message);
  }

  const courses = (data ?? []) as CourseRow[];
  const courseIds = courses.map((c) => c.id);

  const [summaryMeta, cancellationMeta] = await Promise.all([
    loadSummaryMetaByCourseId(courseIds),
    loadCancellationNotificationByCourseId(courseIds),
  ]);

  let events = courses.map((course) =>
    mapCourseToEvent(course, summaryMeta, cancellationMeta),
  );

  if (params.search) {
    events = events.filter((e) => matchesSearch(e, params.search!));
  }

  return events;
}

export async function fetchAdminScheduleSummary(
  scopeCampusId: string | undefined,
  params: Pick<AdminScheduleQuery, "from" | "to" | "campusId">,
): Promise<AdminScheduleSummary> {
  const queryParams: AdminScheduleQuery = {
    ...params,
    includeCancelled: true,
  };

  const { data, error } = await buildCoursesQuery(scopeCampusId, queryParams);

  if (error) {
    throw new Error(error.message);
  }

  const courses = (data ?? []) as Array<{
    id: string;
    status: string;
    scheduled_at: string;
    campus_id: string;
    campus: unknown;
  }>;

  const courseIds = courses.map((c) => c.id);
  const summaryMeta = await loadSummaryMetaByCourseId(courseIds);

  const byStatus: Record<string, number> = {};
  const byCampusMap = new Map<
    string,
    { campusId: string; campusName: string; count: number }
  >();
  let missingSummaries = 0;
  const now = Date.now();

  for (const course of courses) {
    const status = course.status;
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    const campus = pickOne<{ id: string; name: string }>(course.campus);
    const campusId = course.campus_id;
    const campusName = campus?.name ?? "—";
    const existing = byCampusMap.get(campusId);
    if (existing) {
      existing.count++;
    } else {
      byCampusMap.set(campusId, { campusId, campusName, count: 1 });
    }

    const scheduledMs = new Date(course.scheduled_at).getTime();
    if (
      scheduledMs < now &&
      status !== "cancelled" &&
      !summaryMeta.has(course.id)
    ) {
      missingSummaries++;
    }
  }

  const effectiveCampusId = resolveAdminScheduleCampusId(
    scopeCampusId,
    params.campusId,
  );

  let openSlots: number | undefined;
  if (params.from && params.to) {
    const slotsQuery = supabaseAdmin
      .from("tutor_slots")
      .select("id, provider_id")
      .eq("booked", false)
      .gte("starts_at", params.from)
      .lte("starts_at", params.to);

    const { data: slots, error: slotsError } = await slotsQuery;
    if (!slotsError && slots) {
      if (effectiveCampusId) {
        const { data: campusProviders } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("campus_id", effectiveCampusId)
          .eq("role", "teacher");
        const providerIds = new Set(
          (campusProviders ?? []).map((p) => p.id as string),
        );
        openSlots = (slots ?? []).filter((s) =>
          providerIds.has(s.provider_id as string),
        ).length;
      } else {
        openSlots = slots.length;
      }
    }
  }

  return {
    totalSessions: courses.length,
    byStatus,
    byCampus: [...byCampusMap.values()].sort((a, b) =>
      a.campusName.localeCompare(b.campusName, "fr"),
    ),
    missingSummaries,
    openSlots,
  };
}

export async function fetchAdminCampuses(): Promise<
  Array<{ id: string; name: string }>
> {
  const { data, error } = await supabaseAdmin
    .from("campus")
    .select("id, name")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
  }));
}

export async function exportAdminScheduleCsv(
  scopeCampusId: string | undefined,
  params: AdminScheduleQuery,
): Promise<string> {
  const events = await fetchAdminScheduleEvents(scopeCampusId, {
    ...params,
    includeCancelled: params.includeCancelled ?? true,
  });

  const header =
    "Date;Heure début;Heure fin;Matière;Professeur;Élève;Campus;Statut;Compte-rendu\n";
  const rows = events.map((e) => {
    const start = new Date(e.startsAt);
    const end = new Date(e.endsAt);
    const date = start.toLocaleDateString("fr-FR");
    const timeStart = start.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const timeEnd = end.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const escape = (v: string | undefined) =>
      `"${(v ?? "").replace(/"/g, '""')}"`;
    return [
      date,
      timeStart,
      timeEnd,
      escape(e.title),
      escape(e.providerName),
      escape(e.clientName),
      escape(e.campusName),
      escape(e.status),
      e.hasSummary ? "Oui" : "Non",
    ].join(";");
  });

  return header + rows.join("\n");
}
