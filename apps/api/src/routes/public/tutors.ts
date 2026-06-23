import { Router } from "express";
import { z } from "zod";
import {
  computePublicCampusStats,
  filterPublicTutorRows,
} from "../../lib/tutor-public-list.js";
import {
  toPublicTutorDto,
  toPublicTutorSlotDto,
} from "../../lib/tutor-public-dto.js";
import {
  fetchCampusTutorById,
  fetchCampusTutors,
} from "../../lib/tutor-query.js";
import { supabaseAdmin } from "../../lib/supabase.js";

const campusIdSchema = z.string().uuid("Campus invalide");
const tutorIdSchema = z.string().uuid("Tuteur invalide");

const listQuerySchema = z.object({
  q: z.string().optional(),
  subject: z.string().optional(),
  bookable: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const publicTutorsRouter = Router();

async function assertCampusExists(campusId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("campus")
    .select("id")
    .eq("id", campusId)
    .maybeSingle();

  return !error && Boolean(data);
}

/**
 * GET /api/public/campus/:campusId/stats
 */
publicTutorsRouter.get("/campus/:campusId/stats", async (req, res) => {
  const parsed = campusIdSchema.safeParse(req.params.campusId);
  if (!parsed.success) {
    res.status(400).json({ error: "Campus invalide" });
    return;
  }

  const campusExists = await assertCampusExists(parsed.data);
  if (!campusExists) {
    res.status(404).json({ error: "Campus introuvable" });
    return;
  }

  const { data, error } = await fetchCampusTutors(parsed.data, null);
  if (error) {
    console.error("[public/tutors] stats:", error.message);
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data: computePublicCampusStats(data) });
});

/**
 * GET /api/public/campus/:campusId/tutors
 */
publicTutorsRouter.get("/campus/:campusId/tutors", async (req, res) => {
  const parsed = campusIdSchema.safeParse(req.params.campusId);
  if (!parsed.success) {
    res.status(400).json({ error: "Campus invalide" });
    return;
  }

  const queryParsed = listQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: "Paramètres de recherche invalides" });
    return;
  }

  const campusExists = await assertCampusExists(parsed.data);
  if (!campusExists) {
    res.status(404).json({ error: "Campus introuvable" });
    return;
  }

  const { data, error } = await fetchCampusTutors(parsed.data, null);
  if (error) {
    console.error("[public/tutors] list:", error.message);
    res.status(500).json({ error: error.message });
    return;
  }

  const filtered = filterPublicTutorRows(data, queryParsed.data);

  res.json({
    data: filtered.map((row) => toPublicTutorDto(row)),
  });
});

/**
 * GET /api/public/campus/:campusId/tutors/:tutorId
 */
publicTutorsRouter.get(
  "/campus/:campusId/tutors/:tutorId",
  async (req, res) => {
    const campusParsed = campusIdSchema.safeParse(req.params.campusId);
    const tutorParsed = tutorIdSchema.safeParse(req.params.tutorId);
    if (!campusParsed.success || !tutorParsed.success) {
      res.status(400).json({ error: "Paramètres invalides" });
      return;
    }

    const campusExists = await assertCampusExists(campusParsed.data);
    if (!campusExists) {
      res.status(404).json({ error: "Campus introuvable" });
      return;
    }

    const { data, error } = await fetchCampusTutorById(
      campusParsed.data,
      tutorParsed.data,
    );

    if (error) {
      console.error("[public/tutors] detail:", error.message);
      res.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: "Tuteur introuvable" });
      return;
    }

    res.json({ data: toPublicTutorDto(data, { fullBio: true }) });
  },
);

/**
 * GET /api/public/campus/:campusId/tutors/:tutorId/slots
 */
publicTutorsRouter.get(
  "/campus/:campusId/tutors/:tutorId/slots",
  async (req, res) => {
    const campusParsed = campusIdSchema.safeParse(req.params.campusId);
    const tutorParsed = tutorIdSchema.safeParse(req.params.tutorId);
    if (!campusParsed.success || !tutorParsed.success) {
      res.status(400).json({ error: "Paramètres invalides" });
      return;
    }

    const { data: tutor } = await fetchCampusTutorById(
      campusParsed.data,
      tutorParsed.data,
    );

    if (!tutor) {
      res.status(404).json({ error: "Tuteur introuvable" });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("tutor_slots")
      .select("id, starts_at, ends_at, booked")
      .eq("provider_id", tutorParsed.data)
      .eq("booked", false)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at");

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      data: (data ?? []).map((row) => toPublicTutorSlotDto(row)),
    });
  },
);
