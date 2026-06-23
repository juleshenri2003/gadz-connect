-- Gadz'Connect — Ventilation tripartite Parent → Plateforme → Prof (auto-entrepreneur)

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS total_paid_parent NUMERIC(10, 2)
    CHECK (total_paid_parent IS NULL OR total_paid_parent >= 0),
  ADD COLUMN IF NOT EXISTS platform_commission NUMERIC(10, 2)
    CHECK (platform_commission IS NULL OR platform_commission >= 0),
  ADD COLUMN IF NOT EXISTS teacher_gross_revenue NUMERIC(10, 2)
    CHECK (teacher_gross_revenue IS NULL OR teacher_gross_revenue >= 0);

-- Rétro-remplissage depuis les colonnes historiques
UPDATE public.transactions
SET
  total_paid_parent = amount_gross,
  platform_commission = commission_sasu,
  teacher_gross_revenue = ROUND(amount_gross - commission_sasu, 2)
WHERE total_paid_parent IS NULL;
