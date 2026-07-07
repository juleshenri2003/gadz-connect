import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loadAccountStatus,
  rejectSuspended,
  requireActiveTeacher,
} from "../middleware/account-status.js";
import { createCvPdfSignedUrl } from "../lib/cv-pdf.js";
import { getProfilePhotoPublicUrl } from "../lib/profile-photo.js";
import { createInvoiceSignedUrl } from "../lib/billing/invoice-storage.js";
import {
  buildTransactionRevenueFromBooking,
  toTransactionInsertRow,
} from "../lib/billing/revenue-split.js";
import {
  finalizeBookingSlot,
  prepareBooking,
  resolveStripePaymentStrategy,
} from "../lib/booking.js";
import { confirmBookingAfterPayment } from "../lib/booking-payment.js";
import { triggerPaymentInvoicesForCourse } from "../lib/billing/trigger-payment-invoices.js";
import { stripe } from "../lib/stripe.js";
import {
  fetchCampusTutorById,
  fetchCampusTutors,
  fetchTutorCvPdfPath,
} from "../lib/tutor-query.js";
import {
  computeMarketplaceStatus,
  isCvComplete,
} from "../lib/tutor-visibility.js";
import { profileLinksSchema } from "../lib/profile-links.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { aggregateTeacherFinancial } from "../lib/tutor-financial.js";
import { mapRatingForProvider, type CourseRatingRow } from "../lib/course-ratings.js";

function mapTutorPublic<
  T extends { cv_pdf_path?: string | null; avatar_path?: string | null },
>(row: T): Omit<T, "cv_pdf_path" | "avatar_path"> & {
  has_cv_pdf: boolean;
  avatar_url: string | null;
} {
  const { cv_pdf_path, avatar_path, ...rest } = row;
  return {
    ...rest,
    has_cv_pdf: Boolean(cv_pdf_path),
    avatar_url: getProfilePhotoPublicUrl(avatar_path),
  };
}

export const tutorsRouter = Router();

tutorsRouter.use(requireAuth);

const tutorProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  cv: z.string().max(5000).optional(),
  hourlyRate: z.number().positive().max(500).optional(),
  subjects: z.array(z.string().min(1).max(80)).max(20).optional(),
  profileLinks: profileLinksSchema.optional(),
});

const slotSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

const bookingSchema = z.object({
  slotId: z.string().uuid(),
  subject: z.string().min(1).max(120).optional(),
  payerName: z.string().trim().min(1).max(120).optional(),
  beneficiaryName: z.string().trim().min(1).max(120).optional(),
});

async function getCallerProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, role, campus_id, account_status, status_acre, versement_liberatoire, first_name, last_name",
    )
    .eq("id", userId)
    .maybeSingle();
  return data;
}

/**
 * GET /api/tutors
 * Professeurs actifs et validés du même campus (marketplace élèves).
 */
tutorsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const caller = await getCallerProfile(req.user!.id);
  if (!caller) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  const { data, error } = await fetchCampusTutors(
    caller.campus_id as string,
    caller.id as string,
  );

  if (error) {
    console.error("[tutors] list:", error.message);
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data: data.map(mapTutorPublic) });
});

async function countFutureSlots(providerId: string): Promise<number> {
  const nowIso = new Date().toISOString();
  const { count, error } = await supabaseAdmin
    .from("tutor_slots")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .gt("starts_at", nowIso);

  if (error) return 0;
  return count ?? 0;
}

const MY_TUTOR_SELECT_VARIANTS = [
  "id, bio, cv, cv_pdf_path, hourly_rate, subjects, profile_links, role, account_status, profile_setup_complete, stripe_connect_onboarding_complete",
  "id, bio, cv, cv_pdf_path, hourly_rate, subjects, role, account_status, profile_setup_complete, stripe_connect_onboarding_complete",
] as const;

const MY_TUTOR_PATCH_SELECT_VARIANTS = [
  "id, bio, cv, hourly_rate, subjects, profile_links",
  "id, bio, cv, hourly_rate, subjects",
] as const;

function isMissingColumnError(error: { code?: string } | null): boolean {
  return error?.code === "42703";
}

type MyTutorProfileRow = {
  id: string;
  bio: string | null;
  cv: string | null;
  cv_pdf_path?: string | null;
  hourly_rate: number | null;
  subjects: string[];
  profile_links: unknown;
  role: string;
  account_status: string;
  profile_setup_complete?: boolean | null;
  stripe_connect_onboarding_complete?: boolean | null;
};

