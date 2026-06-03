-- Gadz'Connect — Champs onboarding micro-entreprise + Stripe Connect

CREATE TYPE public.micro_enterprise_activity AS ENUM (
  'enseignement',
  'conseil',
  'prestation_intellectuelle'
);

CREATE TYPE public.urssaf_periodicity AS ENUM (
  'monthly',
  'quarterly'
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS micro_enterprise_activity public.micro_enterprise_activity,
  ADD COLUMN IF NOT EXISTS urssaf_periodicity public.urssaf_periodicity,
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_connect_account_id
  ON public.profiles (stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;

-- Mise à jour du profil par l'utilisateur connecté (onboarding)
CREATE POLICY "profiles_update_own_onboarding"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND campus_id = (SELECT campus_id FROM public.profiles WHERE id = auth.uid())
  );
