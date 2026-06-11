-- Gadz'Connect — Indisponibilités cours + notifications campus

CREATE TYPE public.notification_kind AS ENUM (
  'prof_unavailable',
  'student_unavailable'
);

CREATE TYPE public.replacement_status AS ENUM (
  'open',
  'filled',
  'dismissed'
);

CREATE TABLE IF NOT EXISTS public.campus_notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id           UUID NOT NULL REFERENCES public.campus (id) ON DELETE CASCADE,
  course_id           UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  kind                public.notification_kind NOT NULL,
  title               TEXT NOT NULL,
  message             TEXT NOT NULL,
  scheduled_at        TIMESTAMPTZ,
  declared_by         UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  replacement_status  public.replacement_status NOT NULL DEFAULT 'open',
  reason              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_recipients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id   UUID NOT NULL REFERENCES public.campus_notifications (id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_campus_notifications_campus
  ON public.campus_notifications (campus_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campus_notifications_open
  ON public.campus_notifications (campus_id, replacement_status)
  WHERE replacement_status = 'open';

CREATE INDEX IF NOT EXISTS idx_notification_recipients_user
  ON public.notification_recipients (user_id, read_at);

ALTER TABLE public.campus_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campus_notifications_select"
  ON public.campus_notifications FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR campus_id = public.user_campus_id()
  );

CREATE POLICY "notification_recipients_select_own"
  ON public.notification_recipients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_general());

CREATE POLICY "notification_recipients_update_own"
  ON public.notification_recipients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