type MyTutorProfilePatchRow = Pick<
  MyTutorProfileRow,
  "id" | "bio" | "cv" | "hourly_rate" | "subjects" | "profile_links"
>;

function asMyTutorProfileRow(data: unknown): MyTutorProfileRow {
  const row = data as MyTutorProfileRow;
  return { ...row, profile_links: row.profile_links ?? [] };
}

function asMyTutorProfilePatchRow(data: unknown): MyTutorProfilePatchRow {
  const row = data as MyTutorProfilePatchRow;
  return { ...row, profile_links: row.profile_links ?? [] };
}

async function fetchMyTutorProfileRow(userId: string) {
  for (const select of MY_TUTOR_SELECT_VARIANTS) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(select)
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      return {
        data: data ? asMyTutorProfileRow(data) : null,
        error: null,
      };
    }
    if (!isMissingColumnError(error)) {
      return { data: null, error };
    }
  }

  return { data: null, error: { message: "Profil introuvable" } };
}

async function updateMyTutorProfileRow(
  userId: string,
  updates: Record<string, unknown>,
) {
  for (const select of MY_TUTOR_PATCH_SELECT_VARIANTS) {
    const payload = { ...updates };
    if (!select.includes("profile_links")) {
      delete payload.profile_links;
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select(select)
      .maybeSingle();

    if (!error) {
      return {
        data: data ? asMyTutorProfilePatchRow(data) : null,
        error: null,
      };
    }
    if (!isMissingColumnError(error)) {
      return { data: null, error };
    }
  }

  return { data: null, error: { message: "Mise à jour impossible" } };
}

/**
 * GET /api/tutors/me
 */
tutorsRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { data, error } = await fetchMyTutorProfileRow(userId);

  if (error || !data) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  const futureSlotCount = await countFutureSlots(userId);
  const marketplace = computeMarketplaceStatus(data, futureSlotCount);

  res.json({
    data: {
      id: data.id,
      bio: data.bio,
      cv: data.cv,
      hourly_rate: data.hourly_rate,
      subjects: data.subjects,
      profile_links: data.profile_links ?? [],
      cv_complete: isCvComplete(data),
      marketplace,
    },
  });
});

/**
 * PATCH /api/tutors/me
 */
tutorsRouter.patch(
  "/me",
  loadAccountStatus,
  rejectSuspended,
  requireActiveTeacher,
  async (req: AuthenticatedRequest, res) => {
  const parsed = tutorProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.cv !== undefined) updates.cv = parsed.data.cv;
  if (parsed.data.hourlyRate !== undefined)
    updates.hourly_rate = parsed.data.hourlyRate;
  if (parsed.data.subjects !== undefined) updates.subjects = parsed.data.subjects;
  if (parsed.data.profileLinks !== undefined)
    updates.profile_links = parsed.data.profileLinks;

  const { data, error } = await updateMyTutorProfileRow(req.user!.id, updates);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data });
  },
);

/**
 * POST /api/tutors/me/slots
 */
tutorsRouter.post(
  "/me/slots",
  loadAccountStatus,
  rejectSuspended,
  requireActiveTeacher,
  async (req: AuthenticatedRequest, res) => {
  const parsed = slotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const starts = new Date(parsed.data.startsAt);
  const ends = new Date(parsed.data.endsAt);
  const now = new Date();

  if (ends <= starts) {
    res.status(400).json({ error: "La fin doit être après le début" });
    return;
  }

  if (starts <= now) {
    res.status(400).json({ error: "Le créneau doit commencer dans le futur" });
    return;
  }

  const durationMs = ends.getTime() - starts.getTime();
  const minMs = 30 * 60 * 1000;
  const maxMs = 4 * 60 * 60 * 1000;
  if (durationMs < minMs) {
    res.status(400).json({ error: "Durée minimum : 30 minutes" });
    return;
  }
  if (durationMs > maxMs) {
    res.status(400).json({ error: "Durée maximum : 4 heures" });
    return;
  }

  const { data: overlapping, error: overlapError } = await supabaseAdmin
    .from("tutor_slots")
    .select("id")
    .eq("provider_id", req.user!.id)
    .lt("starts_at", parsed.data.endsAt)
    .gt("ends_at", parsed.data.startsAt)
    .limit(1);

  if (overlapError) {
    res.status(500).json({ error: overlapError.message });
    return;
  }

  if (overlapping && overlapping.length > 0) {
    res.status(409).json({
      error: "Ce créneau chevauche une disponibilité existante",
    });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("tutor_slots")
    .insert({
      provider_id: req.user!.id,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
    })
    .select("id, starts_at, ends_at, booked")
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ data });
  },
);

