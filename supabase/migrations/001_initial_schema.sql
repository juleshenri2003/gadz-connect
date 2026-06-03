-- =============================================================================
-- Gadz'Connect — Schéma initial Supabase (PostgreSQL)
-- Exécuter dans le SQL Editor du tableau de bord Supabase
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Énumérations
-- -----------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'student_provider',
  'teacher',
  'admin_campus',
  'admin_general'
);

CREATE TYPE public.account_status AS ENUM (
  'pending_siret',
  'active',
  'suspended'
);

CREATE TYPE public.course_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled'
);

CREATE TYPE public.transaction_stripe_status AS ENUM (
  'pending',
  'succeeded',
  'failed',
  'refunded'
);

CREATE TYPE public.transaction_urssaf_status AS ENUM (
  'pending',
  'declared'
);

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE public.campus (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  role                  public.user_role NOT NULL DEFAULT 'student_provider',
  campus_id             UUID NOT NULL REFERENCES public.campus (id),
  siret                 TEXT,
  status_acre           BOOLEAN NOT NULL DEFAULT false,
  versement_liberatoire BOOLEAN NOT NULL DEFAULT false,
  account_status        public.account_status NOT NULL DEFAULT 'pending_siret',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_siret_format CHECK (
    siret IS NULL OR siret ~ '^\d{14}$'
  )
);

CREATE TABLE public.courses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  campus_id   UUID NOT NULL REFERENCES public.campus (id),
  provider_id UUID NOT NULL REFERENCES public.profiles (id),
  status      public.course_status NOT NULL DEFAULT 'scheduled',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES public.courses (id) ON DELETE RESTRICT,
  amount_gross     NUMERIC(10, 2) NOT NULL CHECK (amount_gross >= 0),
  commission_sasu  NUMERIC(10, 2) NOT NULL CHECK (commission_sasu >= 0),
  taxes_urssaf     NUMERIC(10, 2) NOT NULL CHECK (taxes_urssaf >= 0),
  net_payout       NUMERIC(10, 2) NOT NULL CHECK (net_payout >= 0),
  status_stripe    public.transaction_stripe_status NOT NULL DEFAULT 'pending',
  status_urssaf    public.transaction_urssaf_status NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Données initiales — Campus Arts et Métiers
-- -----------------------------------------------------------------------------

INSERT INTO public.campus (name) VALUES
  ('Aix'),
  ('Angers'),
  ('Bordeaux'),
  ('Châlons'),
  ('Cluny'),
  ('Lille'),
  ('Metz'),
  ('Paris');

-- -----------------------------------------------------------------------------
-- Index
-- -----------------------------------------------------------------------------

CREATE INDEX idx_profiles_campus_id ON public.profiles (campus_id);
CREATE INDEX idx_profiles_role ON public.profiles (role);
CREATE INDEX idx_courses_campus_id ON public.courses (campus_id);
CREATE INDEX idx_courses_provider_id ON public.courses (provider_id);
CREATE INDEX idx_transactions_course_id ON public.transactions (course_id);

-- -----------------------------------------------------------------------------
-- Trigger updated_at
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Helpers RLS — contexte utilisateur courant
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_general()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin_general'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_campus_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.campus_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.campus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- --- campus ---

CREATE POLICY "campus_select"
  ON public.campus FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR id = public.user_campus_id()
  );

CREATE POLICY "campus_insert_admin_general"
  ON public.campus FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_general());

CREATE POLICY "campus_update_admin_general"
  ON public.campus FOR UPDATE
  TO authenticated
  USING (public.is_admin_general())
  WITH CHECK (public.is_admin_general());

CREATE POLICY "campus_delete_admin_general"
  ON public.campus FOR DELETE
  TO authenticated
  USING (public.is_admin_general());

-- --- profiles ---

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR campus_id = public.user_campus_id()
    OR id = auth.uid()
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND (
      public.is_admin_general()
      OR campus_id = public.user_campus_id()
    )
  );

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_general()
    OR (campus_id = public.user_campus_id() AND id = auth.uid())
    OR (
      campus_id = public.user_campus_id()
      AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_campus'
    )
  )
  WITH CHECK (
    public.is_admin_general()
    OR campus_id = public.user_campus_id()
  );

CREATE POLICY "profiles_delete_admin_general"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin_general());

-- --- courses ---

CREATE POLICY "courses_select"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR campus_id = public.user_campus_id()
  );

CREATE POLICY "courses_insert"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_general()
    OR (
      campus_id = public.user_campus_id()
      AND provider_id = auth.uid()
    )
  );

CREATE POLICY "courses_update"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_general()
    OR (
      campus_id = public.user_campus_id()
      AND (
        provider_id = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN (
          'admin_campus', 'teacher'
        )
      )
    )
  )
  WITH CHECK (
    public.is_admin_general()
    OR campus_id = public.user_campus_id()
  );

CREATE POLICY "courses_delete"
  ON public.courses FOR DELETE
  TO authenticated
  USING (
    public.is_admin_general()
    OR (
      campus_id = public.user_campus_id()
      AND provider_id = auth.uid()
    )
  );

-- --- transactions (cloisonnement via course → campus) ---

CREATE POLICY "transactions_select"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = transactions.course_id
        AND c.campus_id = public.user_campus_id()
    )
  );

CREATE POLICY "transactions_insert"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_general()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = course_id
        AND c.campus_id = public.user_campus_id()
    )
  );

CREATE POLICY "transactions_update"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_general()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = transactions.course_id
        AND c.campus_id = public.user_campus_id()
    )
  )
  WITH CHECK (
    public.is_admin_general()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = course_id
        AND c.campus_id = public.user_campus_id()
    )
  );

CREATE POLICY "transactions_delete_admin_general"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (public.is_admin_general());

-- -----------------------------------------------------------------------------
-- Auto-création du profil à l'inscription (Magic Link)
-- À adapter côté application avec campus_id choisi lors de l'onboarding
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_campus_id UUID;
BEGIN
  SELECT id INTO default_campus_id FROM public.campus WHERE name = 'Paris' LIMIT 1;

  INSERT INTO public.profiles (id, first_name, last_name, campus_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'campus_id')::UUID,
      default_campus_id
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
