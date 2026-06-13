import type { AccountStatus, UserRole } from "@gadz-connect/types";
import { Router } from "express";
import { z } from "zod";
import {
  adminCampusFilter,
  type AdminRequest,
  requireAdmin,
} from "../middleware/admin.js";
import { requireAuth } from "../middleware/auth.js";
import {
  exportAdminScheduleCsv,
  fetchAdminCampuses,
  fetchAdminScheduleEvents,
  fetchAdminScheduleSummary,
  parseAdminScheduleQuery,
} from "../lib/admin-schedule.js";
import {
  fetchAdminBudgets,
  fetchAdminTransactions,
  parseAdminBudgetQuery,
  parseAdminTransactionsQuery,
} from "../lib/admin-budget.js";
import { supabaseAdmin } from "../lib/supabase.js";
import {
  fetchAdminProfileDetail,
  listAdminProfiles,
  type AdminProfileFilter,
} from "../lib/admin-profiles-query.js";
import {
  fetchAdminCourseDetail,
  fetchAdminCoursesSummary,
  listAdminCourses,
  parseAdminCoursesQuery,
} from "../lib/admin-courses-query.js";
import { computeMarketplaceStatus } from "../lib/tutor-visibility.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

const updateStatusSchema = z.object({
  account_status: z.enum(["pending_siret", "active", "suspended"]),
});

function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value) || 0;
  return 0;
}

function emptyStatusCounts(): Record<AccountStatus, number> {
  return { pending_siret: 0, active: 0, suspended: 0 };
}

function summarizeStripeAccounts(
  profiles: Array<{
    stripe_connect_account_id: string | null;
    stripe_connect_onboarding_complete: boolean | null;
  }>,
) {
  return {
    total: profiles.length,
    withAccount: profiles.filter((p) => p.stripe_connect_account_id).length,
    onboardingComplete: profiles.filter(
      (p) => p.stripe_connect_onboarding_complete,
    ).length,
    pending: profiles.filter(
      (p) => p.stripe_connect_account_id && !p.stripe_connect_onboarding_complete,
    ).length,
    withoutAccount: profiles.filter((p) => !p.stripe_connect_account_id).length,
  };
}

function getWeekBounds(reference = new Date()) {
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

const ADMIN_PROFILE_FILTERS = new Set<AdminProfileFilter>([
  "verification_failed",
  "duplicates",
  "suspended",
  "pending_siret",
  "stripe_incomplete",
]);

function parseAdminProfilesQuery(req: AdminRequest) {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const filterParam = req.query.filter as string | undefined;
  const filter =
    filterParam && ADMIN_PROFILE_FILTERS.has(filterParam as AdminProfileFilter)
      ? (filterParam as AdminProfileFilter)
      : undefined;

  const pageRaw = req.query.page as string | undefined;
  const limitRaw = req.query.limit as string | undefined;
  const page = pageRaw ? Math.max(1, Number.parseInt(pageRaw, 10) || 1) : undefined;
  const limit = limitRaw
    ? Math.min(100, Math.max(1, Number.parseInt(limitRaw, 10) || 25))
    : undefined;

  return {
    campusScopeId: campusFilter?.campusId,
    search: (req.query.search as string | undefined)?.trim() || undefined,
    role: parseAdminRole(req.query.role as string | undefined),
    account_status: parseAccountStatus(
      req.query.account_status as string | undefined,
    ),
    campus_id: campusFilter
      ? undefined
      : (req.query.campus_id as string | undefined) || undefined,
    filter,
    page,
    limit,
  };
}

const USER_ROLES = new Set<UserRole>([
  "student_provider",
  "teacher",
  "admin_campus",
  "admin_general",
]);

function parseAdminRole(
  value: string | undefined,
): UserRole | "admin" | undefined {
  if (!value) return undefined;
  if (value === "admin") return "admin";
  if (USER_ROLES.has(value as UserRole)) return value as UserRole;
  return undefined;
}

function parseAccountStatus(
  value: string | undefined,
): AccountStatus | undefined {
  if (
    value === "pending_siret" ||
    value === "active" ||
    value === "suspended"
  ) {
    return value;
  }
  return undefined;
}

/**
 * GET /api/admin/profiles
 * Liste des profils (filtrée par campus pour admin_campus).
 */
adminRouter.get("/profiles", async (req: AdminRequest, res) => {
  try {
    const params = parseAdminProfilesQuery(req);
    const result = await listAdminProfiles(params);

    res.json({
      data: result.rows,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    });
  } catch (error) {
    console.error("[admin] profiles:", error);
    res.status(500).json({ error: "Impossible de charger les profils" });
  }
});

/**
 * GET /api/admin/profiles/:id
 * Fiche détail d'un utilisateur (admin).
 */
adminRouter.get("/profiles/:id", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const profileId = req.params.id as string;

  try {
    const detail = await fetchAdminProfileDetail(
      profileId,
      campusFilter?.campusId,
    );

    if (!detail) {
      res.status(404).json({ error: "Profil introuvable ou hors périmètre" });
      return;
    }

    res.json({ data: detail });
  } catch (error) {
    console.error("[admin] profile detail:", error);
    res.status(500).json({ error: "Impossible de charger le profil" });
  }
});

