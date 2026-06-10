import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
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

  const { data: profile, error } = await supabaseAdmin
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
      status_acre,
      versement_liberatoire,
      micro_enterprise_activity,
      urssaf_periodicity,
      stripe_connect_account_id,
      stripe_connect_onboarding_complete,
      profile_setup_complete,
      bio,
      hourly_rate,
      subjects,
      created_at,
      updated_at,
      campus:campus_id ( name )
    `,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    console.error("[profile] me:", error?.message);
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  res.json({ data: profile });
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

const setupSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  campusId: z.string().uuid(),
  role: z.enum(["student_provider", "teacher"]),
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
        : {}),
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
