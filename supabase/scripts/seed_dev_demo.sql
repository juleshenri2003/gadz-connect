-- Données de démo pour visualiser le pilotage RH (budgets, cours)
-- Exécuter dans le SQL Editor Supabase après les migrations 001 et 002

DO $$
DECLARE
  paris_id UUID;
  provider_id UUID;
  course1_id UUID;
  course2_id UUID;
BEGIN
  SELECT id INTO paris_id FROM public.campus WHERE name = 'Paris' LIMIT 1;
  SELECT id INTO provider_id FROM public.profiles ORDER BY created_at LIMIT 1;

  IF provider_id IS NULL THEN
    RAISE NOTICE 'Aucun profil — inscrivez un utilisateur d''abord.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Initiation SolidWorks') THEN
    INSERT INTO public.courses (title, description, campus_id, provider_id, status)
    VALUES (
      'Initiation SolidWorks',
      'Cours de modélisation 3D pour débutants',
      paris_id,
      provider_id,
      'scheduled'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Préparation concours Mines-Ponts') THEN
    INSERT INTO public.courses (title, description, campus_id, provider_id, status)
    VALUES (
      'Préparation concours Mines-Ponts',
      'Soutien en mathématiques et physique',
      paris_id,
      provider_id,
      'completed'
    );
  END IF;

  SELECT id INTO course1_id FROM public.courses WHERE title = 'Initiation SolidWorks' LIMIT 1;
  SELECT id INTO course2_id FROM public.courses WHERE title = 'Préparation concours Mines-Ponts' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE course_id = course2_id) THEN
    INSERT INTO public.transactions (
      course_id, amount_gross, commission_sasu, taxes_urssaf, net_payout,
      status_stripe, status_urssaf
    ) VALUES
      (course2_id, 120.00, 12.00, 18.50, 89.50, 'succeeded', 'pending'),
      (course2_id, 80.00, 8.00, 12.30, 59.70, 'succeeded', 'declared');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE course_id = course1_id) THEN
    INSERT INTO public.transactions (
      course_id, amount_gross, commission_sasu, taxes_urssaf, net_payout,
      status_stripe, status_urssaf
    ) VALUES
      (course1_id, 150.00, 15.00, 0, 0, 'pending', 'pending');
  END IF;

  UPDATE public.profiles
  SET first_name = COALESCE(NULLIF(first_name, ''), 'Jules'),
      last_name = COALESCE(NULLIF(last_name, ''), 'Henri')
  WHERE id = provider_id;
END $$;