/**
 * GET /api/tutors/me/slots
 */
tutorsRouter.get("/me/slots", async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("tutor_slots")
    .select(
      `
      id, starts_at, ends_at, booked, booked_by,
      client:booked_by ( first_name, last_name )
    `,
    )
    .eq("provider_id", req.user!.id)
    .order("starts_at");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const mapped = (data ?? []).map((row) => {
    const clientRaw = Array.isArray(row.client) ? row.client[0] : row.client;
    const client =
      row.booked &&
      clientRaw &&
      typeof clientRaw === "object" &&
      "first_name" in clientRaw
        ? (clientRaw as { first_name: string; last_name: string })
        : null;
    return {
      id: row.id as string,
      starts_at: row.starts_at as string,
      ends_at: row.ends_at as string,
      booked: row.booked as boolean,
      booked_by: row.booked_by as string | null,
      client,
    };
  });

  res.json({ data: mapped });
});

/**
 * DELETE /api/tutors/me/slots/:id
 * Supprime un créneau libre (non réservé) du prestataire connecté.
 */
tutorsRouter.delete(
  "/me/slots/:id",
  loadAccountStatus,
  rejectSuspended,
  requireActiveTeacher,
  async (req: AuthenticatedRequest, res) => {
    const slotId = req.params.id;
    if (!z.string().uuid().safeParse(slotId).success) {
      res.status(400).json({ error: "Identifiant de créneau invalide" });
      return;
    }

    const { data: slot, error: fetchError } = await supabaseAdmin
      .from("tutor_slots")
      .select("id, provider_id, booked")
      .eq("id", slotId)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ error: fetchError.message });
      return;
    }

    if (!slot) {
      res.status(404).json({ error: "Créneau introuvable" });
      return;
    }

    if (slot.provider_id !== req.user!.id) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    if (slot.booked) {
      res.status(409).json({
        error: "Impossible de supprimer un créneau déjà réservé",
      });
      return;
    }

    const { error: deleteError } = await supabaseAdmin
      .from("tutor_slots")
      .delete()
      .eq("id", slotId)
      .eq("provider_id", req.user!.id)
      .eq("booked", false);

    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }

    res.status(204).send();
  },
);

/**
 * GET /api/tutors/me/financial
 * Agrégats financiers du prestataire connecté.
 */
tutorsRouter.get("/me/financial", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, urssaf_periodicity")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  if (profile.role !== "teacher") {
    res.status(403).json({ error: "Réservé aux enseignants" });
    return;
  }

  const { data: courses, error: coursesError } = await supabaseAdmin
    .from("courses")
    .select("id, status, scheduled_at")
    .eq("provider_id", userId);

  if (coursesError) {
    res.status(500).json({ error: coursesError.message });
    return;
  }

  const courseList = courses ?? [];
  const courseIds = courseList.map((course) => course.id as string);

  let transactions: Array<{
    amount_gross: unknown;
    net_payout: unknown;
    status_stripe: string;
    status_urssaf: string;
    created_at: string;
    course_id: string;
  }> = [];

  if (courseIds.length > 0) {
    const { data: txData, error: txError } = await supabaseAdmin
      .from("transactions")
      .select(
        "amount_gross, net_payout, status_stripe, status_urssaf, created_at, course_id",
      )
      .in("course_id", courseIds);

    if (txError) {
      res.status(500).json({ error: txError.message });
      return;
    }

    transactions = txData ?? [];
  }

  const summary = aggregateTeacherFinancial(
    transactions,
    courseList.map((course) => ({
      id: course.id as string,
      status: course.status as string,
      scheduled_at: course.scheduled_at as string | null,
    })),
    profile.urssaf_periodicity as string | null,
  );

  res.json({ data: summary });
});

/**
 * GET /api/tutors/me/ratings
 * Avis reçus (notes uniquement — pas de commentaire).
 */
