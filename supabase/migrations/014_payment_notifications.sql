-- Gadz'Connect — Notification paiement élève

ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'account_activated';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'payment_received';
