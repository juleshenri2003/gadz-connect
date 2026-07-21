import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import {
  enrollUrssafClient,
  getUrssafClientByProfileId,
  isUrssafApiOperational,
} from "../lib/urssaf/index.js";

export const urssafRouter = Router();

urssafRouter.use(requireAuth);

const enrollSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthPlace: z.string().trim().min(1).max(120),
  fiscalAddress: z.string().trim().min(5).max(300),
  iban: z
    .string()
    .trim()
    .min(15)
    .max(34)
    .regex(/^[A-Za-z]{2}[0-9A-Za-z]+$/),
  nir: z
    .string()
    .trim()
    .regex(/^[12][0-9]{12}$/)
    .optional(),
});

/**
 * GET /api/urssaf/status
 * Statut d'inscription URSSAF du payeur connecté.
 */
urssafRouter.get("/status", async (req: AuthenticatedRequest, res) => {
  const profileId = req.user!.id;
  const client = await getUrssafClientByProfileId(profileId);

  res.json({
    data: {
      operational: isUrssafApiOperational(),
      enrolled: Boolean(client),
      status: client?.status ?? null,
      activatedAt: client?.activated_at ?? null,
      urssafClientId: client?.urssaf_client_id ?? null,
    },
  });
});

/**
 * POST /api/urssaf/enroll
 * Inscription du payeur auprès de l'URSSAF (avance immédiate).
 */
urssafRouter.post("/enroll", async (req: AuthenticatedRequest, res) => {
  const parsed = enrollSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }

  const profileId = req.user!.id;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  if (profile.role !== "student_provider") {
    res.status(403).json({
      error: "Seuls les élèves payeurs peuvent s'inscrire à l'avance immédiate",
    });
    return;
  }

  try {
    const client = await enrollUrssafClient({
      profileId,
      firstName: profile.first_name as string,
      lastName: profile.last_name as string,
      birthDate: parsed.data.birthDate,
      birthPlace: parsed.data.birthPlace,
      fiscalAddress: parsed.data.fiscalAddress,
      iban: parsed.data.iban,
      nir: parsed.data.nir,
    });

    res.status(201).json({
      data: {
        status: client.status,
        activatedAt: client.activated_at,
        message:
          client.status === "actif"
            ? "Votre compte URSSAF est actif — vous ne paierez que 50 % de vos cours à domicile."
            : "Inscription envoyée. Validez le rattachement dans votre espace URSSAF (mandat SEPA).",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inscription";
    res.status(502).json({ error: message });
  }
});