tutorsRouter.get("/me/ratings", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  if (profile.role !== "teacher") {
    res.status(403).json({ error: "Réservé aux enseignants" });
    return;
  }

  const { data: rows, error } = await supabaseAdmin
    .from("course_ratings")
    .select(
      `
      id,
      course_id,
      campus_id,
      rater_id,
      provider_id,
      stars,
      comment,
      created_at,
      course:course_id ( subject, title, scheduled_at ),
      rater:rater_id ( first_name, last_name )
    `,
    )
    .eq("provider_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const items = (rows ?? []).map((row) => {
    const course = Array.isArray(row.course) ? row.course[0] : row.course;
    const rater = Array.isArray(row.rater) ? row.rater[0] : row.rater;
    const subject =
      (course?.subject as string | null) ||
      (course?.title as string | null) ||
      "Cours";
    const raterName = rater
      ? `${rater.first_name} ${rater.last_name}`.trim()
      : "Élève";

    return mapRatingForProvider(row as CourseRatingRow, {
        subject,
        scheduledAt: (course?.scheduled_at as string | null) ?? null,
        raterName: raterName || "Élève",
      },
    );
  });

  const average =
    items.length > 0
      ? Math.round(
          (items.reduce((sum, item) => sum + item.stars, 0) / items.length) *
            10,
        ) / 10
      : null;

  res.json({
    data: {
      average,
      count: items.length,
      items,
    },
  });
});

const transactionsLimitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(8),
});

/**
 * GET /api/tutors/me/transactions
 * Dernières transactions du prestataire connecté.
 */
