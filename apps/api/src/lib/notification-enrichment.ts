import {
  replacementProposalsAvailable,
  replacementTeacherDeclinesAvailable,
} from "./notification-helpers.js";
import { supabaseAdmin } from "./supabase.js";

export type TeacherResponseStatus = "none" | "proposed" | "declined";

interface ProfileRow {
  id: string;
  role: string;
}

interface NotificationCore {
  id: string;
  kind: string;
  replacement_status: string;
  declared_by: string;
  client_id?: string | null;
}

export async function loadTeacherResponseMap(
  teacherId: string,
  notificationIds: string[],
): Promise<Map<string, TeacherResponseStatus>> {
  const map = new Map<string, TeacherResponseStatus>();
  if (notificationIds.length === 0) return map;

  for (const id of notificationIds) {
    map.set(id, "none");
  }

  if (await replacementProposalsAvailable()) {
    const { data: proposals } = await supabaseAdmin
      .from("replacement_proposals")
      .select("notification_id, status")
      .in("notification_id", notificationIds)
      .eq("proposed_provider_id", teacherId);

    for (const row of proposals ?? []) {
      const status = row.status as string;
      map.set(
        row.notification_id as string,
        status === "pending" ? "proposed" : (status as TeacherResponseStatus),
      );
    }
  }

  if (await replacementTeacherDeclinesAvailable()) {
    const { data: declines } = await supabaseAdmin
      .from("replacement_teacher_declines")
      .select("notification_id")
      .in("notification_id", notificationIds)
      .eq("teacher_id", teacherId);

    for (const row of declines ?? []) {
      const id = row.notification_id as string;
      if (map.get(id) === "none") {
        map.set(id, "declined");
      }
    }
  }

  return map;
}

export async function loadPendingProposalCounts(
  notificationIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (notificationIds.length === 0 || !(await replacementProposalsAvailable())) {
    return map;
  }

  for (const id of notificationIds) {
    const { count } = await supabaseAdmin
      .from("replacement_proposals")
      .select("id", { count: "exact", head: true })
      .eq("notification_id", id)
      .eq("status", "pending");

    map.set(id, count ?? 0);
  }

  return map;
}

function isOpenProfUnavailable(n: Record<string, unknown> | null): boolean {
  return Boolean(
    n &&
      n.kind === "prof_unavailable" &&
      n.replacement_status === "open" &&
      typeof n.id === "string",
  );
}

export async function enrichNotificationsForUser<
  T extends {
    read_at: string | null;
    notification: Record<string, unknown> | null;
  },
>(rows: T[], profile: ProfileRow | null): Promise<T[]> {
  if (!profile) return rows;

  if (profile.role === "teacher") {
    const openIds = rows
      .map((row) => row.notification)
      .filter((n): n is Record<string, unknown> => isOpenProfUnavailable(n))
      .map((n) => n.id as string);

    const ownOpenIds = openIds.filter((id) => {
      const n = rows.find((r) => r.notification?.id === id)?.notification;
      return n?.declared_by === profile.id;
    });

    const [responseMap, proposalCounts] = await Promise.all([
      loadTeacherResponseMap(profile.id, openIds),
      loadPendingProposalCounts(ownOpenIds),
    ]);

    return rows.map((row) => {
      const n = row.notification;
      if (!n || typeof n.id !== "string") return row;

      const notificationId = n.id;
      const teacherResponse = responseMap.get(notificationId) ?? "none";
      const pendingProposalsCount =
        n.declared_by === profile.id
          ? (proposalCounts.get(notificationId) ?? 0)
          : undefined;

      return {
        ...row,
        notification: {
          ...n,
          teacher_response: teacherResponse,
          ...(pendingProposalsCount !== undefined
            ? { pending_proposals_count: pendingProposalsCount }
            : {}),
        },
      };
    });
  }

  if (profile.role === "admin_campus" || profile.role === "admin_general") {
    const openIds = rows
      .map((row) => row.notification)
      .filter((n): n is Record<string, unknown> => isOpenProfUnavailable(n))
      .map((n) => n.id as string);

    const proposalCounts = await loadPendingProposalCounts(openIds);

    return rows.map((row) => {
      const n = row.notification;
      if (!n || typeof n.id !== "string" || !isOpenProfUnavailable(n)) return row;

      return {
        ...row,
        notification: {
          ...n,
          pending_proposals_count: proposalCounts.get(n.id as string) ?? 0,
        },
      };
    });
  }

  if (profile.role === "student") {
    const studentOpenIds = rows
      .map((row) => row.notification)
      .filter((n): n is Record<string, unknown> => {
        if (!n) return false;
        return isOpenProfUnavailable(n) && n.client_id === profile.id;
      })
      .map((n) => n.id as string);

    const proposalCounts = await loadPendingProposalCounts(studentOpenIds);

    return rows.map((row) => {
      const n = row.notification;
      if (!n || typeof n.id !== "string") return row;
      if (n.client_id !== profile.id || !isOpenProfUnavailable(n)) return row;

      return {
        ...row,
        notification: {
          ...n,
          pending_proposals_count: proposalCounts.get(n.id as string) ?? 0,
        },
      };
    });
  }

  return rows;
}

