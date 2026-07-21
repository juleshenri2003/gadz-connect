-- Gadz'Connect — Avance immédiate URSSAF (API Tiers de Prestation)
-- Idempotent : safe to re-run if partially applied.

DO $$ BEGIN
  CREATE TYPE public.urssaf_client_status AS ENUM (
    'inscription_envoyee',
    'rattachement_en_attente',
    'actif',
    'refuse',
    'expire'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_channel AS ENUM ('stripe', 'urssaf');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.urssaf_payment_status AS ENUM (
    'recue',
    'en_attente_validation',
    'validee',
    'virement_effectue',
    'paye',
    'rejetee'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.prof_payout_status AS ENUM (
    'pending_urssaf',
    'paid',
    'paid_at_booking'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.course_payment_method AS ENUM ('stripe', 'urssaf');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Clients URSSAF (payeurs / parents)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.urssaf_clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  birth_date          DATE NOT NULL,
  birth_place         TEXT NOT NULL,
  fiscal_address      TEXT NOT NULL,
  iban_encrypted      TEXT NOT NULL,
  nir_encrypted       TEXT,
  urssaf_client_id    TEXT,
  urssaf_transmission_id TEXT,
  status              public.urssaf_client_status NOT NULL DEFAULT 'inscription_envoyee',
  last_polled_at      TIMESTAMPTZ,
  activated_at        TIMESTAMPTZ,
  refused_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_urssaf_clients_status ON public.urssaf_clients (status);
CREATE INDEX IF NOT EXISTS idx_urssaf_clients_urssaf_client_id ON public.urssaf_clients (urssaf_client_id)
  WHERE urssaf_client_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Extensions courses / transactions
-- -----------------------------------------------------------------------------

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS payment_method public.course_payment_method,
  ADD COLUMN IF NOT EXISTS is_home_visit BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_channel public.payment_channel NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS urssaf_payment_request_id TEXT,
  ADD COLUMN IF NOT EXISTS urssaf_payment_status public.urssaf_payment_status,
  ADD COLUMN IF NOT EXISTS urssaf_transmission_id TEXT,
  ADD COLUMN IF NOT EXISTS prof_payout_status public.prof_payout_status,
  ADD COLUMN IF NOT EXISTS prof_payout_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS urssaf_paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_transactions_urssaf_payment_status
  ON public.transactions (urssaf_payment_status)
  WHERE urssaf_payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_prof_payout_pending
  ON public.transactions (prof_payout_status)
  WHERE prof_payout_status = 'pending_urssaf';

-- -----------------------------------------------------------------------------
-- Journal d'audit API URSSAF
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.urssaf_api_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  course_id       UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  transaction_id  UUID REFERENCES public.transactions (id) ON DELETE SET NULL,
  method          TEXT NOT NULL,
  request_path    TEXT NOT NULL,
  request_summary JSONB,
  response_status INTEGER,
  response_summary JSONB,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_urssaf_audit_created_at ON public.urssaf_api_audit_log (created_at DESC);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS urssaf_clients_updated_at ON public.urssaf_clients;
CREATE TRIGGER urssaf_clients_updated_at
  BEFORE UPDATE ON public.urssaf_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

ALTER TABLE public.urssaf_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urssaf_api_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS urssaf_clients_select_own ON public.urssaf_clients;
CREATE POLICY urssaf_clients_select_own ON public.urssaf_clients
  FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS urssaf_clients_insert_own ON public.urssaf_clients;
CREATE POLICY urssaf_clients_insert_own ON public.urssaf_clients
  FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS urssaf_clients_update_own ON public.urssaf_clients;
CREATE POLICY urssaf_clients_update_own ON public.urssaf_clients
  FOR UPDATE USING (profile_id = auth.uid());

-- Audit log : service role uniquement (pas d'accès client direct)
