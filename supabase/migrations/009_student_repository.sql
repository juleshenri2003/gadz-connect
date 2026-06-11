-- Gadz'Connect — Répertoire élève par matière + résumés de cours

CREATE TABLE IF NOT EXISTS public.student_subject_folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject)
);

CREATE TABLE IF NOT EXISTS public.course_summaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL UNIQUE REFERENCES public.courses (id) ON DELETE CASCADE,
  folder_id    UUID NOT NULL REFERENCES public.student_subject_folders (id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_subject_folders_student
  ON public.student_subject_folders (student_id);

CREATE INDEX IF NOT EXISTS idx_course_summaries_folder
  ON public.course_summaries (folder_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_summaries_provider
  ON public.course_summaries (provider_id);

ALTER TABLE public.student_subject_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_subject_folders_select"
  ON public.student_subject_folders FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.course_summaries cs
      WHERE cs.folder_id = student_subject_folders.id
        AND cs.provider_id = auth.uid()
    )
  );

CREATE POLICY "course_summaries_select"
  ON public.course_summaries FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR student_id = auth.uid()
    OR provider_id = auth.uid()
  );