/**
 * PATCH /api/admin/profiles/:id/status
 * Valide un SIRET (activation manuelle exceptionnelle) ou change le statut compte.
 */
adminRouter.patch(
  "/profiles/:id/status",
  async (req: AdminRequest, res) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
      return;
    }

    const profileId = req.params.id;
    const campusFilter = adminCampusFilter(req.adminProfile!);

    let targetQuery = supabaseAdmin
      .from("profiles")
      .select("id, campus_id, account_status, siret")
      .eq("id", profileId);

    if (campusFilter) {
      targetQuery = targetQuery.eq("campus_id", campusFilter.campusId);
    }

    const { data: target, error: targetError } = await targetQuery.maybeSingle();

    if (targetError || !target) {
      res.status(404).json({ error: "Profil introuvable ou hors périmètre" });
      return;
    }

    const { account_status } = parsed.data;

    if (
      target.account_status === "pending_siret" &&
      account_status === "active" &&
      !target.siret
    ) {
      res.status(400).json({
        error:
          "Impossible de valider — le professeur n'a pas encore déclaré son SIRET.",
      });
      return;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ account_status })
      .eq("id", profileId)
      .select(
        "id, first_name, last_name, role, account_status, siret, campus_id, campus:campus_id ( name )",
      )
      .single();

    if (updateError || !updated) {
      console.error("[admin] update status:", updateError?.message);
      res.status(500).json({ error: "Impossible de mettre à jour le statut" });
      return;
    }

    res.json({ data: updated });
  },
);

/**
 * GET /api/admin/dashboard
 * Agrégats budgets / cours / comptes Stripe (données Supabase uniquement).
 */
