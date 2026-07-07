import { Router } from "express";
import express from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { markPastCoursesCompleted } from "../lib/course-completion.js";
import {
  notifyCourseExchangeMessage,
  notifyCourseFollowUpPublished,
} from "../lib/course-follow-up-notify.js";
import {
  createCourseMaterialSignedUrl,
  decodePdfBase64,
  courseMaterialStoragePath,
  uploadCourseMaterialPdf,
} from "../lib/course-materials.js";
import {
  fetchCourseEvaluationDetail,
  fetchCourseEvaluationsForUser,
  userCanAccessCourse,
} from "../lib/evaluations-query.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const evaluationsRouter = Router();

evaluationsRouter.use(requireAuth);

async function getProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

const clarificationSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().max(10000).optional(),
    pdfBase64: z.string().optional(),
  })
  .refine((data) => Boolean(data.content?.trim()) || Boolean(data.pdfBase64), {
    message: "Texte ou PDF requis",
  });

const pdfOnlySchema = z.object({
  pdfBase64: z.string().min(1),
});

/**
 * GET /api/evaluations/me
 */
evaluationsRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const profile = await getProfile(req.user!.id);
  if (!profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  if (profile.role !== "student_provider" && profile.role !== "teacher") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  try {
    const data = await fetchCourseEvaluationsForUser(
      profile.id as string,
      profile.role as string,
    );
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/evaluations/courses/:courseId
 */
evaluationsRouter.get(
  "/courses/:courseId",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const detail = await fetchCourseEvaluationDetail(
      req.params.courseId as string,
      profile.id as string,
      profile.role as string,
    );

    if (!detail) {
      res.status(404).json({ error: "Cours introuvable ou accès refusé" });
      return;
    }

    res.json({ data: detail });
  },
);

/**
 * POST /api/evaluations/courses/:courseId/messages
 */
evaluationsRouter.post(
  "/courses/:courseId/messages",
  async (req: AuthenticatedRequest, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Message invalide" });
      return;
    }

    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const access = await userCanAccessCourse(
      req.params.courseId as string,
      profile.id as string,
      profile.role as string,
    );
    if (!access || access.course.status !== "completed") {
      res.status(404).json({ error: "Cours introuvable ou non terminé" });
      return;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("course_exchange_messages")
      .insert({
        course_id: access.course.id,
        author_id: profile.id,
        body: parsed.data.body,
      })
      .select("id, author_id, body, created_at")
      .single();

    if (error || !inserted) {
      res.status(500).json({ error: error?.message ?? "Erreur serveur" });
      return;
    }

    const authorName =
      `${profile.first_name} ${profile.last_name}`.trim() || "Utilisateur";
    const recipientId = access.isStudent
      ? access.course.provider_id
      : access.course.client_id;

    if (recipientId) {
      await notifyCourseExchangeMessage(
        access.course,
        profile.id as string,
        authorName,
        recipientId as string,
        parsed.data.body,
      );
    }

    res.status(201).json({
      data: {
        id: inserted.id,
        authorId: inserted.author_id,
        authorName,
        body: inserted.body,
        createdAt: inserted.created_at,
        isMine: true,
      },
    });
  },
);

/**
 * POST /api/evaluations/courses/:courseId/clarifications
 * Fiche complémentaire déposée par le professeur (texte et/ou PDF).
 */
evaluationsRouter.post(
  "/courses/:courseId/clarifications",
  express.json({ limit: "8mb" }),
  async (req: AuthenticatedRequest, res) => {
    const parsed = clarificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation échouée" });
      return;
    }

    const profile = await getProfile(req.user!.id);
    if (!profile || profile.role !== "teacher") {
      res.status(403).json({ error: "Réservé aux professeurs" });
      return;
    }

    await markPastCoursesCompleted();

    const access = await userCanAccessCourse(
      req.params.courseId as string,
      profile.id as string,
      profile.role as string,
    );
    if (!access || !access.isTeacher || !access.course.client_id) {
      res.status(404).json({ error: "Cours introuvable" });
      return;
    }

    const subject =
      (access.course.subject as string) ||
      (access.course.title as string) ||
      "Cours";

    const { data: folderRow } = await supabaseAdmin
      .from("student_subject_folders")
      .select("id")
      .eq("student_id", access.course.client_id)
      .eq("subject", subject)
      .maybeSingle();

    let folderId = folderRow?.id as string | undefined;
    if (!folderId) {
      const { data: createdFolder, error: folderError } = await supabaseAdmin
        .from("student_subject_folders")
        .insert({
          student_id: access.course.client_id,
          subject,
        })
        .select("id")
        .single();
      if (folderError || !createdFolder) {
        res.status(500).json({ error: "Impossible de créer le dossier matière" });
        return;
      }
      folderId = createdFolder.id as string;
    }

    const clarificationId = crypto.randomUUID();
    let pdfPath: string | null = null;

    if (parsed.data.pdfBase64) {
      try {
        const buffer = decodePdfBase64(parsed.data.pdfBase64);
        const storagePath = courseMaterialStoragePath(
          access.course.id as string,
          "clarification",
          clarificationId,
        );
        const uploaded = await uploadCourseMaterialPdf(storagePath, buffer);
        pdfPath = uploaded.path;
      } catch (err) {
        res.status(400).json({ error: (err as Error).message });
        return;
      }
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("course_clarifications")
      .insert({
        id: clarificationId,
        course_id: access.course.id,
        folder_id: folderId,
        provider_id: profile.id,
        student_id: access.course.client_id,
        title: parsed.data.title,
        content: parsed.data.content?.trim() || null,
        pdf_path: pdfPath,
      })
      .select("id, title, content, pdf_path, created_at")
      .single();

    if (error || !inserted) {
      res.status(500).json({ error: error?.message ?? "Erreur serveur" });
      return;
    }

    const { data: client } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", access.course.client_id)
      .maybeSingle();
    const studentName = client
      ? `${client.first_name} ${client.last_name}`.trim()
      : "Élève";
    const providerName =
      `${profile.first_name} ${profile.last_name}`.trim() || "Professeur";

    await notifyCourseFollowUpPublished({
      course: access.course,
      declaredBy: profile.id as string,
      providerName,
      studentName,
      subject,
      materialLabel: parsed.data.title,
    });

    res.status(201).json({
      data: {
        id: inserted.id,
        title: inserted.title,
        content: inserted.content,
        hasPdf: Boolean(inserted.pdf_path),
        createdAt: inserted.created_at,
      },
    });
  },
);

/**
 * POST /api/evaluations/courses/:courseId/summary/pdf
 * PDF attaché au compte-rendu principal du cours.
 */
evaluationsRouter.post(
  "/courses/:courseId/summary/pdf",
  express.json({ limit: "8mb" }),
  async (req: AuthenticatedRequest, res) => {
    const parsed = pdfOnlySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "PDF requis" });
      return;
    }

    const profile = await getProfile(req.user!.id);
    if (!profile || profile.role !== "teacher") {
      res.status(403).json({ error: "Réservé aux professeurs" });
      return;
    }

    const access = await userCanAccessCourse(
      req.params.courseId as string,
      profile.id as string,
      profile.role as string,
    );
    if (!access || !access.isTeacher) {
      res.status(404).json({ error: "Cours introuvable" });
      return;
    }

    const { data: summary } = await supabaseAdmin
      .from("course_summaries")
      .select("id, title")
      .eq("course_id", access.course.id)
      .maybeSingle();

    if (!summary?.id) {
      res.status(400).json({
        error: "Déposez d'abord un compte-rendu texte avant le PDF",
      });
      return;
    }

    try {
      const buffer = decodePdfBase64(parsed.data.pdfBase64);
      const storagePath = courseMaterialStoragePath(
        access.course.id as string,
        "summary",
        summary.id as string,
      );
      const uploaded = await uploadCourseMaterialPdf(storagePath, buffer);

      const { error: updateError } = await supabaseAdmin
        .from("course_summaries")
        .update({ pdf_path: uploaded.path })
        .eq("id", summary.id);

      if (updateError) {
        res.status(500).json({ error: updateError.message });
        return;
      }

      res.json({ data: { hasPdf: true } });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

/**
 * GET /api/evaluations/summaries/:summaryId/pdf-url
 */
evaluationsRouter.get(
  "/summaries/:summaryId/pdf-url",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const { data: summary } = await supabaseAdmin
      .from("course_summaries")
      .select("id, pdf_path, student_id, provider_id, course_id")
      .eq("id", req.params.summaryId)
      .maybeSingle();

    if (!summary?.pdf_path) {
      res.status(404).json({ error: "PDF introuvable" });
      return;
    }

    const allowed =
      summary.student_id === profile.id ||
      summary.provider_id === profile.id ||
      profile.role === "admin_general" ||
      profile.role === "admin_campus";

    if (!allowed) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    try {
      const url = await createCourseMaterialSignedUrl(summary.pdf_path as string);
      res.json({ data: { url } });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

/**
 * GET /api/evaluations/clarifications/:id/pdf-url
 */
evaluationsRouter.get(
  "/clarifications/:id/pdf-url",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const { data: row } = await supabaseAdmin
      .from("course_clarifications")
      .select("id, pdf_path, student_id, provider_id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (!row?.pdf_path) {
      res.status(404).json({ error: "PDF introuvable" });
      return;
    }

    const allowed =
      row.student_id === profile.id ||
      row.provider_id === profile.id ||
      profile.role === "admin_general" ||
      profile.role === "admin_campus";

    if (!allowed) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    try {
      const url = await createCourseMaterialSignedUrl(row.pdf_path as string);
      res.json({ data: { url } });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);
