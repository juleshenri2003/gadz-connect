-- Gadz'Connect — Avis élèves sur les cours (demi-étoiles, commentaire admin)

CREATE TABLE IF NOT EXISTS public.course_ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL UNIQUE REFERENCES public.courses (id) ON DELETE CASCADE,
  campus_id    UUID NOT NULL REFERENCES public.campus (id) ON DELETE CASCADE,
  rater_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  stars        NUMERIC(2, 1) NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_ratings_stars_range CHECK (stars >= 1 AND stars <= 5),
  CONSTRAINT course_ratings_stars_half_step CHECK ((stars * 2) = floor(stars * 2))
);

CREATE INDEX IF NOT EXISTS idx_course_ratings_provider
  ON public.course_ratings (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_ratings_rater
  ON public.course_ratings (rater_id, created_at DESC);

ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'course_rated';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'course_rated_low';