tutorsRouter.get("/me/transactions", async (req: AuthenticatedRequest, res) => {
  const parsed = transactionsLimitSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const userId = req.user!.id;
  const limit = parsed.data.limit;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  if (profile.role !== "teacher") {
    res.status(403).json({ error: "Réservé aux enseignants" });
    return;
  }

  const { data: courses, error: coursesError } = await supabaseAdmin
    .from("courses")
    .select(
      `
      id, subject, title, scheduled_at,
      client:client_id ( first_name, last_name )
    `,
    )
    .eq("provider_id", userId);

  if (coursesError) {
    res.status(500).json({ error: coursesError.message });
    return;
  }

  const courseList = courses ?? [];
  const courseIds = courseList.map((course) => course.id as string);

  if (courseIds.length === 0) {
    res.json({ data: [] });
    return;
  }

  const { data: txRows, error: txError } = await supabaseAdmin
    .from("transactions")
    .select(
      "id, amount_gross, commission_sasu, taxes_urssaf, net_payout, status_stripe, status_urssaf, created_at, course_id",
    )
    .in("course_id", courseIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (txError) {
    res.status(500).json({ error: txError.message });
    return;
  }

  const courseById = new Map(
    courseList.map((course) => [course.id as string, course]),
  );

  function profileName(value: unknown): { first_name: string; last_name: string } | null {
    if (!value) return null;
    const row = Array.isArray(value) ? value[0] : value;
    if (!row || typeof row !== "object") return null;
    const p = row as { first_name?: string; last_name?: string };
    return {
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
    };
  }

  const data = (txRows ?? []).map((tx) => {
    const course = courseById.get(tx.course_id as string);
    const client = course ? profileName(course.client) : null;
    return {
      id: tx.id as string,
      amount_gross: Number(tx.amount_gross),
      commission_sasu: Number(tx.commission_sasu),
      taxes_urssaf: Number(tx.taxes_urssaf),
      net_payout: Number(tx.net_payout),
      status_stripe: tx.status_stripe,
      status_urssaf: tx.status_urssaf,
      created_at: tx.created_at as string,
      course: {
        id: course?.id as string,
        subject: (course?.subject as string | null) ?? null,
        title: (course?.title as string) ?? "",
        scheduled_at: (course?.scheduled_at as string | null) ?? null,
        client,
      },
    };
  });

  res.json({ data });
});

/**
 * GET /api/tutors/me/invoices
 * Factures par cours + relevés mensuels (comptabilité URSSAF).
 */
tutorsRouter.get("/me/invoices", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  if (profile.role !== "teacher") {
    res.status(403).json({ error: "Réservé aux enseignants" });
    return;
  }

  const [courseInvoicesResult, summariesResult] = await Promise.all([
    supabaseAdmin
      .from("payment_invoices")
      .select(
        `
        id,
        invoice_number,
        invoice_type,
        amount,
        created_at,
        transaction:transaction_id (
          course:course_id ( subject, title, scheduled_at )
        )
      `,
      )
      .eq("provider_profile_id", userId)
      .eq("invoice_type", "student")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("monthly_invoices")
      .select(
        "id, invoice_number, invoice_type, amount, line_count, billing_period, created_at",
      )
      .eq("profile_id", userId)
      .eq("invoice_type", "student")
      .order("billing_period", { ascending: false }),
  ]);

  if (courseInvoicesResult.error) {
    res.status(500).json({ error: courseInvoicesResult.error.message });
    return;
  }
  if (summariesResult.error) {
    res.status(500).json({ error: summariesResult.error.message });
    return;
  }

  type CourseJoin = {
    subject: string | null;
    title: string;
    scheduled_at: string | null;
  };

  const courseRows = (courseInvoicesResult.data ?? []).map((row) => {
    const transaction = Array.isArray(row.transaction)
      ? row.transaction[0]
      : row.transaction;
    const course = (
      Array.isArray(transaction?.course)
        ? transaction?.course[0]
        : transaction?.course
    ) as CourseJoin | null | undefined;
    const subject = course?.subject ?? course?.title ?? "Cours particulier";

    return {
      id: row.id as string,
      invoice_number: row.invoice_number as string,
      invoice_type: "student" as const,
      amount: Number(row.amount),
      created_at: row.created_at as string,
      course_subject: subject,
      course_title: subject,
      scheduled_at: (course?.scheduled_at as string | null) ?? null,
      is_monthly: false,
      line_count: 1,
    };
  });

  const summaryRows = (summariesResult.data ?? []).map((row) => {
    const billingPeriod = row.billing_period as string;
    const lineCount = Number(row.line_count ?? 0);
    const periodLabel = new Date(`${billingPeriod}T00:00:00.000Z`).toLocaleDateString(
      "fr-FR",
      { month: "long", year: "numeric", timeZone: "UTC" },
    );
    const label = `Relevé mensuel — ${periodLabel} (${lineCount} facture${lineCount > 1 ? "s" : ""})`;

    return {
      id: row.id as string,
      invoice_number: row.invoice_number as string,
      invoice_type: "student" as const,
      amount: Number(row.amount),
      created_at: row.created_at as string,
      course_subject: label,
      course_title: label,
      scheduled_at: `${billingPeriod}T12:00:00.000Z`,
      is_monthly: true,
      line_count: lineCount,
    };
  });

  const merged = [...courseRows, ...summaryRows].sort(
    (a, b) =>
      new Date(b.scheduled_at ?? b.created_at).getTime() -
      new Date(a.scheduled_at ?? a.created_at).getTime(),
  );

  res.json({ data: merged });
});

/**
 * GET /api/tutors/me/invoices/:id/url
 * URL signée pour télécharger une facture ou un relevé mensuel.
 */
