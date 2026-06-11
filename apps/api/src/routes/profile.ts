import { Router } from "express";
import express from "express";
import { z } from "zod";
import {
  createCvPdfSignedUrl,
  removeCvPdf,
  uploadCvPdf,
} from "../lib/cv-pdf.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getInpiDeclarationSentAt,
  setInpiDeclarationSent,
} from "../lib/inpi-milestone.js";
import { fetchProfileByUserId } from "../lib/profile-query.js";
import { ensureProfileForUser } from "../lib/profiles.js";
import { isSchoolEmail, schoolEmailError } from "../lib/school-email.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

const onboardingSchema = z
  .object({
    activity: z.enum(["enseignement", "conseil", "prestation_intellectuelle"]),
    urssafPeriodicity: z.enum(["monthly", "quarterly"]),
    versementLiberatoire: z.boolean(),
    registrationStatus: z.enum(["already_registered", "awaiting_registration"]),
    siret: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.registrationStatus === "already_registered") {
      const normalized = data.siret?.replace(/\s/g, "") ?? "";
      if (!/^\d{14}$/.test(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SIRET invalide — 14 chiffres requis",
          path: ["siret"],
        });
      }
    }
  });

/**
 * GET /api/profile/me
 * Profil complet de l'utilisateur connecté (service_role).
 */
profileRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  const ensured = await ensureProfileForUser(user);
  if (!ensured.ok) {
    res.status(500).json({ error: ensured.message });
    return;
  }

  const { data: profile, error } = await fetchProfileByUserId(user.id);

  if (error || !profile) {
    console.error("[profile] me:", error?.message);
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  const inpi_declaration_sent_at = await getInpiDeclarationSentAt(
    user.id,
    profile.inpi_declaration_sent_at as string | null | undefined,
  );

  res.json({
    data: {
      ...profile,
      inpi_declaration_sent_at,
    },
  });
});

/**
 * PATCH /api/profile/onboarding
 * Enregistre l'onboarding fiscal.
 * - Déjà entrepreneur + SIRET → statut `active` immédiat
 * - En attente d'immatriculation → statut `pending_siret`
 */
profileRouter.patch("/onboarding", async (req: AuthenticatedRequest, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten(),
    });
    return;
  }

  const user = req.user!;
  const {
    activity,
    urssafPeriodicity,
    versementLiberatoire,
    registrationStatus,
    siret,
  } = parsed.data;

  const { data: roleCheck } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleCheck?.role === "student_provider") {
    res.status(403).json({
      error:
        "Les élèves n'ont pas besoin de micro-entreprise ni de numéro SIRET.",
    });
    return;
  }

  const ensured = await ensureProfileForUser(user);
  if (!ensured.ok) {
    res.status(500).json({ error: ensured.message });
    return;
  }

  const alreadyRegistered = registrationStatus === "already_registered";
  const normalizedSiret = siret?.replace(/\s/g, "");

  const { data: updated, error } = await supabaseAdmin
    .from("profiles")
    .update({
      micro_enterprise_activity: activity,
      urssaf_periodicity: urssafPeriodicity,
      versement_liberatoire: versementLiberatoire,
      siret: alreadyRegistered ? normalizedSiret : null,
      account_status: alreadyRegistered ? "active" : "pending_siret",
    })
    .eq("id", user.id)
    .select(
      "id, account_status, siret, micro_enterprise_activity, urssaf_periodicity",
    )
    .maybeSingle();

  if (error) {
    console.error("[profile] onboarding:", error.message);
    res.status(500).json({ error: error.message });
    return;
  }

  if (!updated) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  res.json({ data: updated });
});

const siretSubmitSchema = z.object({
  siret: z
    .string()
    .transform((s) => s.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{14}$/, "SIRET invalide — 14 chiffres requis")),
});

/**
 * PATCH /api/profile/siret
 * Déclaration du SIRET reçu de l'INSEE (prof en attente, validation RH ensuite).
 */
profileRouter.patch("/siret", async (req: AuthenticatedRequest, res) => {
  const parsed = siretSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten(),
    });
    return;
  }

  const user = req.user!;

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, account_status, siret")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError || !profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  if (profile.role === "student_provider") {
    res.status(403).json({
      error: "Les élèves n'ont pas besoin de déclarer un SIRET.",
    });
    return;
  }

  if (profile.role !== "teacher") {
    res.status(403).json({ error: "Réservé aux enseignants / intervenants." });
    return;
  }

  if (profile.account_status !== "pending_siret") {
    res.status(400).json({
      error: "La déclaration SIRET n'est possible qu'en attente de validation.",
    });
    return;
  }

  const { data: updated, error } = await supabaseAdmin
    .from("profiles")
    .update({ siret: parsed.data.siret })
    .eq("id", user.id)
    .select("id, account_status, siret, micro_enterprise_activity")
    .maybeSingle();

  if (error || !updated) {
    res.status(500).json({ error: error?.message ?? "Mise à jour impossible" });
    return;
  }

  res.json({ data: updated });
});

const setupSchema = z
  .object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    campusId: z.string().uuid(),
    role: z.enum(["student_provider", "teacher"]),
    cv: z.string().max(5000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "teacher") {
      const trimmed = data.cv?.trim() ?? "";
      if (trimmed.length < 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "CV requis pour les professeurs (minimum 50 caractères — parcours, expériences, compétences)",
          path: ["cv"],
        });
      }
    }
  });

/**
 * PATCH /api/profile/setup
 * Complète l'inscription : campus, rôle, identité.
 */
