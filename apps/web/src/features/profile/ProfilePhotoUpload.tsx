import { Button } from "@gadz-connect/ui";
import { useEffect, useRef, useState } from "react";
import { TutorAvatar } from "@/features/marketplace/TutorCard";

const ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const MAX_BYTES = 2 * 1024 * 1024;

interface ProfilePhotoUploadProps {
  displayName: string;
  existingPhotoUrl?: string | null;
  selectedFile: File | null;
  onSelectedFileChange: (file: File | null) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ProfilePhotoUpload({
  displayName,
  existingPhotoUrl,
  selectedFile,
  onSelectedFileChange,
  disabled = false,
  compact = false,
}: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function onFileSelected(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Format accepté : JPEG, PNG ou WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image trop volumineuse — maximum 2 Mo");
      return;
    }
    onSelectedFileChange(file);
  }

  const photoUrl = previewUrl ?? existingPhotoUrl ?? null;

  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "space-y-4 rounded-lg border border-line bg-paper/50 p-4"
      }
    >
      <div className="flex flex-wrap items-start gap-4">
        <TutorAvatar name={displayName} photoUrl={photoUrl} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium text-ink-900">
              Photo de profil{" "}
              <span className="font-normal text-ink-400">(optionnel)</span>
            </p>
            <p className="mt-1 text-xs text-ink-400">
              Visible par les élèves sur votre fiche tuteur. JPEG, PNG ou WebP —
              max. 2 Mo.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            disabled={disabled}
            onChange={(e) => onFileSelected(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {selectedFile || existingPhotoUrl
                ? "Changer la photo"
                : "Choisir une photo"}
            </Button>
            {selectedFile || existingPhotoUrl ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => {
                  onSelectedFileChange(null);
                  setError(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Retirer
              </Button>
            ) : null}
          </div>
          {selectedFile ? (
            <p className="text-xs font-medium text-success">
              Photo sélectionnée : {selectedFile.name}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export async function imageFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}
