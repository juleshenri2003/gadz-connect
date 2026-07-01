-- Gadz'Connect — Payeur et bénéficiaire distincts sur un cours
-- Permet de facturer au nom d'un parent payeur tout en indiquant l'élève bénéficiaire.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS payer_name TEXT,
  ADD COLUMN IF NOT EXISTS beneficiary_name TEXT;