export async function computeAdminOpenReplacementCount(
  userId: string,
): Promise<number> {
  const { data: recipients } = await supabaseAdmin
    .from("notification_recipients")
    .select(
      `
      id,
      notification:campus_notifications (
        kind,
        replacement_status
      )
    `,
    )
    .eq("user_id", userId)
    .limit(100);

  let count = 0;
  for (const row of recipients ?? []) {
    const raw = row.notification as unknown as Record<string, unknown> | null;
    if (
      raw?.kind === "prof_unavailable" &&
      raw.replacement_status === "open"
    ) {
      count += 1;
    }
  }
  return count;
}

export async function computeStudentActionCount(userId: string): Promise<number> {
  const { data: recipients } = await supabaseAdmin
    .from("notification_recipients")
    .select(
      `
      id,
      notification:campus_notifications (
        id,
        kind,
        replacement_status,
        client_id
      )
    `,
    )
    .eq("user_id", userId)
    .limit(100);

  const openNotificationIds: string[] = [];

  for (const row of recipients ?? []) {
    const raw = row.notification as unknown as Record<string, unknown> | null;
    if (
      raw &&
      raw.kind === "prof_unavailable" &&
      raw.replacement_status === "open" &&
      raw.client_id === userId &&
      typeof raw.id === "string"
    ) {
      openNotificationIds.push(raw.id as string);
    }
  }

  if (openNotificationIds.length === 0) return 0;

  const proposalCounts = await loadPendingProposalCounts(openNotificationIds);
  let count = 0;
  for (const id of openNotificationIds) {
    if ((proposalCounts.get(id) ?? 0) > 0) {
      count += 1;
    }
  }
  return count;
}

export async function computeTeacherActionCount(
  userId: string,
): Promise<number> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return 0;

  if (profile.role === "student") {
    return computeStudentActionCount(userId);
  }

  if (profile.role === "admin_campus" || profile.role === "admin_general") {
    return computeAdminOpenReplacementCount(userId);
  }

  if (profile.role !== "teacher") {
    const { count } = await supabaseAdmin
      .from("notification_recipients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    return count ?? 0;
  }

  const { data: recipients } = await supabaseAdmin
    .from("notification_recipients")
    .select(
      `
      id,
      read_at,
      notification:campus_notifications (
        id,
        kind,
        replacement_status,
        declared_by
      )
    `,
    )
    .eq("user_id", userId)
    .limit(100);

  const rows = recipients ?? [];
  const openNotifications: NotificationCore[] = [];

  for (const row of rows) {
    const raw = row.notification as unknown as Record<string, unknown> | null;
    if (
      raw &&
      raw.kind === "prof_unavailable" &&
      raw.replacement_status === "open" &&
      typeof raw.id === "string"
    ) {
      openNotifications.push({
        id: raw.id,
        kind: raw.kind as string,
        replacement_status: raw.replacement_status as string,
        declared_by: raw.declared_by as string,
      });
    }
  }

  const toAnswerIds = openNotifications
    .filter((n) => n.declared_by !== userId)
    .map((n) => n.id);

  const responseMap = await loadTeacherResponseMap(userId, toAnswerIds);

  let count = 0;
  for (const id of toAnswerIds) {
    if (responseMap.get(id) === "none") {
      count += 1;
    }
  }

  for (const row of rows) {
    if (row.read_at) continue;
    const raw = row.notification as unknown as Record<string, unknown> | null;
    if (!raw) continue;

    const isOpenColleague =
      raw.kind === "prof_unavailable" &&
      raw.replacement_status === "open" &&
      raw.declared_by !== userId;

    if (isOpenColleague) {
      const id = raw.id as string;
      if (responseMap.get(id) === "none") continue;
    }

    if (
      raw.kind === "prof_unavailable" &&
      raw.replacement_status === "open" &&
      raw.declared_by === userId
    ) {
      continue;
    }

    count += 1;
  }

  return count;
}
