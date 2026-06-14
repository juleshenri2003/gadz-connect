-- Gadz'Connect — Facturation Configuration A (SAP + Stripe)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_autoentrepreneur_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS micro_enterprise_address TEXT;

-- Profils déjà actifs avec SIRET valide : considérés vérifiés
UPDATE public.profiles
SET is_autoentrepreneur_verified = true
WHERE account_status = 'active'
  AND siret IS NOT NULL
  AND siret ~ '^\d{14}$'
  AND role = 'teacher';

CREATE TYPE public.invoice_type AS ENUM ('parent', 'student');

CREATE TABLE public.payment_invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id      UUID NOT NULL REFERENCES public.transactions (id) ON DELETE RESTRICT,
  course_id           UUID NOT NULL REFERENCES public.courses (id) ON DELETE RESTRICT,
  invoice_type        public.invoice_type NOT NULL,
  invoice_number      TEXT NOT NULL UNIQUE,
  amount              NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  storage_path        TEXT NOT NULL,
  provider_profile_id UUID REFERENCES public.profiles (id),
  client_profile_id   UUID REFERENCES public.profiles (id),
  parent_email_sent_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_invoices_transaction_type_unique UNIQUE (transaction_id, invoice_type)
);

CREATE INDEX idx_payment_invoices_transaction_id
  ON public.payment_invoices (transaction_id);

CREATE INDEX idx_payment_invoices_provider_profile_id
  ON public.payment_invoices (provider_profile_id);

CREATE INDEX idx_payment_invoices_course_id
  ON public.payment_invoices (course_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.payment_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_invoices_select"
  ON public.payment_invoices FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR provider_profile_id = auth.uid()
    OR client_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_campus', 'admin_general')
    )
  );
