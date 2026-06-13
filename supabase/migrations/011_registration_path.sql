-- Chemin d'inscription prestataire (express vs complet)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS registration_path TEXT
  CHECK (registration_path IN ('existing_siret', 'new_micro'));

-- Flag échec vérification SIRET API (supervision admin)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS siret_verification_failed BOOLEAN NOT NULL DEFAULT false;

-- Backfill : profils actifs avec SIRET → express, sinon complet
UPDATE profiles
SET registration_path = CASE
  WHEN account_status = 'active' AND siret IS NOT NULL AND siret ~ '^\d{14}$'
    THEN 'existing_siret'
  ELSE 'new_micro'
END
WHERE registration_path IS NULL AND role = 'teacher';

-- Auto-activer les profs en attente avec SIRET déjà déclaré
UPDATE profiles
SET account_status = 'active'
WHERE role = 'teacher'
  AND account_status = 'pending_siret'
  AND siret IS NOT NULL
  AND siret ~ '^\d{14}$';
