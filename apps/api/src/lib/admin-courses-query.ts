import { supabaseAdmin } from "./supabase.js";
import { resolveAdminScheduleCampusId } from "./admin-schedule.js";

const DEFAULT_SESSION_MS = 60 * 60 * 1000;

export type AdminCoursePreset =
  | "missing_summary"
  | "this_week"
  | "cancelled";

export type AdminCourseSort =
  | "scheduled_at_desc"
  | "scheduled_at_asc"
  | "status";

export interface AdminCoursesListParams {
  campusScopeId?: string;
  search?: string;
  status?: string[];
  campus_id?: string;
  from?: string;
  to?: string;
  preset?: AdminCoursePreset;
  page?: number;
  limit?: number;
  sort?: AdminCourseSort;
}

export interface AdminCourseListRow {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  scheduled_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  campus_id: string;
  provider_id: string | null;
  client_id: string | null;
  campus: { name: string } | null;
  provider_name: string | null;
  client_name: string | null;
  has_summary: boolean;
  missing_summary: boolean;
  stripe_status: string | null;
  cancellation_notification_id: string | null;
  created_at: string;
}

export interface AdminCoursesListResult {
  rows: AdminCourseListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCoursesSummary {
  total: number;
  byStatus: Record<string, number>;
  thisWeekScheduled: number;
  missingSummaries: number;
  cancelled: number;
}

export interface AdminCourseDetail extends AdminCourseListRow {
  description: string | null;
  summary_id: string | null;
  transaction_id: string | null;
}

const COURSE_LIST_SELECT = `
  id,
  title,
  subject,
  description,
  status,
  scheduled_at,
  campus_id,
  provider_id,
  client_id,
  slot_id,
  created_at,
  campus:campus_id ( name ),
  provider:provider_id ( first_name, last_name ),
  client:client_id ( first_name, last_name ),
  slot:slot_id ( starts_at, ends_at )
`;

type RawCourseRow = {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  status: string;
  scheduled_at: string | null;
  campus_id: string;
  provider_id: string | null;
  client_id: string | null;
  slot_id: string | null;
  created_at: string;
  campus: unknown;
  provider: unknown;
  client: unknown;
  slot: unknown;
};

function pickOne<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? value[0] : value) as T;
}

function defaultEndFromStart(startsAt: string): string {
  return new Date(new Date(startsAt).getTime() + DEFAULT_SESSION_MS).toISOString();
}

