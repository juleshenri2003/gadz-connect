import { supabaseAdmin } from "./supabase.js";

export const PROFILE_PHOTOS_BUCKET = "profile-photos";
const MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function profilePhotoStoragePath(
  userId: string,
  contentType: string,
): string {
  const ext = EXT_BY_TYPE[contentType] ?? "jpg";
  return `${userId}/avatar.${ext}`;
}

export function parseImageBase64(
  input: string,
): { buffer: Buffer; contentType: string } {
  const dataUrlMatch = input.match(
    /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i,
  );
  const base64 = dataUrlMatch?.[2] ?? input.replace(/\s/g, "");
  const contentType = dataUrlMatch?.[1]?.toLowerCase() ?? detectImageType(base64);

  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    throw new Error("Format accepté : JPEG, PNG ou WebP");
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length < 32) {
    throw new Error("Image invalide");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image trop volumineuse — maximum 2 Mo");
  }

  return { buffer, contentType };
}

function detectImageType(base64: string): string | null {
  const buffer = Buffer.from(base64.slice(0, 24), "base64");
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function uploadProfilePhoto(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ path: string }> {
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error("Format accepté : JPEG, PNG ou WebP");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image trop volumineuse — maximum 2 Mo");
  }

  const path = profilePhotoStoragePath(userId, contentType);
  const { error } = await supabaseAdmin.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .upload(path, buffer, {
      upsert: true,
      contentType,
      cacheControl: "3600",
    });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        "Stockage photos non configuré — exécutez la migration 019_profile_photo.sql sur Supabase",
      );
    }
    throw new Error(error.message);
  }

  return { path };
}

export function getProfilePhotoPublicUrl(
  storagePath: string | null | undefined,
): string | null {
  if (!storagePath?.trim()) return null;
  const { data } = supabaseAdmin.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl || null;
}

export async function removeProfilePhoto(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error(error.message);
  }
}
