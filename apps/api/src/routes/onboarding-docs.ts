import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { buildAcreFormPdf } from "../lib/pdf/acre-form.js";
import { buildInpiGuidePdf } from "../lib/pdf/inpi-guide.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const onboardingDocsRouter = Router();

onboardingDocsRouter.use(requireAuth);

const INPI_URL = "https://guichet-unique.inpi.fr/";

async function loadProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "first_name, last_name, micro_enterprise_activity, urssaf_periodicity, versement_liberatoire, status_acre",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * GET /api/onboarding/documents/inpi-url
 */
onboardingDocsRouter.get("/inpi-url", (_req, res) => {
  res.json({ data: { url: INPI_URL } });
});

/**
 * GET /api/onboarding/documents/guide
 * PDF guide Guichet Unique personnalisé.
 */
onboardingDocsRouter.get("/guide", async (req: AuthenticatedRequest, res) => {
  const profile = await loadProfile(req.user!.id);
  if (!profile?.micro_enterprise_activity || !profile.urssaf_periodicity) {
    res.status(400).json({
      error: "Complétez d'abord le questionnaire micro-entreprise",
    });
    return;
  }

  const pdf = await buildInpiGuidePdf({
    firstName: profile.first_name,
    lastName: profile.last_name,
    activity: profile.micro_enterprise_activity,
    urssafPeriodicity: profile.urssaf_periodicity,
    versementLiberatoire: profile.versement_liberatoire,
    statusAcre: profile.status_acre,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="gadzconnect-guide-inpi.pdf"',
  );
  res.send(pdf);
});

/**
 * GET /api/onboarding/documents/acre
 * PDF récapitulatif ACRE pré-rempli.
 */
onboardingDocsRouter.get("/acre", async (req: AuthenticatedRequest, res) => {
  const profile = await loadProfile(req.user!.id);
  if (!profile?.micro_enterprise_activity) {
    res.status(400).json({
      error: "Complétez d'abord le questionnaire micro-entreprise",
    });
    return;
  }

  const pdf = await buildAcreFormPdf({
    firstName: profile.first_name,
    lastName: profile.last_name,
    activity: profile.micro_enterprise_activity,
    email: req.user!.email ?? "",
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="gadzconnect-acre-recap.pdf"',
  );
  res.send(pdf);
});

const previewSchema = z.object({
  activity: z.enum(["enseignement", "conseil", "prestation_intellectuelle"]),
  urssafPeriodicity: z.enum(["monthly", "quarterly"]),
  versementLiberatoire: z.boolean(),
  statusAcre: z.boolean().optional(),
});

/**
 * POST /api/onboarding/documents/guide/preview
 * Aperçu PDF avant enregistrement du questionnaire.
 */
onboardingDocsRouter.post(
  "/guide/preview",
  async (req: AuthenticatedRequest, res) => {
    const parsed = previewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed" });
      return;
    }

    const profile = await loadProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const pdf = await buildInpiGuidePdf({
      firstName: profile.first_name,
      lastName: profile.last_name,
      activity: parsed.data.activity,
      urssafPeriodicity: parsed.data.urssafPeriodicity,
      versementLiberatoire: parsed.data.versementLiberatoire,
      statusAcre: parsed.data.statusAcre ?? profile.status_acre,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="gadzconnect-guide-inpi-apercu.pdf"',
    );
    res.send(pdf);
  },
);
