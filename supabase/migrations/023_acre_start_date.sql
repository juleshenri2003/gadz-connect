-- Gadz'Connect — Date de début de l'ACRE (aide à la création d'entreprise)
-- Permet de faire expirer l'ACRE 12 mois après le début et d'afficher le décompte.
-- status_acre = ACRE accordée ; l'état actif est dérivé de cette date.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS acre_start_date DATE;
