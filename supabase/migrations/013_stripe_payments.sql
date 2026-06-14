-- Gadz'Connect — Paiement Stripe à la réservation

ALTER TYPE public.course_status ADD VALUE IF NOT EXISTS 'payment_pending';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id
  ON public.transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
