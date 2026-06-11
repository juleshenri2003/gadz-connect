import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const repositoryRouter = Router();

repositoryRouter.use(requireAuth);

const summarySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

async function getProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, role, campus_id")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function ensureStudentFolder(
  studentId: string,
  subject: string,
): Promise<string | null> {
  const { data: existing } = await supabaseAdmin
    .from("student_subject_folders")
    .select("id")
    .eq("student_id", studentId)
    .eq("subject", subject)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabaseAdmin
    .from("student_subject_folders")
    .insert({ student_id: studentId, subject })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[repository] folder:", error?.message);
    return null;
  }

  return created.id as string;
}

export async function markPastCoursesCompleted(): Promise<void> {
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("courses")
    .update({ status: "completed" })
    .eq("status", "scheduled")
    .lt("scheduled_at", now);
}

function courseIsDocumentable(
  course: { status: string; scheduled_at: string | null },
): boolean {
  if (course.status === "completed") return true;
  if (course.status === "scheduled" && course.scheduled_at) {
    return new Date(course.scheduled_at).getTime() < Date.now();
  }
  return false;
}

/**
 * GET /api/repository/folders
 */
repositoryRouter.get("/folders", async (req: AuthenticatedRequest, res) => {
  const profile = await getProfile(req.user!.id);
  if (!profile) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  if (profile.role !== "student_provider") {
    res.status(403).json({ error: "Réservé aux élèves" });
    return;
  }

  await markPastCoursesCompleted();

  const { data: folders, error } = await supabaseAdmin
    .from("student_subject_folders")
    .select("id, subject, created_at")
    .eq("student_id", profile.id)
    .order("subject");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const enriched = [];
  for (const folder of folders ?? []) {
    const { count } = await supabaseAdmin
      .from("course_summaries")
      .select("id", { count: "exact", head: true })
      .eq("folder_id", folder.id);

    enriched.push({
      ...folder,
      summaryCount: count ?? 0,
    });
  }

  res.json({ data: enriched });
});

/**
 * GET /api/repository/folders/:id/summaries
 */
repositoryRouter.get(
  "/folders/:id/summaries",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: "Profil introuvable" });
      return;
    }

    const { data: folder, error: folderError } = await supabaseAdmin
      .from("student_subject_folders")
      .select("id, student_id, subject")
      .eq("id", req.params.id)
      .maybeSingle();

    if (folderError || !folder) {
      res.status(404).json({ error: "Dossier introuvable" });
      return;
    }

    if (folder.student_id !== profile.id && profile.role !== "teacher") {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("course_summaries")
      .select(
        `
        id, title, content, published_at, course_id,
        provider:provider_id ( first_name, last_name )
      `,
      )
      .eq("folder_id", folder.id)
      .order("published_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      data: {
        folder,
        summaries: data ?? [],
      },
    });
  },
);

/**
 * GET /api/repository/summaries/:id
 */
repositoryRouter.get(
  "/summaries/:id",
  async (req: AuthenticatedRequest, res) => {
    const { data, error } = await supabaseAdmin
      .from("course_summaries")
      .select(
        `
        id, title, content, published_at, course_id, folder_id, student_id, provider_id,
        folder:folder_id ( subject ),
        provider:provider_id ( first_name, last_name )
      `,
      )
      .eq("id", req.params.id)
      .maybeSingle();

    if (error || !data) {
      res.status(404).json({ error: "Résumé introuvable" });
      return;
    }

    const userId = req.user!.id;
    if (
      data.student_id !== userId &&
      data.provider_id !== userId
    ) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    res.json({ data });
  },
);

/**
 * POST /api/repository/courses/:courseId/summary
 */
repositoryRouter.post(
  "/courses/:courseId/summary",
  async (req: AuthenticatedRequest, res) => {
    const parsed = summarySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed" });
      return;
    }

    const profile = await getProfile(req.user!.id);
    if (!profile || profile.role !== "teacher") {
      res.status(403).json({ error: "Seuls les professeurs peuvent déposer un résumé" });
      return;
    }

    await markPastCoursesCompleted();

    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select(
        "id, provider_id, client_id, subject, title, status, scheduled_at, campus_id",
      )
      .eq("id", req.params.courseId)
      .maybeSingle();

    if (courseError || !course) {
      res.status(404).json({ error: "Cours introuvable" });
      return;
    }

    if (course.provider_id !== profile.id) {
      res.status(403).json({ error: "Vous n'êtes pas le professeur de ce cours" });
      return;
    }

    if (!courseIsDocumentable(course)) {
      res.status(400).json({
        error: "Le cours doit être terminé avant de déposer un résumé",
      });
      return;
    }

    if (!course.client_id) {
      res.status(400).json({ error: "Cours sans élève associé" });
      return;
    }

    const subject =
      (course.subject as string) || (course.title as string) || "Cours";
    const folderId = await ensureStudentFolder(
      course.client_id as string,
      subject,
    );

    if (!folderId) {
      res.status(500).json({ error: "Impossible de créer le dossier matière" });
      return;
    }

    const { data: existing } = await supabaseAdmin
      .from("course_summaries")
      .select("id")
      .eq("course_id", course.id)
      .maybeSingle();

    if (existing?.id) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("course_summaries")
        .update({
          title: parsed.data.title,
          content: parsed.data.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id, title, content, published_at, course_id, folder_id")
        .single();

      if (updateError) {
        res.status(500).json({ error: updateError.message });
        return;
      }

      res.json({ data: updated });
      return;
    }

    const { data: created, error: insertError } = await supabaseAdmin
      .from("course_summaries")
      .insert({
        course_id: course.id,
        folder_id: folderId,
        student_id: course.client_id,
        provider_id: profile.id,
        title: parsed.data.title,
        content: parsed.data.content,
      })
      .select("id, title, content, published_at, course_id, folder_id")
      .single();

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    res.status(201).json({ data: created });
  },
);

/**
 * GET /api/repository/courses/to-document
 */
repositoryRouter.get(
  "/courses/to-document",
  async (req: AuthenticatedRequest, res) => {
    const profile = await getProfile(req.user!.id);
    if (!profile || profile.role !== "teacher") {
      res.status(403).json({ error: "Seuls les professeurs peuvent accéder" });
      return;
    }

    await markPastCoursesCompleted();

    const { data: courses, error } = await supabaseAdmin
      .from("courses")
      .select(
        `
        id, subject, title, scheduled_at, status,
        client:client_id ( first_name, last_name )
      `,
      )
      .eq("provider_id", profile.id)
      .in("status", ["completed", "scheduled"])
      .not("client_id", "is", null)
      .order("scheduled_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data: existingSummaries } = await supabaseAdmin
      .from("course_summaries")
      .select("course_id")
      .eq("provider_id", profile.id);

    const documented = new Set(
      (existingSummaries ?? []).map((s) => s.course_id as string),
    );

    const toDocument = (courses ?? []).filter(
      (c) =>
        courseIsDocumentable(c as { status: string; scheduled_at: string | null }) &&
        !documented.has(c.id as string),
    );

    res.json({ data: toDocument });
  },
);
