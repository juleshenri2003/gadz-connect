-- Corrige : une transaction peut avoir une ligne parent ET une ligne étudiant.

ALTER TABLE public.monthly_invoice_lines
  DROP CONSTRAINT IF EXISTS monthly_invoice_lines_transaction_unique;

ALTER TABLE public.monthly_invoice_lines
  ADD CONSTRAINT monthly_invoice_lines_invoice_transaction_unique
    UNIQUE (monthly_invoice_id, transaction_id);
