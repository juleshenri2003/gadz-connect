-- Gadz'Connect — Notifications avance immédiate URSSAF

ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'urssaf_client_actif';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'urssaf_payment_rejected';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'urssaf_payout_pending';