tutorsRouter.get(
  "/me/invoices/:id/url",
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;

    const { data: monthlyInvoice, error: monthlyError } = await supabaseAdmin
      .from("monthly_invoices")
      .select("id, storage_path, profile_id, invoice_type")
      .eq("id", invoiceId)
      .maybeSingle();

    if (monthlyError) {
      res.status(500).json({ error: monthlyError.message });
      return;
    }

    if (monthlyInvoice) {
      if (monthlyInvoice.profile_id !== userId) {
        res.status(404).json({ error: "Facture introuvable" });
        return;
      }
      if (monthlyInvoice.invoice_type !== "student") {
        res.status(403).json({ error: "Accès réservé aux factures prestataire" });
        return;
      }

      try {
        const url = await createInvoiceSignedUrl(
          monthlyInvoice.storage_path as string,
        );
        res.json({ data: { url } });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Impossible de générer le lien";
        res.status(500).json({ error: message });
      }
      return;
    }

    const { data: courseInvoice, error: courseError } = await supabaseAdmin
      .from("payment_invoices")
      .select("id, storage_path, provider_profile_id, invoice_type")
      .eq("id", invoiceId)
      .maybeSingle();

    if (courseError) {
      res.status(500).json({ error: courseError.message });
      return;
    }

    if (
      !courseInvoice ||
      courseInvoice.provider_profile_id !== userId ||
      courseInvoice.invoice_type !== "student"
    ) {
      res.status(404).json({ error: "Facture introuvable" });
      return;
    }

    try {
      const url = await createInvoiceSignedUrl(courseInvoice.storage_path as string);
      res.json({ data: { url } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de générer le lien";
      res.status(500).json({ error: message });
    }
  },
);

/**
 * GET /api/tutors/:id/cv-pdf/url
 * Lien signé pour consulter le CV PDF d'un tuteur (même campus).
 */
tutorsRouter.get("/:id/cv-pdf/url", async (req: AuthenticatedRequest, res) => {
  const caller = await getCallerProfile(req.user!.id);
  if (!caller) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  const tutorId = String(req.params.id);
  const { cvPdfPath, error } = await fetchTutorCvPdfPath(
    caller.campus_id as string,
    tutorId,
  );

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!cvPdfPath) {
    res.status(404).json({ error: "CV PDF introuvable" });
    return;
  }

  try {
    const url = await createCvPdfSignedUrl(cvPdfPath);
    res.json({ data: { url } });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/tutors/:id
 */
tutorsRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const caller = await getCallerProfile(req.user!.id);
  if (!caller) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  const tutorId = String(req.params.id);
  const { data, error } = await fetchCampusTutorById(
    caller.campus_id as string,
    tutorId,
  );

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: "Tuteur introuvable" });
    return;
  }

  res.json({ data: mapTutorPublic(data) });
});

/**
 * GET /api/tutors/:id/slots
 */
