-- Suivi envoi e-mail facture professeur (type student = facture micro-entreprise prof)

ALTER TABLE public.payment_invoices
  ADD COLUMN IF NOT EXISTS provider_email_sent_at TIMESTAMPTZ;

