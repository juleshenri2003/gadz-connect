-- Gadz'Connect — Facturation mensuelle regroupée (Parent / Étudiant)

CREATE TYPE public.invoice_billing_status AS ENUM ('pending_invoice', 'invoiced');

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS invoice_status public.invoice_billing_status
    NOT NULL DEFAULT 'pending_invoice';

CREATE INDEX IF NOT EXISTS idx_transactions_invoice_status
  ON public.transactions (invoice_status)
  WHERE status_stripe = 'succeeded';

-- Factures mensuelles consolidées
CREATE TABLE public.monthly_invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type        public.invoice_type NOT NULL,
  billing_period      DATE NOT NULL,
  profile_id          UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  invoice_number      TEXT NOT NULL UNIQUE,
  amount              NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  line_count          INTEGER NOT NULL CHECK (line_count > 0),
  storage_path        TEXT NOT NULL,
  email_sent_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT monthly_invoices_period_profile_type_unique
    UNIQUE (invoice_type, billing_period, profile_id)
);

CREATE INDEX idx_monthly_invoices_profile_id
  ON public.monthly_invoices (profile_id);

CREATE INDEX idx_monthly_invoices_billing_period
  ON public.monthly_invoices (billing_period);

-- Lignes de cours rattachées à une facture mensuelle
CREATE TABLE public.monthly_invoice_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_invoice_id  UUID NOT NULL REFERENCES public.monthly_invoices (id) ON DELETE RESTRICT,
  transaction_id      UUID NOT NULL REFERENCES public.transactions (id) ON DELETE RESTRICT,
  amount              NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT monthly_invoice_lines_transaction_unique UNIQUE (transaction_id)
);

CREATE INDEX idx_monthly_invoice_lines_monthly_invoice_id
  ON public.monthly_invoice_lines (monthly_invoice_id);

-- Transactions déjà facturées (ancien modèle per-cours)
UPDATE public.transactions t
SET invoice_status = 'invoiced'
WHERE EXISTS (
  SELECT 1
  FROM public.payment_invoices pi
  WHERE pi.transaction_id = t.id
);

ALTER TABLE public.monthly_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_invoices_select"
  ON public.monthly_invoices FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_campus', 'admin_general')
    )
  );

CREATE POLICY "monthly_invoice_lines_select"
  ON public.monthly_invoice_lines FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR EXISTS (
      SELECT 1
      FROM public.monthly_invoices mi
      WHERE mi.id = monthly_invoice_id
        AND (
          mi.profile_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('admin_campus', 'admin_general')
          )
        )
    )
  );