tutorsRouter.get("/:id/slots", async (req: AuthenticatedRequest, res) => {
  const caller = await getCallerProfile(req.user!.id);
  if (!caller) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  const tutorId = String(req.params.id);
  const { data: tutor, error: tutorError } = await fetchCampusTutorById(
    caller.campus_id as string,
    tutorId,
  );

  if (tutorError) {
    res.status(500).json({ error: tutorError.message });
    return;
  }

  if (!tutor) {
    res.status(404).json({ error: "Tuteur introuvable" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("tutor_slots")
    .select("id, starts_at, ends_at, booked")
    .eq("provider_id", tutorId)
    .eq("booked", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data: data ?? [] });
});

/**
 * POST /api/tutors/bookings
 * Réserve un créneau et crée le cours + transaction.
 * Avec Stripe configuré : PaymentIntent + confirmation webhook avant réservation finale.
 */
tutorsRouter.post("/bookings", async (req: AuthenticatedRequest, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const prepared = await prepareBooking({
    slotId: parsed.data.slotId,
    subject: parsed.data.subject,
    clientUserId: req.user!.id,
  });

  if (!prepared.ok) {
    res.status(prepared.status).json({ error: prepared.error });
    return;
  }

  const { slot, client, tutor, subject, fiscal } = prepared.data;
  const payerName = parsed.data.payerName?.trim() || null;
  const beneficiaryName = parsed.data.beneficiaryName?.trim() || null;
  const paymentStrategy = await resolveStripePaymentStrategy(
    tutor.stripe_connect_account_id,
  );

  if (paymentStrategy === "blocked") {
    res.status(400).json({
      error:
        "Ce professeur n'a pas encore finalisé la configuration de ses paiements. Choisissez un autre professeur ou réessayez plus tard.",
    });
    return;
  }

  const useStripe =
    paymentStrategy === "connect" || paymentStrategy === "platform_test";
  const courseStatus = useStripe ? "payment_pending" : "scheduled";

  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .insert({
      title: subject,
      description: "Réservation marketplace Gadz'Connect",
      campus_id: client.campus_id,
      provider_id: tutor.id,
      client_id: client.id,
      subject,
      scheduled_at: slot.starts_at,
      slot_id: slot.id,
      status: courseStatus,
      payer_name: payerName,
      beneficiary_name: beneficiaryName,
    })
    .select("id")
    .single();

  if (courseError || !course) {
    res.status(500).json({ error: courseError?.message ?? "Erreur réservation" });
    return;
  }

  if (useStripe && stripe) {
    try {
      const paymentIntentParams: Parameters<typeof stripe.paymentIntents.create>[0] =
        {
          amount: Math.round(fiscal.amountGross * 100),
          currency: "eur",
          metadata: {
            course_id: course.id,
            slot_id: slot.id,
            client_id: client.id,
          },
          automatic_payment_methods: { enabled: true },
        };

      if (
        paymentStrategy === "connect" &&
        tutor.stripe_connect_account_id
      ) {
        paymentIntentParams.application_fee_amount = Math.round(
          fiscal.commissionSasu * 100,
        );
        paymentIntentParams.transfer_data = {
          destination: tutor.stripe_connect_account_id,
        };
      }

      const paymentIntent = await stripe.paymentIntents.create(
        paymentIntentParams,
      );

      const revenue = buildTransactionRevenueFromBooking(fiscal);
      const { error: txError } = await supabaseAdmin
        .from("transactions")
        .insert(
          toTransactionInsertRow(revenue, {
            course_id: course.id,
            stripe_payment_intent_id: paymentIntent.id,
          }),
        );

      if (txError || !paymentIntent.client_secret) {
        await supabaseAdmin.from("courses").delete().eq("id", course.id);
        res.status(500).json({
          error: txError?.message ?? "Impossible de créer le paiement Stripe",
        });
        return;
      }

      res.status(201).json({
        data: {
          requiresPayment: true,
          clientSecret: paymentIntent.client_secret,
          courseId: course.id,
          amountGross: fiscal.amountGross,
          netPayout: fiscal.netPayout,
          subject,
          scheduledAt: slot.starts_at,
          endsAt: slot.ends_at,
        },
      });
      return;
    } catch (err) {
      await supabaseAdmin.from("courses").delete().eq("id", course.id);
      const message =
        err instanceof Error ? err.message : "Erreur Stripe";
      console.error("[tutors] payment intent:", message);
      res.status(502).json({ error: message });
      return;
    }
  }

  const revenue = buildTransactionRevenueFromBooking(fiscal);
  const { error: txError } = await supabaseAdmin
    .from("transactions")
    .insert(
      toTransactionInsertRow(revenue, {
        course_id: course.id,
        status_stripe: "succeeded",
        status_urssaf: "pending",
      }),
    );

  if (txError) {
    await supabaseAdmin.from("courses").delete().eq("id", course.id);
    res.status(500).json({ error: txError.message });
    return;
  }

  const slotResult = await finalizeBookingSlot(slot.id, client.id);
  if (!slotResult.ok) {
    await supabaseAdmin.from("courses").delete().eq("id", course.id);
    res.status(500).json({ error: "Créneau déjà réservé" });
    return;
  }

  await triggerPaymentInvoicesForCourse(course.id as string);

  res.status(201).json({
    data: {
      requiresPayment: false,
      courseId: course.id,
      amountGross: fiscal.amountGross,
      netPayout: fiscal.netPayout,
      subject,
      scheduledAt: slot.starts_at,
      endsAt: slot.ends_at,
    },
  });
});

/**
 * POST /api/tutors/bookings/:courseId/confirm-payment
 * Confirme la réservation après paiement Stripe côté client (complète le webhook).
 */
tutorsRouter.post(
  "/bookings/:courseId/confirm-payment",
  async (req: AuthenticatedRequest, res) => {
    if (!stripe) {
      res.status(503).json({ error: "Stripe non configuré" });
      return;
    }

    const courseId = String(req.params.courseId);
    const userId = req.user!.id;

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id, status, client_id")
      .eq("id", courseId)
      .eq("client_id", userId)
      .maybeSingle();

    if (!course) {
      res.status(404).json({ error: "Réservation introuvable" });
      return;
    }

    if (course.status === "scheduled") {
      res.json({ data: { courseId, status: "scheduled" } });
      return;
    }

    if (course.status !== "payment_pending") {
      res.status(400).json({ error: "Cette réservation ne peut pas être confirmée" });
      return;
    }

    const { data: transaction } = await supabaseAdmin
      .from("transactions")
      .select("stripe_payment_intent_id")
      .eq("course_id", courseId)
      .maybeSingle();

    const paymentIntentId = transaction?.stripe_payment_intent_id as
      | string
      | undefined;

    if (!paymentIntentId) {
      res.status(400).json({ error: "Paiement introuvable pour ce cours" });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const result = await confirmBookingAfterPayment(paymentIntent);

    if (!result.ok) {
      res.status(402).json({ error: result.error });
      return;
    }

    res.json({ data: result });
  },
);
