import { supabaseAdmin } from "./supabase.js";
import { markPastCoursesCompleted } from "./course-completion.js";

export interface CourseEvaluationListItem {
  courseId: string;
  subject: string;
  scheduledAt: string | null;
  counterpartName: string;
  status: string;
  rating: { stars: number } | null;
  canRate: boolean;
  hasSummary: boolean;
  summaryTitle: string | null;
  hasSummaryPdf: boolean;
  clarificationsCount: number;
  messagesCount: number;
  lastMessageAt: string | null;
  studentSessionConfirmedAt: string | null;
  providerSessionConfirmedAt: string | null;
  sessionConfirmationCompletedAt: string | null;
  bothConfirmed: boolean;
}

function profileFullName(
  row: { first_name?: string; last_name?: string } | null | undefined,
): string {
  if (!row) return "—";
  return `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—";
}

function pickOne<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? value[0] : value) as T;
}

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the") ||
    message.includes("schema cache")
  );
}

const COURSE_SELECT_WITH_SESSION = `
  id, subject, title, status, scheduled_at, client_id, provider_id,
  student_confirmed_at, provider_confirmed_at,
  student_session_confirmed_at, provider_session_confirmed_at,
  session_confirmation_completed_at,
  client:client_id ( first_name, last_name ),
  provider:provider_id ( first_name, last_name )
`;

const COURSE_SELECT_LEGACY = `
  id, subject, title, status, scheduled_at, client_id, provider_id,
  student_confirmed_at, provider_confirmed_at,
  client:client_id ( first_name, last_name ),
  provider:provider_id ( first_name, last_name )
`;

function confirmationFromCourse(course: Record<string, unknown>): {
  studentSessionConfirmedAt: string | null;
  providerSessionConfirmedAt: string | null;
  sessionConfirmationCompletedAt: string | null;
  bothConfirmed: boolean;
} {
  const hasSessionCols = Object.prototype.hasOwnProperty.call(
    course,
    "student_session_confirmed_at",
  );
  const student =
    (hasSessionCols
      ? ((course.student_session_confirmed_at as string | null) ?? null)
      : null) ??
    ((course.student_confirmed_at as string | null) ?? null);
  const provider =
    (hasSessionCols
      ? ((course.provider_session_confirmed_at as string | null) ?? null)
      : null) ??
    ((course.provider_confirmed_at as string | null) ?? null);
  const completed =
    (course.session_confirmation_completed_at as string | null | undefined) ??
    (student && provider ? student : null);

  return {
    studentSessionConfirmedAt: student,
    providerSessionConfirmedAt: provider,
    sessionConfirmationCompletedAt: completed,
    bothConfirmed: Boolean(completed || (student && provider)),
  };
}

export async function fetchCourseEvaluationsForUser(
  userId: string,
  role: string,
): Promise<CourseEvaluationListItem[]> {
  await markPastCoursesCompleted();

  const isStudent = role === "student_provider";
  const roleField = isStudent ? "client_id" : "provider_id";

  async function runSelect(select: string) {
    return supabaseAdmin
      .from("courses")
      .select(select)
      .eq(roleField, userId)
      .in("status", ["completed", "awaiting_session_confirmation", "scheduled"])
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: false });
  }

  let coursesRaw: Record<string, unknown>[] | null = null;
  let queryError: { message: string } | null = null;

  {
    const first = await runSelect(COURSE_SELECT_WITH_SESSION);
    if (first.error && isMissingColumnError(first.error.message)) {
      const legacy = await runSelect(COURSE_SELECT_LEGACY);
      if (
        legacy.error &&
        (legacy.error.message.includes("invalid input value for enum") ||
          legacy.error.message.includes("awaiting_session_confirmation"))
      ) {
        const fallback = await supabaseAdmin
          .from("courses")
          .select(COURSE_SELECT_LEGACY)
          .eq(roleField, userId)
          .in("status", ["completed", "scheduled"])
          .not("scheduled_at", "is", null)
          .order("scheduled_at", { ascending: false });
        coursesRaw = (fallback.data as unknown as Record<string, unknown>[]) ?? null;
        queryError = fallback.error;
      } else {
        coursesRaw = (legacy.data as unknown as Record<string, unknown>[]) ?? null;
        queryError = legacy.error;
      }
    } else if (
      first.error &&
      (first.error.message.includes("invalid input value for enum") ||
        first.error.message.includes("awaiting_session_confirmation"))
    ) {
      const fallback = await supabaseAdmin
        .from("courses")
        .select(COURSE_SELECT_WITH_SESSION)
        .eq(roleField, userId)
        .in("status", ["completed", "scheduled"])
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: false });
      if (fallback.error && isMissingColumnError(fallback.error.message)) {
        const legacy = await supabaseAdmin
          .from("courses")
          .select(COURSE_SELECT_LEGACY)
          .eq(roleField, userId)
          .in("status", ["completed", "scheduled"])
          .not("scheduled_at", "is", null)
          .order("scheduled_at", { ascending: false });
        coursesRaw = (legacy.data as unknown as Record<string, unknown>[]) ?? null;
        queryError = legacy.error;
      } else {
        coursesRaw = (fallback.data as unknown as Record<string, unknown>[]) ?? null;
        queryError = fallback.error;
      }
    } else {
      coursesRaw = (first.data as unknown as Record<string, unknown>[]) ?? null;
      queryError = first.error;
    }
  }

  if (queryError) {
    throw new Error(queryError.message);
  }

  const now = Date.now();
  const courses = (coursesRaw ?? []).filter((course) => {
    const status = course.status as string;
    if (status === "completed" || status === "awaiting_session_confirmation") {
      return true;
    }
    const scheduledAt = course.scheduled_at as string | null;
    return (
      status === "scheduled" &&
      scheduledAt != null &&
      new Date(scheduledAt).getTime() < now
    );
  });

  const courseIds = courses.map((c) => c.id as string);
  if (courseIds.length === 0) return [];

  const [ratingsResult, summariesResult, clarificationsResult, messagesResult] =
    await Promise.all([
      supabaseAdmin
        .from("course_ratings")
        .select("course_id, stars, rater_id")
        .in("course_id", courseIds),
      supabaseAdmin
        .from("course_summaries")
        .select("course_id, title, pdf_path")
        .in("course_id", courseIds),
      supabaseAdmin
        .from("course_clarifications")
        .select("course_id")
        .in("course_id", courseIds),
      supabaseAdmin
        .from("course_exchange_messages")
        .select("course_id, created_at")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false }),
    ]);

  const ratingsByCourse = new Map<
    string,
    { stars: number; rater_id: string }
  >();
  for (const row of ratingsResult.data ?? []) {
    ratingsByCourse.set(row.course_id as string, {
      stars: Number(row.stars),
      rater_id: row.rater_id as string,
    });
  }

  const summariesByCourse = new Map<
    string,
    { title: string; pdf_path: string | null }
  >();
  for (const row of summariesResult.data ?? []) {
    summariesByCourse.set(row.course_id as string, {
      title: row.title as string,
      pdf_path: (row.pdf_path as string | null) ?? null,
    });
  }

  const clarificationsCountByCourse = new Map<string, number>();
  for (const row of clarificationsResult.data ?? []) {
    const id = row.course_id as string;
    clarificationsCountByCourse.set(id, (clarificationsCountByCourse.get(id) ?? 0) + 1);
  }

  const messagesMetaByCourse = new Map<
    string,
    { count: number; lastAt: string | null }
  >();
  for (const row of messagesResult.data ?? []) {
    const id = row.course_id as string;
    const existing = messagesMetaByCourse.get(id);
    if (!existing) {
      messagesMetaByCourse.set(id, {
        count: 1,
        lastAt: row.created_at as string,
      });
    } else {
      existing.count += 1;
    }
  }

  return courses.map((course) => {
    const courseId = course.id as string;
    const subject =
      (course.subject as string) || (course.title as string) || "Cours";
    const client = pickOne<{ first_name: string; last_name: string }>(
      course.client,
    );
    const provider = pickOne<{ first_name: string; last_name: string }>(
      course.provider,
    );
    const rating = ratingsByCourse.get(courseId) ?? null;
    const summary = summariesByCourse.get(courseId);
    const scheduledAt = course.scheduled_at as string | null;
    const past =
      scheduledAt != null && new Date(scheduledAt).getTime() < now;
    const confirmation = confirmationFromCourse(course);
    const eligibleToRate =
      isStudent &&
      past &&
      (course.status === "completed" || confirmation.bothConfirmed) &&
      !rating;

    return {
      courseId,
      subject,
      scheduledAt,
      counterpartName: isStudent
        ? profileFullName(provider)
        : profileFullName(client),
      status: course.status as string,
      rating: rating ? { stars: rating.stars } : null,
      canRate: eligibleToRate,
      hasSummary: Boolean(summary),
      summaryTitle: summary?.title ?? null,
      hasSummaryPdf: Boolean(summary?.pdf_path),
      clarificationsCount: clarificationsCountByCourse.get(courseId) ?? 0,
      messagesCount: messagesMetaByCourse.get(courseId)?.count ?? 0,
      lastMessageAt: messagesMetaByCourse.get(courseId)?.lastAt ?? null,
      ...confirmation,
    };
  });
}

export interface CourseEvaluationDetail {
  courseId: string;
  subject: string;
  scheduledAt: string | null;
  status: string;
  counterpart: { id: string; name: string; role: string };
  viewerRole: "student" | "teacher";
  rating: { stars: number; createdAt: string } | null;
  canRate: boolean;
  summary: {
    id: string;
    title: string;
    content: string;
    hasPdf: boolean;
    publishedAt: string;
    folderId: string;
  } | null;
  clarifications: Array<{
    id: string;
    title: string;
    content: string | null;
    hasPdf: boolean;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    authorId: string;
    authorName: string;
    body: string;
    createdAt: string;
    isMine: boolean;
  }>;
}

export async function fetchCourseEvaluationDetail(
  courseId: string,
  userId: string,
  role: string,
): Promise<CourseEvaluationDetail | null> {
  await markPastCoursesCompleted();

  const { data: course, error } = await supabaseAdmin
    .from("courses")
    .select(
      `
      id, subject, title, status, scheduled_at, client_id, provider_id, campus_id,
      client:client_id ( id, first_name, last_name, role ),
      provider:provider_id ( id, first_name, last_name, role )
    `,
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error || !course) return null;

  const isStudent = role === "student_provider";
  const isTeacher = role === "teacher";
  const clientId = course.client_id as string | null;
  const providerId = course.provider_id as string | null;

  if (isStudent && clientId !== userId) return null;
  if (isTeacher && providerId !== userId) return null;
  if (!isStudent && !isTeacher) return null;

  const client = pickOne<{
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  }>(course.client);
  const provider = pickOne<{
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  }>(course.provider);

  const [ratingResult, summaryResult, clarificationsResult, messagesResult] =
    await Promise.all([
      supabaseAdmin
        .from("course_ratings")
        .select("stars, created_at, rater_id")
        .eq("course_id", courseId)
        .maybeSingle(),
      supabaseAdmin
        .from("course_summaries")
        .select("id, title, content, pdf_path, published_at, folder_id")
        .eq("course_id", courseId)
        .maybeSingle(),
      supabaseAdmin
        .from("course_clarifications")
        .select("id, title, content, pdf_path, created_at")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("course_exchange_messages")
        .select(
          `
          id, author_id, body, created_at,
          author:author_id ( first_name, last_name )
        `,
        )
        .eq("course_id", courseId)
        .order("created_at", { ascending: true }),
    ]);

  const ratingRow = ratingResult.data;
  const scheduledAt = course.scheduled_at as string | null;
  const past =
    scheduledAt != null && new Date(scheduledAt).getTime() < Date.now();

  const subject =
    (course.subject as string) || (course.title as string) || "Cours";

  return {
    courseId,
    subject,
    scheduledAt,
    status: course.status as string,
    counterpart: isStudent
      ? {
          id: provider?.id ?? "",
          name: profileFullName(provider),
          role: provider?.role ?? "teacher",
        }
      : {
          id: client?.id ?? "",
          name: profileFullName(client),
          role: client?.role ?? "student_provider",
        },
    viewerRole: isStudent ? "student" : "teacher",
    rating: ratingRow
      ? {
          stars: Number(ratingRow.stars),
          createdAt: ratingRow.created_at as string,
        }
      : null,
    canRate: isStudent && past && course.status === "completed" && !ratingRow,
    summary: summaryResult.data
      ? {
          id: summaryResult.data.id as string,
          title: summaryResult.data.title as string,
          content: summaryResult.data.content as string,
          hasPdf: Boolean(summaryResult.data.pdf_path),
          publishedAt: summaryResult.data.published_at as string,
          folderId: summaryResult.data.folder_id as string,
        }
      : null,
    clarifications: (clarificationsResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      content: (row.content as string | null) ?? null,
      hasPdf: Boolean(row.pdf_path),
      createdAt: row.created_at as string,
    })),
    messages: (messagesResult.data ?? []).map((row) => {
      const author = pickOne<{ first_name: string; last_name: string }>(
        row.author,
      );
      return {
        id: row.id as string,
        authorId: row.author_id as string,
        authorName: profileFullName(author),
        body: row.body as string,
        createdAt: row.created_at as string,
        isMine: row.author_id === userId,
      };
    }),
  };
}

export async function userCanAccessCourse(
  courseId: string,
  userId: string,
  role: string,
): Promise<{
  course: {
    id: string;
    campus_id: string;
    client_id: string | null;
    provider_id: string | null;
    subject: string | null;
    title: string;
    scheduled_at: string | null;
    status: string;
  };
  isStudent: boolean;
  isTeacher: boolean;
} | null> {
  const { data: course, error } = await supabaseAdmin
    .from("courses")
    .select(
      "id, campus_id, client_id, provider_id, subject, title, scheduled_at, status",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error || !course) return null;

  const isStudent = role === "student_provider" && course.client_id === userId;
  const isTeacher = role === "teacher" && course.provider_id === userId;
  if (!isStudent && !isTeacher) return null;

  return { course, isStudent, isTeacher };
}
