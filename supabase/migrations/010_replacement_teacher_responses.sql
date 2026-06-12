-- Réponses prof à une alerte remplacement (acceptation = proposal, refus = decline)

CREATE TABLE IF NOT EXISTS public.replacement_teacher_declines (
  notification_id UUID NOT NULL REFERENCES public.campus_notifications (id) ON DELETE CASCADE,
  teacher_id        UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_replacement_teacher_declines_notification
  ON public.replacement_teacher_declines (notification_id);

ALTER TABLE public.replacement_teacher_declines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "replacement_teacher_declines_select"
  ON public.replacement_teacher_declines FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR teacher_id = auth.uid()
  );

CREATE POLICY "replacement_teacher_declines_insert_own"
  ON public.replacement_teacher_declines FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());