adminRouter.get("/dashboard", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const campusId = campusFilter?.campusId;
  const weekBounds = getWeekBounds();

  let profilesQuery = supabaseAdmin.from("profiles").select(
    `id, role, account_status, campus_id,
     stripe_connect_account_id, stripe_connect_onboarding_complete,
     registration_path, siret_verification_failed, inpi_declaration_sent_at,
     profile_setup_complete, hourly_rate,
     first_name, last_name, created_at,
     campus:campus_id ( name )`,
  );
  if (campusId) profilesQuery = profilesQuery.eq("campus_id", campusId);

  let coursesCountQuery = supabaseAdmin
    .from("courses")
    .select("id, status, campus_id, scheduled_at", { count: "exact", head: false });
  let coursesRecentQuery = supabaseAdmin
    .from("courses")
    .select("id, title, status, campus_id, created_at, campus:campus_id ( name )")
    .order("created_at", { ascending: false })
    .limit(20);
  let coursesWeekQuery = supabaseAdmin
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("status", "scheduled")
    .gte("scheduled_at", weekBounds.start.toISOString())
    .lte("scheduled_at", weekBounds.end.toISOString());

  if (campusId) {
    coursesCountQuery = coursesCountQuery.eq("campus_id", campusId);
    coursesRecentQuery = coursesRecentQuery.eq("campus_id", campusId);
    coursesWeekQuery = coursesWeekQuery.eq("campus_id", campusId);
  }

  const [
    { data: profiles, error: profilesError },
    { data: allCourses, error: coursesCountError },
    { data: recentCourses, error: coursesRecentError },
    { count: thisWeekScheduled, error: coursesWeekError },
  ] = await Promise.all([
    profilesQuery,
    coursesCountQuery,
    coursesRecentQuery,
    coursesWeekQuery,
  ]);

  if (
    profilesError ||
    coursesCountError ||
    coursesRecentError ||
    coursesWeekError
  ) {
    console.error(
      "[admin] dashboard:",
      profilesError?.message,
      coursesCountError?.message,
      coursesRecentError?.message,
      coursesWeekError?.message,
    );
    res.status(500).json({ error: "Impossible de charger le tableau de bord" });
    return;
  }

  const profileList = profiles ?? [];
  const courseList = allCourses ?? [];
  const recentCourseList = recentCourses ?? [];

  const profilesByStatus = emptyStatusCounts();
  const profilesByRole: Record<string, number> = {};
  const profilesByRoleAndStatus: Record<string, Record<AccountStatus, number>> =
    {};

  for (const p of profileList) {
    const status = p.account_status as AccountStatus;
    const role = p.role as string;
    profilesByStatus[status] = (profilesByStatus[status] ?? 0) + 1;
    profilesByRole[role] = (profilesByRole[role] ?? 0) + 1;
    if (!profilesByRoleAndStatus[role]) {
      profilesByRoleAndStatus[role] = emptyStatusCounts();
    }
    profilesByRoleAndStatus[role][status] =
      (profilesByRoleAndStatus[role][status] ?? 0) + 1;
  }

  const teacherProfiles = profileList.filter((p) => p.role === "teacher");
  const stripeAccounts = summarizeStripeAccounts(profileList);
  const stripeAccountsTeachers = summarizeStripeAccounts(teacherProfiles);

  const onboarding = {
    existingSiret: teacherProfiles.filter(
      (p) => p.registration_path === "existing_siret",
    ).length,
    newMicro: teacherProfiles.filter((p) => p.registration_path === "new_micro")
      .length,
    verificationFailed: teacherProfiles.filter((p) => p.siret_verification_failed)
      .length,
    inpiSent: teacherProfiles.filter((p) => p.inpi_declaration_sent_at).length,
  };

  const pickOne = <T,>(value: unknown): T | null => {
    if (!value) return null;
    return (Array.isArray(value) ? value[0] : value) as T;
  };

  const recentProfiles = profileList
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at as string).getTime() -
        new Date(a.created_at as string).getTime(),
    )
    .slice(0, 10)
    .map((p) => ({
      id: p.id as string,
      first_name: (p.first_name as string) ?? "",
      last_name: (p.last_name as string) ?? "",
      role: p.role,
      account_status: p.account_status as AccountStatus,
      created_at: p.created_at as string,
      campus: pickOne<{ name: string }>(p.campus),
    }));

  const coursesByStatus: Record<string, number> = {};
  for (const c of courseList) {
    coursesByStatus[c.status as string] =
      (coursesByStatus[c.status as string] ?? 0) + 1;
  }

  let byCampus: Array<{
    campusId: string;
    name: string;
    teachersActive: number;
    studentsActive: number;
    coursesScheduled: number;
    pendingSiret: number;
  }> | undefined;

  if (!campusId) {
    const campusMap = new Map<
      string,
      {
        campusId: string;
        name: string;
        teachersActive: number;
        studentsActive: number;
        coursesScheduled: number;
        pendingSiret: number;
      }
    >();

    for (const p of profileList) {
      const id = p.campus_id as string;
      if (!id) continue;
      const campus = pickOne<{ name: string }>(p.campus);
      if (!campusMap.has(id)) {
        campusMap.set(id, {
          campusId: id,
          name: campus?.name ?? "Campus",
          teachersActive: 0,
          studentsActive: 0,
          coursesScheduled: 0,
          pendingSiret: 0,
        });
      }
      const row = campusMap.get(id)!;
      if (p.role === "teacher" && p.account_status === "active") {
        row.teachersActive += 1;
      }
      if (p.role === "student_provider" && p.account_status === "active") {
        row.studentsActive += 1;
      }
      if (p.account_status === "pending_siret") {
        row.pendingSiret += 1;
      }
    }

    for (const c of courseList) {
      const id = c.campus_id as string;
      if (!id || c.status !== "scheduled") continue;
      if (!campusMap.has(id)) {
        campusMap.set(id, {
          campusId: id,
          name: "Campus",
          teachersActive: 0,
          studentsActive: 0,
          coursesScheduled: 0,
          pendingSiret: 0,
        });
      }
      campusMap.get(id)!.coursesScheduled += 1;
    }

    byCampus = [...campusMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    );
  }

  const teacherIds = teacherProfiles.map((p) => p.id as string);
  const slotCounts = new Map<string, number>();
  if (teacherIds.length > 0) {
    const nowIso = new Date().toISOString();
    const { data: futureSlots } = await supabaseAdmin
      .from("tutor_slots")
      .select("provider_id")
      .in("provider_id", teacherIds)
      .gt("starts_at", nowIso);
    for (const slot of futureSlots ?? []) {
      const providerId = slot.provider_id as string;
      slotCounts.set(providerId, (slotCounts.get(providerId) ?? 0) + 1);
    }
  }

  let visibleTeachers = 0;
  let withFutureSlots = 0;
  for (const teacher of teacherProfiles) {
    const futureSlotCount = slotCounts.get(teacher.id as string) ?? 0;
    if (futureSlotCount > 0) withFutureSlots += 1;
    const status = computeMarketplaceStatus(
      {
        role: teacher.role as string,
        account_status: teacher.account_status as string,
        profile_setup_complete: teacher.profile_setup_complete,
        stripe_connect_onboarding_complete:
          teacher.stripe_connect_onboarding_complete,
        hourly_rate: teacher.hourly_rate as number | null,
      },
      futureSlotCount,
    );
    if (status.visible) visibleTeachers += 1;
  }

  const marketplace = {
    visibleTeachers,
    activeTeachers: teacherProfiles.filter((p) => p.account_status === "active")
      .length,
    withFutureSlots,
  };

  let transactions: Array<{
    amount_gross: unknown;
    commission_sasu: unknown;
    taxes_urssaf: unknown;
    net_payout: unknown;
    status_stripe: string;
    status_urssaf: string;
  }> = [];

  if (campusId) {
    const { data: campusCourses } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("campus_id", campusId);
    const courseIds = (campusCourses ?? []).map((c) => c.id as string);
    if (courseIds.length > 0) {
      const { data: txData, error: txError } = await supabaseAdmin
        .from("transactions")
        .select(
          "amount_gross, commission_sasu, taxes_urssaf, net_payout, status_stripe, status_urssaf",
        )
        .in("course_id", courseIds);
      if (txError) {
        console.error("[admin] transactions:", txError.message);
      } else {
        transactions = txData ?? [];
      }
    }
  } else {
    const { data: txData, error: txError } = await supabaseAdmin
      .from("transactions")
      .select(
        "amount_gross, commission_sasu, taxes_urssaf, net_payout, status_stripe, status_urssaf",
      );
    if (txError) {
      console.error("[admin] transactions:", txError.message);
    } else {
      transactions = txData ?? [];
    }
  }

  const budgets = {
    volumeBrut: 0,
    volumeCommissions: 0,
    volumeUrssaf: 0,
    volumeNetVerse: 0,
    encaisseBrut: 0,
    encaisseNet: 0,
    enAttenteBrut: 0,
  };
  const transactionsByStripeStatus: Record<string, number> = {};

  for (const tx of transactions) {
    const gross = parseAmount(tx.amount_gross);
    const commission = parseAmount(tx.commission_sasu);
    const urssaf = parseAmount(tx.taxes_urssaf);
    const net = parseAmount(tx.net_payout);
    const stripeStatus = tx.status_stripe as string;

    budgets.volumeBrut += gross;
    budgets.volumeCommissions += commission;
    budgets.volumeUrssaf += urssaf;
    budgets.volumeNetVerse += net;
    transactionsByStripeStatus[stripeStatus] =
      (transactionsByStripeStatus[stripeStatus] ?? 0) + 1;

    if (stripeStatus === "succeeded") {
      budgets.encaisseBrut += gross;
      budgets.encaisseNet += net;
    } else if (stripeStatus === "pending") {
      budgets.enAttenteBrut += gross;
    }
  }

  res.json({
    data: {
      scope: campusId ? "campus" : "global",
      profiles: {
        total: profileList.length,
        byStatus: profilesByStatus,
        byRole: profilesByRole,
        byRoleAndStatus: profilesByRoleAndStatus,
      },
      courses: {
        total: courseList.length,
        byStatus: coursesByStatus,
        thisWeekScheduled: thisWeekScheduled ?? 0,
        recent: recentCourseList,
      },
      transactions: {
        total: transactions.length,
        byStripeStatus: transactionsByStripeStatus,
      },
      budgets,
      stripeAccounts,
      stripeAccountsTeachers,
      onboarding,
      recentProfiles,
      marketplace,
      ...(byCampus ? { byCampus } : {}),
    },
  });
});

