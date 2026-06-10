import type { AccountStatus } from "@gadz-connect/types";
import { Router } from "express";
import { z } from "zod";
import {
  adminCampusFilter,
  type AdminRequest,
  requireAdmin,
} from "../middleware/admin.js";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

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

/**
 * GET /api/admin/profiles
 * Liste des profils (filtrée par campus pour admin_campus).
 */
adminRouter.get("/profiles", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);

  let query = supabaseAdmin
    .from("profiles")
    .select(
      `
      id,
      first_name,
      last_name,
      role,
      campus_id,
      siret,
      account_status,
      micro_enterprise_activity,
      stripe_connect_account_id,
      stripe_connect_onboarding_complete,
      created_at,
      campus:campus_id ( name )
    `,
    )
    .order("created_at", { ascending: false });

  if (campusFilter) {
    query = query.eq("campus_id", campusFilter.campusId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin] profiles:", error.message);
    res.status(500).json({ error: "Impossible de charger les profils" });
    return;
  }

  res.json({ data: data ?? [] });
});

/**
 * PATCH /api/admin/profiles/:id/status
 * Valide un SIRET (pending_siret → active) ou change le statut compte.
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

  let profilesQuery = supabaseAdmin.from("profiles").select(
    "id, role, account_status, stripe_connect_account_id, stripe_connect_onboarding_complete",
  );
  if (campusId) profilesQuery = profilesQuery.eq("campus_id", campusId);

  let coursesCountQuery = supabaseAdmin
    .from("courses")
    .select("id, status", { count: "exact", head: false });
  let coursesRecentQuery = supabaseAdmin
    .from("courses")
    .select("id, title, status, campus_id, created_at, campus:campus_id ( name )")
    .order("created_at", { ascending: false })
    .limit(20);
  if (campusId) {
    coursesCountQuery = coursesCountQuery.eq("campus_id", campusId);
    coursesRecentQuery = coursesRecentQuery.eq("campus_id", campusId);
  }

  const [
    { data: profiles, error: profilesError },
    { data: allCourses, error: coursesCountError },
    { data: recentCourses, error: coursesRecentError },
  ] = await Promise.all([profilesQuery, coursesCountQuery, coursesRecentQuery]);

  if (profilesError || coursesCountError || coursesRecentError) {
    console.error(
      "[admin] dashboard:",
      profilesError?.message,
      coursesCountError?.message,
      coursesRecentError?.message,
    );
    res.status(500).json({ error: "Impossible de charger le tableau de bord" });
    return;
  }

  const profileList = profiles ?? [];
  const courseList = allCourses ?? [];
  const recentCourseList = recentCourses ?? [];

  const profilesByStatus: Record<AccountStatus, number> = {
    pending_siret: 0,
    active: 0,
    suspended: 0,
  };
  const profilesByRole: Record<string, number> = {};

  for (const p of profileList) {
    const status = p.account_status as AccountStatus;
    profilesByStatus[status] = (profilesByStatus[status] ?? 0) + 1;
    profilesByRole[p.role as string] = (profilesByRole[p.role as string] ?? 0) + 1;
  }

  const stripeAccounts = {
    total: profileList.length,
    withAccount: profileList.filter((p) => p.stripe_connect_account_id).length,
    onboardingComplete: profileList.filter(
      (p) => p.stripe_connect_onboarding_complete,
    ).length,
    pending: profileList.filter(
      (p) => p.stripe_connect_account_id && !p.stripe_connect_onboarding_complete,
    ).length,
    withoutAccount: profileList.filter((p) => !p.stripe_connect_account_id).length,
  };

  const coursesByStatus: Record<string, number> = {};
  for (const c of courseList) {
    coursesByStatus[c.status as string] =
      (coursesByStatus[c.status as string] ?? 0) + 1;
  }

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
      },
      courses: {
        total: courseList.length,
        byStatus: coursesByStatus,
        recent: recentCourseList,
      },
      transactions: {
        total: transactions.length,
        byStripeStatus: transactionsByStripeStatus,
      },
      budgets,
      stripeAccounts,
    },
  });
});

/**
 * GET /api/admin/schedule
 * Emploi du temps campus (cours planifiés).
 */
adminRouter.get("/schedule", async (req: AdminRequest, res) => {
  const campusFilter = adminCampusFilter(req.adminProfile!);
  const campusId = campusFilter?.campusId;

  let query = supabaseAdmin
    .from("courses")
    .select(
      `
      id, title, subject, status, scheduled_at, campus_id,
      provider:provider_id ( first_name, last_name ),
      client:client_id ( first_name, last_name ),
      campus:campus_id ( name )
    `,
    )
    .not("scheduled_at", "is", null)
    .order("scheduled_at");

  if (campusId) {
    query = query.eq("campus_id", campusId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin] schedule:", error.message);
    res.status(500).json({ error: "Impossible de charger le planning" });
    return;
  }

  const pickOne = <T,>(value: unknown): T | null => {
    if (!value) return null;
    return (Array.isArray(value) ? value[0] : value) as T;
  };

  const events = (data ?? []).map((course) => {
    const provider = pickOne<{ first_name: string; last_name: string }>(
      course.provider,
    );
    const client = pickOne<{ first_name: string; last_name: string }>(
      course.client,
    );
    const campus = pickOne<{ name: string }>(course.campus);
    const scheduledAt = course.scheduled_at as string;

    return {
      id: course.id as string,
      title: (course.subject as string) || (course.title as string),
      startsAt: scheduledAt,
      endsAt: scheduledAt,
      kind: "course" as const,
      status: course.status as string,
      providerName: provider
        ? `${provider.first_name} ${provider.last_name}`.trim()
        : undefined,
      clientName: client
        ? `${client.first_name} ${client.last_name}`.trim()
        : undefined,
      campusName: campus?.name,
    };
  });

  res.json({ data: { events } });
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
