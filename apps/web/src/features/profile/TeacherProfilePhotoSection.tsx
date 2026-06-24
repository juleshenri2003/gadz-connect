import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";
import { useEffect, useState } from "react";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { ProfilePhotoUpload } from "@/features/profile/ProfilePhotoUpload";
import {
  useDeleteProfilePhoto,
  useUploadProfilePhoto,
} from "@/features/profile/useProfilePhoto";

interface TeacherProfilePhotoSectionProps {
  profile: MyProfile;
}

export function TeacherProfilePhotoSection({
  profile,
}: TeacherProfilePhotoSectionProps) {
  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  useEffect(() => {
    if (!uploadPhoto.isSuccess && !deletePhoto.isSuccess) return;
    setSuccess(true);
    setSelectedFile(null);
    const timer = window.setTimeout(() => {
      setSuccess(false);
      uploadPhoto.reset();
      deletePhoto.reset();
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [uploadPhoto.isSuccess, deletePhoto.isSuccess, uploadPhoto, deletePhoto]);

  async function savePhoto() {
    if (!selectedFile) return;
    await uploadPhoto.mutateAsync(selectedFile);
  }

  async function removePhoto() {
    if (profile.avatar_url) {
      await deletePhoto.mutateAsync();
    }
    setSelectedFile(null);
  }

  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle className="text-base">Ma photo</CardTitle>
        <p className="text-sm text-ink-400">
          Optionnelle — affichée aux élèves sur la marketplace et votre fiche
          tuteur.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProfilePhotoUpload
          displayName={fullName}
          existingPhotoUrl={profile.avatar_url}
          selectedFile={selectedFile}
          onSelectedFileChange={setSelectedFile}
          disabled={uploadPhoto.isPending || deletePhoto.isPending}
          compact
        />

        {selectedFile ? (
          <Button
            size="sm"
            disabled={uploadPhoto.isPending}
            onClick={() => void savePhoto()}
          >
            {uploadPhoto.isPending ? "Enregistrement…" : "Enregistrer la photo"}
          </Button>
        ) : profile.avatar_url ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={deletePhoto.isPending}
            onClick={() => void removePhoto()}
          >
            {deletePhoto.isPending ? "Suppression…" : "Supprimer la photo"}
          </Button>
        ) : null}

        {uploadPhoto.isError ? (
          <p className="text-sm text-danger" role="alert">
            {(uploadPhoto.error as Error).message}
          </p>
        ) : null}
        {deletePhoto.isError ? (
          <p className="text-sm text-danger" role="alert">
            {(deletePhoto.error as Error).message}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-success" role="status">
            Photo mise à jour.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
