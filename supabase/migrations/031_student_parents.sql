-- Gadz'Connect — Parents déclarés sur le profil élève (facturation)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parents JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.parents IS
  'Parents / payeurs déclarés par l''élève : [{id, first_name, last_name, email}]';
