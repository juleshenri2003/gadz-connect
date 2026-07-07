import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  notifyReplacementAccepted,
  notifyReplacementCandidate,
} from "../lib/course-session-notify.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const replacementRouter = Router();

replacementRouter.use(requireAuth);

const proposeSchema = z.object({
  message: z.string().max(500).optional(),
});

async function getProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, role, campus_id, first_name, last_name, account_status")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

/**
 * POST /api/replacement/notifications/:notificationId/propose
 */
replacementRouter.post(
  "/notifications/:notificationId/propose",
  async (req: AuthenticatedRequest, res) => {
    const parsed = proposeSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed" });
      return;
    }

    const profile = await getProfile(req.user!.id);
    if (!profile || profile.role !== "teacher") {
      res.status(403).json({ error: "Réservé aux professeurs" });
      return;
    }

    const { data: notification } = await supabaseAdmin
      .from("campus_notifications")
      .select(
        "id, course_id, campus_id, replacement_status, kind, original_provider_id",
      )
      .eq("id", req.params.notificationId)
      .maybeSingle();

    if (
      !notification ||
      notification.kind !== "replacement_offer" ||
      notification.replacement_status !== "open"
    ) {
      res.status(404).json({ error: "Offre de remplacement introuvable" });
      return;
    }

    if (notification.campus_id !== profile.campus_id) {
      res.status(403).json({ error: "Hors de votre campus" });
      return;
    }

    if (notification.original_provider_id === profile.id) {
      res.status(400).json({ error: "Vous ne pouvez pas remplacer votre propre cours" });
      return;
    }

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select(
        "id, status, campus_id, scheduled_at, subject, title, client_id, provider_id, replacement_expires_at",
      )
      .eq("id", notification.course_id)
      .maybeSingle();

    if (!course || course.status !== "awaiting_replacement") {
      res.status(400).json({ error: "Ce cours n'attend plus de remplaçant" });
      return;
    }

    const { data: existing } = await supabaseAdmin
      .from("replacement_proposals")
      .select("id, status")
      .eq("notification_id", notification.id)
      .eq("proposed_provider_id", profile.id)
      .maybeSingle();

    if (existing?.status === "pending") {
      res.status(409).json({ error: "Vous avez déjà proposé votre candidature" });
      return;
    }

    const { data: proposal, error } = await supabaseAdmin
      .from("replacement_proposals")
      .insert({
        notification_id: notification.id,
        original_course_id: course.id,
        proposed_provider_id: profile.id,
        message: parsed.data.message?.trim() || null,
        status: "pending",
      })
      .select("id, created_at")
      .single();

    if (error || !proposal) {
      res.status(500).json({ error: error?.message ?? "Erreur serveur" });
      return;
    }

    const providerName =
      `${profile.first_name} ${profile.last_name}`.trim() || "Professeur";

    const { count: pendingCount } = await supabaseAdmin
      .from("replacement_proposals")
      .select("id", { count: "exact", head: true })
      .eq("original_course_id", course.id)
      .eq("status", "pending");

    if ((pendingCount ?? 0) === 1) {
      await notifyReplacementCandidate(
        {
          id: course.id as string,
          campus_id: course.campus_id as string,
          scheduled_at: course.scheduled_at as string | null,
          subject: course.subject as string | null,
          title: course.title as string,
          client_id: course.client_id as string | null,
          provider_id: course.provider_id as string | null,
        },
        providerName,
        proposal.id as string,
      );
    }

    res.status(201).json({ data: proposal });
  },
);

/**
 * POST /api/replacement/proposals/:proposalId/accept
 */
replacementRouter.post(
  "/proposals/:proposalId/accept",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const { data: proposal } = await supabaseAdmin
      .from("replacement_proposals")
      .select(
        "id, status, notification_id, original_course_id, proposed_provider_id",
      )
      .eq("id", req.params.proposalId)
      .maybeSingle();

    if (!proposal || proposal.status !== "pending") {
      res.status(404).json({ error: "Proposition introuvable" });
      return;
    }

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select(
        "id, status, campus_id, scheduled_at, subject, title, client_id, provider_id",
      )
      .eq("id", proposal.original_course_id)
      .maybeSingle();

    if (!course || course.status !== "awaiting_replacement") {
      res.status(400).json({ error: "Ce cours n'attend plus de remplaçant" });
      return;
    }

    const isClient = course.client_id === profile.id;
    const isAdmin =
      profile.role === "admin_general" ||
      profile.role === "admin_campus";

    if (!isClient && !isAdmin) {
      res.status(403).json({ error: "Seul l'élève peut valider le remplaçant" });
      return;
    }

    const oldProviderId = course.provider_id as string;
    const newProviderId = proposal.proposed_provider_id as string;

    const { data: newProvider } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", newProviderId)
      .maybeSingle();

    const newProviderName = newProvider
      ? `${newProvider.first_name} ${newProvider.last_name}`.trim()
      : "Professeur";

    await supabaseAdmin
      .from("courses")
      .update({
        provider_id: newProviderId,
        status: "scheduled",
        student_confirmed_at: null,
        provider_confirmed_at: null,
        confirmation_reminder_sent_at: null,
        confirmation_escalated_at: null,
        replacement_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id);

    await supabaseAdmin
      .from("replacement_proposals")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    await supabaseAdmin
      .from("replacement_proposals")
      .update({
        status: "expired",
        responded_at: new Date().toISOString(),
      })
      .eq("original_course_id", course.id)
      .eq("status", "pending")
      .neq("id", proposal.id);

    await supabaseAdmin
      .from("campus_notifications")
      .update({ replacement_status: "filled" })
      .eq("course_id", course.id)
      .eq("replacement_status", "open");

    await notifyReplacementAccepted(
      {
        id: course.id as string,
        campus_id: course.campus_id as string,
        scheduled_at: course.scheduled_at as string | null,
        subject: course.subject as string | null,
        title: course.title as string,
        client_id: course.client_id as string | null,
        provider_id: newProviderId,
      },
      newProviderName,
      oldProviderId,
      newProviderId,
    );

    res.json({ data: { courseId: course.id, providerId: newProviderId } });
  },
);

/**
 * POST /api/replacement/proposals/:proposalId/decline
 */
replacementRouter.post(
  "/proposals/:proposalId/decline",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const { data: proposal } = await supabaseAdmin
      .from("replacement_proposals")
      .select("id, status, original_course_id")
      .eq("id", req.params.proposalId)
      .maybeSingle();

    if (!proposal || proposal.status !== "pending") {
      res.status(404).json({ error: "Proposition introuvable" });
      return;
    }

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id, client_id, status")
      .eq("id", proposal.original_course_id)
      .maybeSingle();

    if (!course || course.status !== "awaiting_replacement") {
      res.status(400).json({ error: "Ce cours n'attend plus de remplaçant" });
      return;
    }

    if (course.client_id !== profile.id) {
      res.status(403).json({ error: "Seul l'élève peut refuser un remplaçant" });
      return;
    }

    await supabaseAdmin
      .from("replacement_proposals")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    res.json({ data: { declined: true } });
  },
);
