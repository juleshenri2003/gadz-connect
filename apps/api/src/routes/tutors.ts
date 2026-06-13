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
import { calculateFiscalBreakdown } from "../lib/fiscal.js";
import {
  fetchCampusTutorById,
  fetchCampusTutors,
  fetchTutorCvPdfPath,
} from "../lib/tutor-query.js";
import {
  computeMarketplaceStatus,
  isCvComplete,
  isTeacherVisibleInMarketplace,
} from "../lib/tutor-visibility.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { aggregateTeacherFinancial } from "../lib/tutor-financial.js";

function mapTutorPublic<T extends { cv_pdf_path?: string | null }>(
  row: T,
): Omit<T, "cv_pdf_path"> & { has_cv_pdf: boolean } {
  const { cv_pdf_path, ...rest } = row;
  return {
    ...rest,
    has_cv_pdf: Boolean(cv_pdf_path),
  };
}

export const tutorsRouter = Router();

tutorsRouter.use(requireAuth);

const tutorProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  cv: z.string().max(5000).optional(),
  hourlyRate: z.number().positive().max(500).optional(),
  subjects: z.array(z.string().min(1).max(80)).max(20).optional(),
});

const slotSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

const bookingSchema = z.object({
  slotId: z.string().uuid(),
  subject: z.string().min(1).max(120).optional(),
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

/**
 * GET /api/tutors/me
 */
tutorsRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, bio, cv, cv_pdf_path, hourly_rate, subjects, role, account_status, profile_setup_complete, stripe_connect_onboarding_complete",
    )
    .eq("id", userId)
    .maybeSingle();

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

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", req.user!.id)
    .select("id, bio, cv, hourly_rate, subjects")
    .maybeSingle();

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

  const { data: tutor } = await supabaseAdmin
    .from("profiles")
    .select("id, campus_id, role, account_status, profile_setup_complete")
    .eq("id", req.params.id)
    .eq("campus_id", caller.campus_id)
    .maybeSingle();

  if (!tutor || !isTeacherVisibleInMarketplace(tutor)) {
    res.status(404).json({ error: "Tuteur introuvable" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("tutor_slots")
    .select("id, starts_at, ends_at, booked")
    .eq("provider_id", req.params.id)
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
 */
tutorsRouter.post("/bookings", async (req: AuthenticatedRequest, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const client = await getCallerProfile(req.user!.id);
  if (!client) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  const { data: slot, error: slotError } = await supabaseAdmin
    .from("tutor_slots")
    .select("id, provider_id, starts_at, ends_at, booked")
    .eq("id", parsed.data.slotId)
    .maybeSingle();

  if (slotError || !slot || slot.booked) {
    res.status(404).json({ error: "Créneau indisponible" });
    return;
  }

  if (slot.provider_id === client.id) {
    res.status(400).json({ error: "Vous ne pouvez pas réserver votre propre créneau" });
    return;
  }

  const { data: tutor } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, campus_id, hourly_rate, status_acre, versement_liberatoire, first_name, last_name, role, account_status, profile_setup_complete",
    )
    .eq("id", slot.provider_id)
    .eq("campus_id", client.campus_id)
    .maybeSingle();

  if (!tutor || !isTeacherVisibleInMarketplace(tutor)) {
    res.status(400).json({ error: "Ce tuteur n'est pas disponible" });
    return;
  }

  if (!tutor.hourly_rate) {
    res.status(400).json({ error: "Ce tuteur n'a pas défini de tarif horaire" });
    return;
  }

  const durationHours =
    (new Date(slot.ends_at).getTime() - new Date(slot.starts_at).getTime()) /
    (1000 * 60 * 60);
  const amountGross = Math.round(tutor.hourly_rate * durationHours * 100) / 100;

  const fiscal = calculateFiscalBreakdown({
    amountGross,
    statusAcre: tutor.status_acre,
    versementLiberatoire: tutor.versement_liberatoire,
  });

  const subject =
    parsed.data.subject ??
    `Tutorat avec ${tutor.first_name} ${tutor.last_name}`.trim();

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
      status: "scheduled",
    })
    .select("id")
    .single();

  if (courseError || !course) {
    res.status(500).json({ error: courseError?.message ?? "Erreur réservation" });
    return;
  }

  const { error: txError } = await supabaseAdmin.from("transactions").insert({
    course_id: course.id,
    amount_gross: fiscal.amountGross,
    commission_sasu: fiscal.commissionSasu,
    taxes_urssaf: fiscal.taxesUrssaf + fiscal.taxesLiberatoire,
    net_payout: fiscal.netPayout,
    status_stripe: "pending",
    status_urssaf: "pending",
  });

  if (txError) {
    await supabaseAdmin.from("courses").delete().eq("id", course.id);
    res.status(500).json({ error: txError.message });
    return;
  }

  const { error: bookError } = await supabaseAdmin
    .from("tutor_slots")
    .update({ booked: true, booked_by: client.id })
    .eq("id", slot.id)
    .eq("booked", false);

  if (bookError) {
    await supabaseAdmin.from("courses").delete().eq("id", course.id);
    res.status(500).json({ error: "Créneau déjà réservé" });
    return;
  }

  res.status(201).json({
    data: {
      courseId: course.id,
      amountGross: fiscal.amountGross,
      netPayout: fiscal.netPayout,
      subject,
      scheduledAt: slot.starts_at,
      endsAt: slot.ends_at,
    },
  });
});
