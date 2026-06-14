-- Normalise legacy courses stuck in awaiting_replacement after cancellation-only workflow.
UPDATE public.courses
SET status = 'cancelled'
WHERE status = 'awaiting_replacement';
