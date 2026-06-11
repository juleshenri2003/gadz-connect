-- CV PDF (Supabase Storage) — chemin du fichier dans le bucket cv-pdfs
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cv_pdf_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-pdfs',
  'cv-pdfs',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;
