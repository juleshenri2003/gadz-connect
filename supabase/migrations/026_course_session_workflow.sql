-- Gadz'Connect — Confirmations 24 h, remplacement prof, remboursements

ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'course_confirmation_reminder';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'course_confirmation_escalation';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'replacement_offer';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'replacement_candidate';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'replacement_accepted';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'refund_processed';

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS confirmation_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replacement_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_courses_confirmation_reminder
  ON public.courses (scheduled_at)
  WHERE status = 'scheduled' AND confirmation_reminder_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_courses_awaiting_replacement
  ON public.courses (replacement_expires_at)
  WHERE status = 'awaiting_replacement';

