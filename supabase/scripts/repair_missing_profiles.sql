-- Crée un profil pour chaque utilisateur auth sans ligne profiles (campus Paris par défaut)
INSERT INTO public.profiles (id, first_name, last_name, campus_id)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'first_name', ''),
  COALESCE(u.raw_user_meta_data ->> 'last_name', ''),
  c.id
FROM auth.users u
CROSS JOIN public.campus c
WHERE c.name = 'Paris'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );
