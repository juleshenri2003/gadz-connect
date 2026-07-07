import { supabaseAdmin } from "./supabase.js";

export const COURSE_MATERIALS_BUCKET = "course-materials";
const MAX_BYTES = 5 * 1024 * 1024;

export function courseMaterialStoragePath(
  courseId: string,
  kind: "summary" | "clarification",
  fileId: string,
): string {
  return `${courseId}/${kind}/${fileId}.pdf`;
}

export function decodePdfBase64(encoded: string): Buffer {
  const cleaned = encoded.replace(/^data:application\/pdf;base64,/, "");
  const buffer = Buffer.from(cleaned, "base64");
  if (buffer.length === 0) {
    throw new Error("PDF invalide");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Fichier trop volumineux — maximum 5 Mo");
  }
  return buffer;
}

export async function uploadCourseMaterialPdf(
  storagePath: string,
  buffer: Buffer,
): Promise<{ path: string }> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("Fichier trop volumineux — maximum 5 Mo");
  }

  const { error } = await supabaseAdmin.storage
    .from(COURSE_MATERIALS_BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: "application/pdf",
    });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        "Stockage cours non configuré — exécutez la migration 025_course_evaluations_hub.sql",
      );
    }
    throw new Error(error.message);
  }

  return { path: storagePath };
}

export async function createCourseMaterialSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(COURSE_MATERIALS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Impossible de générer le lien PDF");
  }

  return data.signedUrl;
}