/**
 * GET /api/admin/budgets
 * Agrégats financiers par période (transactions Supabase).
 */
adminRouter.get("/budgets", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const scopeCampusId = campusFilter?.campusId;
  const params = parseAdminBudgetQuery(req.query as Record<string, unknown>);

  try {
    const data = await fetchAdminBudgets(scopeCampusId, params);
    res.json({ data });
  } catch (err) {
    console.error("[admin] budgets:", (err as Error).message);
    res.status(500).json({ error: "Impossible de charger les budgets" });
  }
});

/**
 * GET /api/admin/transactions
 * Liste paginée des transactions avec jointures cours / prof / campus.
 */
adminRouter.get("/transactions", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const scopeCampusId = campusFilter?.campusId;
  const params = parseAdminTransactionsQuery(
    req.query as Record<string, unknown>,
  );

  try {
    const { transactions, meta } = await fetchAdminTransactions(
      scopeCampusId,
      params,
    );
    res.json({ data: transactions, meta });
  } catch (err) {
    console.error("[admin] transactions:", (err as Error).message);
    res.status(500).json({ error: "Impossible de charger les transactions" });
  }
});

/**
 * GET /api/admin/schedule/summary
 * Agrégats KPI pour le bandeau planning admin.
 */
adminRouter.get("/schedule/summary", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const scopeCampusId = campusFilter?.campusId;
  const params = parseAdminScheduleQuery(
    req.query as Record<string, unknown>,
  );

  try {
    const summary = await fetchAdminScheduleSummary(scopeCampusId, params);
    res.json({ data: summary });
  } catch (err) {
    console.error("[admin] schedule/summary:", (err as Error).message);
    res.status(500).json({ error: "Impossible de charger les indicateurs" });
  }
});

