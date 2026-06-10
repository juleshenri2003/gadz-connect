-- Gadz'Connect — Inscription, marketplace tutorat, créneaux

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_setup_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(6, 2)
    CHECK (hourly_rate IS NULL OR hourly_rate > 0),
  ADD COLUMN IF NOT EXISTS subjects TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles (id),
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slot_id UUID;

CREATE TABLE IF NOT EXISTS public.tutor_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  booked      BOOLEAN NOT NULL DEFAULT false,
  booked_by   UUID REFERENCES public.profiles (id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tutor_slots_time_valid CHECK (ends_at > starts_at)
);

ALTER TABLE public.courses
  ADD CONSTRAINT courses_slot_id_fkey
  FOREIGN KEY (slot_id) REFERENCES public.tutor_slots (id);

CREATE INDEX IF NOT EXISTS idx_tutor_slots_provider ON public.tutor_slots (provider_id);
CREATE INDEX IF NOT EXISTS idx_tutor_slots_starts_at ON public.tutor_slots (starts_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subjects ON public.profiles USING GIN (subjects);

UPDATE public.profiles
SET profile_setup_complete = true
WHERE first_name <> '' AND last_name <> '';

ALTER TABLE public.tutor_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_slots_select"
  ON public.tutor_slots FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = tutor_slots.provider_id
        AND p.campus_id = public.user_campus_id()
    )
  );

CREATE POLICY "tutor_slots_insert_own"
  ON public.tutor_slots FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "tutor_slots_update"
  ON public.tutor_slots FOR UPDATE
  TO authenticated
  USING (
    provider_id = auth.uid()
    OR booked_by = auth.uid()
    OR public.is_admin_general()
  );

CREATE POLICY "tutor_slots_delete_own"
  ON public.tutor_slots FOR DELETE
  TO authenticated
  USING (provider_id = auth.uid() AND NOT booked);
