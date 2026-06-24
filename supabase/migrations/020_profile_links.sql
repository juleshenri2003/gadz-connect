-- Liens publics professeur (LinkedIn, Google Scholar, site, etc.)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_links JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_profile_links_is_array;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_links_is_array
  CHECK (jsonb_typeof(profile_links) = 'array');
