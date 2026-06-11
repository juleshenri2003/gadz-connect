import { supabaseAdmin } from "./supabase.js";

export const CV_PDF_BUCKET = "cv-pdfs";
const MAX_BYTES = 5 * 1024 * 1024;

export function cvPdfStoragePath(userId: string): string {
  return `${userId}/cv.pdf`;
}

export async function uploadCvPdf(
  userId: string,
  buffer: Buffer,
): Promise<{ path: string }> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("Fichier trop volumineux — maximum 5 Mo");
  }

  const path = cvPdfStoragePath(userId);
  const { error } = await supabaseAdmin.storage
    .from(CV_PDF_BUCKET)
    .upload(path, buffer, {
      upsert: true,
      contentType: "application/pdf",
    });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        "Stockage CV non configuré — exécutez la migration 007_cv_pdf_storage.sql sur Supabase",
      );
    }
    throw new Error(error.message);
  }

  return { path };
}

export async function createCvPdfSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(CV_PDF_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Impossible de générer le lien PDF");
  }

  return data.signedUrl;
}

export async function removeCvPdf(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(CV_PDF_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error(error.message);
  }
}
