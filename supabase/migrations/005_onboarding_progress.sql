-- Milestone INPI pour le parcours onboarding prof en attente SIRET
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS inpi_declaration_sent_at TIMESTAMPTZ;
