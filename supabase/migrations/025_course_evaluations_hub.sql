-- Gadz'Connect — Suivi pédagogique : PDF sur résumés, fiches de clarification, échanges

ALTER TABLE public.course_summaries
  ADD COLUMN IF NOT EXISTS pdf_path TEXT;

CREATE TABLE IF NOT EXISTS public.course_clarifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  folder_id    UUID NOT NULL REFERENCES public.student_subject_folders (id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT,
  pdf_path     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_clarifications_has_body CHECK (
    (content IS NOT NULL AND length(trim(content)) > 0)
    OR pdf_path IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.course_exchange_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_exchange_messages_body_len CHECK (
    length(trim(body)) >= 1 AND length(body) <= 2000
  )
);

CREATE INDEX IF NOT EXISTS idx_course_clarifications_course
  ON public.course_clarifications (course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_exchange_messages_course
  ON public.course_exchange_messages (course_id, created_at ASC);

ALTER TABLE public.course_clarifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exchange_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_clarifications_select"
  ON public.course_clarifications FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR provider_id = auth.uid()
    OR public.is_admin_general()
  );

CREATE POLICY "course_exchange_messages_select"
  ON public.course_exchange_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_exchange_messages.course_id
        AND (c.client_id = auth.uid() OR c.provider_id = auth.uid())
    )
    OR public.is_admin_general()
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials',
  'course-materials',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'course_follow_up';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'course_exchange_message';