/**
 * GET /api/admin/schedule/export
 * Export CSV de la plage filtrée.
 */
adminRouter.get("/schedule/export", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const scopeCampusId = campusFilter?.campusId;
  const params = parseAdminScheduleQuery(
    req.query as Record<string, unknown>,
  );

  try {
    const csv = await exportAdminScheduleCsv(scopeCampusId, params);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="planning-campus.csv"',
    );
    res.send("\uFEFF" + csv);
  } catch (err) {
    console.error("[admin] schedule/export:", (err as Error).message);
    res.status(500).json({ error: "Impossible d'exporter le planning" });
  }
});

/**
 * GET /api/admin/campuses
 * Liste des campus (filtre planning admin général).
 */
adminRouter.get("/campuses", async (_req: AdminRequest, res) => {
  try {
    const campuses = await fetchAdminCampuses();
    res.json({ data: campuses });
  } catch (err) {
    console.error("[admin] campuses:", (err as Error).message);
    res.status(500).json({ error: "Impossible de charger les campus" });
  }
});

/**
 * GET /api/admin/schedule
 * Emploi du temps campus (cours planifiés).
 * Query: from, to, campusId, status, includeCancelled, search
 */
adminRouter.get("/schedule", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const scopeCampusId = campusFilter?.campusId;
  const params = parseAdminScheduleQuery(
    req.query as Record<string, unknown>,
  );

  try {
    const events = await fetchAdminScheduleEvents(scopeCampusId, params);
    res.json({ data: { events } });
  } catch (err) {
    console.error("[admin] schedule:", (err as Error).message);
    res.status(500).json({ error: "Impossible de charger le planning" });
  }
});

