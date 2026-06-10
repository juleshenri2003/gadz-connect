-- Promouvoir un utilisateur en administrateur général (accès /admin)
-- Remplacer YOUR_USER_UUID par l'id de auth.users / profiles

UPDATE public.profiles
SET role = 'admin_general'
WHERE id = 'YOUR_USER_UUID'::uuid;

-- Admin limité à un campus :
-- UPDATE public.profiles SET role = 'admin_campus' WHERE id = 'YOUR_USER_UUID'::uuid;
