-- Profil pédagogique élève, séances d'essai par couple élève/tuteur

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_onboarding_complete BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.student_learning_profiles (
  student_id           UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  class_year           TEXT NOT NULL,
  study_program        TEXT,
  strong_points        TEXT NOT NULL,
  difficulties         TEXT NOT NULL,
  learning_flags       TEXT[] NOT NULL DEFAULT '{}',
  learning_flags_other TEXT,
  tutoring_goals       TEXT NOT NULL,
  onboarding_complete  BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_learning_profiles_onboarding
  ON public.student_learning_profiles (onboarding_complete);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (session_type IN ('standard', 'trial'));

CREATE TABLE IF NOT EXISTS public.student_tutor_trials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_student_tutor_trials_provider
  ON public.student_tutor_trials (provider_id);

ALTER TABLE public.student_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tutor_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_learning_profiles_own_select"
  ON public.student_learning_profiles FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "student_learning_profiles_own_write"
  ON public.student_learning_profiles FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Élèves déjà inscrits : ne pas les bloquer sur le questionnaire
UPDATE public.profiles
SET student_onboarding_complete = true
WHERE role = 'student_provider'
  AND profile_setup_complete = true;
