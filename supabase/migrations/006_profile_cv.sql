-- CV professeur — visible par les élèves lors du choix du tuteur
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cv TEXT;