export function getWeekBounds(reference = new Date()) {
  const start = new Date(reference);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatPersonName(
  person: { first_name: string; last_name: string } | null,
): string | null {
  if (!person) return null;
  const name = `${person.first_name} ${person.last_name}`.trim();
  return name || null;
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

async function loadTransactionStatusByCourseId(
  courseIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (courseIds.length === 0) return map;

  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("course_id, status_stripe")
    .in("course_id", courseIds);

  for (const tx of transactions ?? []) {
    if (tx.course_id) {
      map.set(tx.course_id as string, tx.status_stripe as string);
    }
  }

  return map;
}

function resolveSessionTimes(course: RawCourseRow): {
  starts_at: string | null;
  ends_at: string | null;
} {
  const slot = pickOne<{ starts_at: string; ends_at: string }>(course.slot);
  const scheduledAt = course.scheduled_at;
  if (!scheduledAt && !slot?.starts_at) {
    return { starts_at: null, ends_at: null };
  }
  const starts_at = slot?.starts_at ?? scheduledAt;
  const ends_at = slot?.ends_at ?? (starts_at ? defaultEndFromStart(starts_at) : null);
  return { starts_at, ends_at };
}

function enrichCourseRow(
  course: RawCourseRow,
  summaryMeta: Map<string, { id: string }>,
  cancellationMeta: Map<string, string>,
  transactionMeta: Map<string, string>,
  now = Date.now(),
): AdminCourseListRow {
  const provider = pickOne<{ first_name: string; last_name: string }>(
    course.provider,
  );
  const client = pickOne<{ first_name: string; last_name: string }>(
    course.client,
  );
  const campus = pickOne<{ name: string }>(course.campus);
  const { starts_at, ends_at } = resolveSessionTimes(course);
  const summary = summaryMeta.get(course.id);
  const cancellationNotificationId = cancellationMeta.get(course.id);
  const endMs = ends_at ? new Date(ends_at).getTime() : 0;
  const past = endMs > 0 && endMs < now;
  const has_summary = summary != null;
  const missing_summary =
    past && !has_summary && course.status !== "cancelled";

  return {
    id: course.id,
    title: course.title,
    subject: course.subject,
    status: course.status,
    scheduled_at: course.scheduled_at,
    starts_at,
    ends_at,
    campus_id: course.campus_id,
    provider_id: course.provider_id,
    client_id: course.client_id,
    campus: campus ? { name: campus.name } : null,
    provider_name: formatPersonName(provider),
    client_name: formatPersonName(client),
    has_summary,
    missing_summary,
    stripe_status: transactionMeta.get(course.id) ?? null,
    cancellation_notification_id: cancellationNotificationId ?? null,
    created_at: course.created_at,
  };
}

function matchesSearch(row: AdminCourseListRow, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    row.title,
    row.subject,
    row.provider_name,
    row.client_name,
    row.campus?.name,
    row.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesPreset(
  row: AdminCourseListRow,
  preset: AdminCoursePreset | undefined,
  weekBounds: { start: Date; end: Date },
): boolean {
  if (!preset) return true;

  switch (preset) {
    case "missing_summary":
      return row.missing_summary;
    case "this_week": {
      if (!row.starts_at) return false;
      const ms = new Date(row.starts_at).getTime();
      return (
        ms >= weekBounds.start.getTime() &&
        ms <= weekBounds.end.getTime() &&
        row.status === "scheduled"
      );
    }
    case "cancelled":
      return row.status === "cancelled";
    default:
      return true;
  }
}

function sortCourses(
  rows: AdminCourseListRow[],
  sort: AdminCourseSort = "scheduled_at_desc",
): AdminCourseListRow[] {
  const statusOrder: Record<string, number> = {
    scheduled: 0,
    completed: 1,
    cancelled: 2,
  };

  return rows.slice().sort((a, b) => {
    if (sort === "status") {
      const statusDiff =
        (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
    }

    const aTime = a.starts_at
      ? new Date(a.starts_at).getTime()
      : new Date(a.created_at).getTime();
    const bTime = b.starts_at
      ? new Date(b.starts_at).getTime()
      : new Date(b.created_at).getTime();

    if (sort === "scheduled_at_asc") return aTime - bTime;
    return bTime - aTime;
  });
}

function buildCoursesListQuery(
  campusScopeId: string | undefined,
  params: AdminCoursesListParams,
) {
  let query = supabaseAdmin
    .from("courses")
    .select(COURSE_LIST_SELECT)
    .order("scheduled_at", { ascending: false, nullsFirst: false });

  const effectiveCampusId = resolveAdminScheduleCampusId(
    campusScopeId,
    params.campus_id,
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
  }

  return query;
}

async function loadEnrichedCourses(
  campusScopeId: string | undefined,
  params: AdminCoursesListParams,
): Promise<AdminCourseListRow[]> {
  const { data, error } = await buildCoursesListQuery(campusScopeId, params);

  if (error) {
    throw new Error(error.message);
  }

  const courses = (data ?? []) as RawCourseRow[];
  const courseIds = courses.map((c) => c.id);

  const [summaryMeta, cancellationMeta, transactionMeta] = await Promise.all([
    loadSummaryMetaByCourseId(courseIds),
    loadCancellationNotificationByCourseId(courseIds),
    loadTransactionStatusByCourseId(courseIds),
  ]);

  return courses.map((course) =>
    enrichCourseRow(course, summaryMeta, cancellationMeta, transactionMeta),
  );
}

export async function listAdminCourses(
  params: AdminCoursesListParams,
): Promise<AdminCoursesListResult> {
  const weekBounds = getWeekBounds();
  let rows = await loadEnrichedCourses(params.campusScopeId, params);

  if (params.preset) {
    rows = rows.filter((row) => matchesPreset(row, params.preset, weekBounds));
  }

  if (params.search) {
    rows = rows.filter((row) => matchesSearch(row, params.search!));
  }

  rows = sortCourses(rows, params.sort ?? "scheduled_at_desc");

  const total = rows.length;
  const pageSize = params.limit ?? 50;
  const page = params.page ?? 1;
  const start = (page - 1) * pageSize;
  const paginated = rows.slice(start, start + pageSize);

  return {
    rows: paginated,
    total,
    page,
    pageSize,
  };
}

export async function fetchAdminCoursesSummary(
  campusScopeId: string | undefined,
  campusId?: string,
): Promise<AdminCoursesSummary> {
  const weekBounds = getWeekBounds();
  const rows = await loadEnrichedCourses(campusScopeId, {
    campusScopeId,
    campus_id: campusId,
  });

  const byStatus: Record<string, number> = {};
  let thisWeekScheduled = 0;
  let missingSummaries = 0;
  let cancelled = 0;

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (row.missing_summary) missingSummaries++;
    if (row.status === "cancelled") cancelled++;
    if (
      row.status === "scheduled" &&
      row.starts_at &&
      new Date(row.starts_at).getTime() >= weekBounds.start.getTime() &&
      new Date(row.starts_at).getTime() <= weekBounds.end.getTime()
    ) {
      thisWeekScheduled++;
    }
  }

  return {
    total: rows.length,
    byStatus,
    thisWeekScheduled,
    missingSummaries,
    cancelled,
  };
}

export async function fetchAdminCourseDetail(
  courseId: string,
  campusScopeId?: string,
): Promise<AdminCourseDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(COURSE_LIST_SELECT)
    .eq("id", courseId)
    .maybeSingle();

  if (error || !data) return null;

  const course = data as RawCourseRow;

  if (campusScopeId && course.campus_id !== campusScopeId) {
    return null;
  }

  const [summaryMeta, cancellationMeta, transactionMeta] = await Promise.all([
    loadSummaryMetaByCourseId([courseId]),
    loadCancellationNotificationByCourseId([courseId]),
    loadTransactionStatusByCourseId([courseId]),
  ]);

  const row = enrichCourseRow(
    course,
    summaryMeta,
    cancellationMeta,
    transactionMeta,
  );
  const summary = summaryMeta.get(courseId);
  const transactions = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();

  return {
    ...row,
    description: course.description,
    summary_id: summary?.id ?? null,
    transaction_id: (transactions.data?.id as string | undefined) ?? null,
  };
}

export function parseAdminCoursesQuery(
  query: Record<string, unknown>,
  campusScopeId?: string,
): AdminCoursesListParams {
  const search =
    typeof query.search === "string" && query.search.trim()
      ? query.search.trim()
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

  const presetRaw = query.preset as string | undefined;
  const preset =
    presetRaw === "missing_summary" ||
    presetRaw === "this_week" ||
    presetRaw === "cancelled"
      ? presetRaw
      : undefined;

  const pageRaw = query.page as string | undefined;
  const limitRaw = query.limit as string | undefined;
  const page = pageRaw
    ? Math.max(1, Number.parseInt(pageRaw, 10) || 1)
    : undefined;
  const limit = limitRaw
    ? Math.min(100, Math.max(1, Number.parseInt(limitRaw, 10) || 50))
    : undefined;

  const sortRaw = query.sort as string | undefined;
  const sort =
    sortRaw === "scheduled_at_asc" ||
    sortRaw === "scheduled_at_desc" ||
    sortRaw === "status"
      ? sortRaw
      : undefined;

  const from =
    typeof query.from === "string" && query.from.trim()
      ? query.from.trim()
      : undefined;
  const to =
    typeof query.to === "string" && query.to.trim()
      ? query.to.trim()
      : undefined;

  const campus_id =
    campusScopeId
      ? undefined
      : typeof query.campus_id === "string" && query.campus_id.trim()
        ? query.campus_id.trim()
        : undefined;

  return {
    campusScopeId,
    search,
    status,
    campus_id,
    from,
    to,
    preset,
    page,
    limit,
    sort,
  };
}
