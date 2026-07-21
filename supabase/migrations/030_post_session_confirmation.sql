-- Gadz'Connect — Double confirmation post-séance avant paiement prof

ALTER TYPE public.course_status ADD VALUE IF NOT EXISTS 'awaiting_session_confirmation';

DO $$ BEGIN
  ALTER TYPE public.prof_payout_status ADD VALUE IF NOT EXISTS 'pending_session_confirmation';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.session_dispute_status AS ENUM (
    'none',
    'open',
    'resolved_paid',
    'resolved_refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS student_session_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_session_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_confirmation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_dispute_status public.session_dispute_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS session_confirm_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_confirm_reminder_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_courses_awaiting_session_confirmation
  ON public.courses (scheduled_at)
  WHERE status = 'awaiting_session_confirmation';

CREATE INDEX IF NOT EXISTS idx_courses_session_dispute_open
  ON public.courses (scheduled_at)
  WHERE session_dispute_status = 'open';

ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'session_confirm_reminder';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'session_both_confirmed';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'session_dispute';