/**
 * GET /api/admin/courses/summary
 * Agrégats KPI pour le registre cours admin.
 */
adminRouter.get("/courses/summary", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const scopeCampusId = campusFilter?.campusId;
  const campusId =
    typeof req.query.campus_id === "string" && req.query.campus_id.trim()
      ? req.query.campus_id.trim()
      : undefined;

  try {
    const summary = await fetchAdminCoursesSummary(scopeCampusId, campusId);
    res.json({ data: summary });
  } catch (err) {
    console.error("[admin] courses/summary:", (err as Error).message);
    res.status(500).json({ error: "Impossible de charger les indicateurs" });
  }
});

/**
 * GET /api/admin/courses
 * Registre paginé des cours (filtré par campus pour admin_campus).
 */
adminRouter.get("/courses", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const scopeCampusId = campusFilter?.campusId;

  try {
    const params = parseAdminCoursesQuery(
      req.query as Record<string, unknown>,
      scopeCampusId,
    );
    const result = await listAdminCourses(params);

    res.json({
      data: result.rows,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    });
  } catch (err) {
    console.error("[admin] courses:", (err as Error).message);
    res.status(500).json({ error: "Impossible de charger les cours" });
  }
});

/**
 * GET /api/admin/courses/:id
 * Fiche détail d'un cours (admin).
 */
adminRouter.get("/courses/:id", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const courseId = req.params.id as string;

  try {
    const detail = await fetchAdminCourseDetail(
      courseId,
      campusFilter?.campusId,
    );

    if (!detail) {
      res.status(404).json({ error: "Cours introuvable ou hors périmètre" });
      return;
    }

    res.json({ data: detail });
  } catch (err) {
    console.error("[admin] course detail:", (err as Error).message);
    res.status(500).json({ error: "Impossible de charger le cours" });
  }
});

/**
 * GET /api/admin/me
 * Vérifie le rôle admin de l'utilisateur connecté.
 */
adminRouter.get("/me", async (req: AdminRequest, res) => {
  res.json({
    data: {
      id: req.adminProfile!.id,
      role: req.adminProfile!.role,
      campus_id: req.adminProfile!.campus_id,
      first_name: req.adminProfile!.first_name,
      last_name: req.adminProfile!.last_name,
    },
  });
});
