-- Gadz'Connect — Workflow remplacement professeur

ALTER TYPE public.course_status ADD VALUE IF NOT EXISTS 'awaiting_replacement';

ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'replacement_proposed';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'replacement_accepted';
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'replacement_declined';

CREATE TYPE public.replacement_proposal_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired'
);

ALTER TABLE public.campus_notifications
  ADD COLUMN IF NOT EXISTS original_provider_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS accepted_proposal_id UUID,
  ADD COLUMN IF NOT EXISTS replacement_course_id UUID REFERENCES public.courses (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.replacement_proposals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id       UUID NOT NULL REFERENCES public.campus_notifications (id) ON DELETE CASCADE,
  original_course_id    UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  proposed_provider_id  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  message               TEXT,
  status                public.replacement_proposal_status NOT NULL DEFAULT 'pending',
  responded_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, proposed_provider_id)
);

CREATE INDEX IF NOT EXISTS idx_replacement_proposals_notification
  ON public.replacement_proposals (notification_id, status);

CREATE INDEX IF NOT EXISTS idx_replacement_proposals_course
  ON public.replacement_proposals (original_course_id);

ALTER TABLE public.campus_notifications
  DROP CONSTRAINT IF EXISTS campus_notifications_accepted_proposal_id_fkey;

ALTER TABLE public.campus_notifications
  ADD CONSTRAINT campus_notifications_accepted_proposal_id_fkey
  FOREIGN KEY (accepted_proposal_id)
  REFERENCES public.replacement_proposals (id)
  ON DELETE SET NULL;

ALTER TABLE public.replacement_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "replacement_proposals_select"
  ON public.replacement_proposals FOR SELECT
  TO authenticated
  USING (
    public.is_admin_general()
    OR proposed_provider_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campus_notifications cn
      JOIN public.courses c ON c.id = replacement_proposals.original_course_id
      WHERE cn.id = replacement_proposals.notification_id
        AND (cn.client_id = auth.uid() OR cn.declared_by = auth.uid())
    )
  );