profileRouter.patch("/setup", async (req: AuthenticatedRequest, res) => {
  const parsed = setupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten(),
    });
    return;
  }

  const user = req.user!;
  const email = user.email ?? "";

  if (process.env.NODE_ENV === "production" && !isSchoolEmail(email)) {
    res.status(403).json({ error: schoolEmailError() });
    return;
  }

  const { data: campus } = await supabaseAdmin
    .from("campus")
    .select("id")
    .eq("id", parsed.data.campusId)
    .maybeSingle();

  if (!campus) {
    res.status(400).json({ error: "Campus invalide" });
    return;
  }

  const ensured = await ensureProfileForUser(user);
  if (!ensured.ok) {
    res.status(500).json({ error: ensured.message });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("profile_setup_complete")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.profile_setup_complete) {
    res.status(409).json({ error: "Profil déjà configuré" });
    return;
  }

  const isStudent = parsed.data.role === "student_provider";

  const { data: updated, error } = await supabaseAdmin
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      campus_id: parsed.data.campusId,
      role: parsed.data.role,
      profile_setup_complete: true,
      ...(isStudent
        ? {
            account_status: "active" as const,
            siret: null,
            micro_enterprise_activity: null,
            urssaf_periodicity: null,
          }
        : { cv: parsed.data.cv?.trim() ?? null }),
    })
    .eq("id", user.id)
    .select(
      "id, first_name, last_name, role, campus_id, profile_setup_complete, campus:campus_id(name)",
    )
    .maybeSingle();

  if (error || !updated) {
    res.status(500).json({ error: error?.message ?? "Mise à jour impossible" });
    return;
  }

  res.json({ data: updated });
});

const milestoneSchema = z.object({
  milestone: z.enum(["inpi_sent"]),
});

/**
 * PATCH /api/profile/onboarding-milestone
 * Marque une étape externe du parcours onboarding (ex. demande INPI envoyée).
 */
profileRouter.patch(
  "/onboarding-milestone",
  async (req: AuthenticatedRequest, res) => {
    const parsed = milestoneSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
      return;
    }

    const user = req.user!;

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, micro_enterprise_activity")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError || !profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    if (profile.role !== "teacher") {
      res.status(403).json({
        error: "Réservé aux enseignants / intervenants.",
      });
      return;
    }

    if (!profile.micro_enterprise_activity) {
      res.status(400).json({
        error: "Complétez d'abord le questionnaire fiscal.",
      });
      return;
    }

    try {
      const updated = await setInpiDeclarationSent(user.id);
      res.json({ data: { id: user.id, ...updated } });
    } catch (err) {
      res.status(500).json({
        error: (err as Error).message,
      });
    }
  },
);

const cvPdfUploadSchema = z.object({
  pdfBase64: z.string().min(1, "Fichier PDF requis"),
});

function decodePdfBase64(encoded: string): Buffer {
  const cleaned = encoded.replace(/^data:application\/pdf;base64,/, "");
  const buffer = Buffer.from(cleaned, "base64");
  if (buffer.length < 5 || buffer.subarray(0, 4).toString() !== "%PDF") {
    throw new Error("Fichier invalide — PDF requis");
  }
  return buffer;
}

async function requireTeacherProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  if (data.role !== "teacher") return null;
  return data;
}

/**
 * POST /api/profile/cv-pdf
 * Dépose un CV au format PDF (max 5 Mo).
 */
profileRouter.post(
  "/cv-pdf",
  express.json({ limit: "8mb" }),
  async (req: AuthenticatedRequest, res) => {
    const parsed = cvPdfUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "PDF requis" });
      return;
    }

    const user = req.user!;
    const teacher = await requireTeacherProfile(user.id);
    if (!teacher) {
      res.status(403).json({ error: "Réservé aux enseignants / intervenants." });
      return;
    }

    try {
      const buffer = decodePdfBase64(parsed.data.pdfBase64);
      const { path } = await uploadCvPdf(user.id, buffer);

      const { data: updated, error } = await supabaseAdmin
        .from("profiles")
        .update({ cv_pdf_path: path })
        .eq("id", user.id)
        .select("id, cv_pdf_path")
        .maybeSingle();

      if (error || !updated) {
        res.status(500).json({ error: error?.message ?? "Mise à jour impossible" });
        return;
      }

      res.json({ data: updated });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

/**
 * GET /api/profile/cv-pdf/url
 * Lien signé pour consulter son propre CV PDF.
 */
profileRouter.get("/cv-pdf/url", async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("cv_pdf_path")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.cv_pdf_path) {
    res.status(404).json({ error: "Aucun CV PDF déposé" });
    return;
  }

  try {
    const url = await createCvPdfSignedUrl(profile.cv_pdf_path as string);
    res.json({ data: { url } });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * DELETE /api/profile/cv-pdf
 * Supprime le CV PDF déposé.
 */
profileRouter.delete("/cv-pdf", async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const teacher = await requireTeacherProfile(user.id);
  if (!teacher) {
    res.status(403).json({ error: "Réservé aux enseignants / intervenants." });
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("cv_pdf_path")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.cv_pdf_path) {
    res.status(404).json({ error: "Aucun CV PDF à supprimer" });
    return;
  }

  try {
    await removeCvPdf(profile.cv_pdf_path as string);
    await supabaseAdmin
      .from("profiles")
      .update({ cv_pdf_path: null })
      .eq("id", user.id);
    res.json({ data: { removed: true } });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
