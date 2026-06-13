import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
} from "@gadz-connect/ui";
import { useEffect, useRef, useState } from "react";
import type { MyProfile } from "@/features/auth/useMyProfile";
import {
  useDeleteCvPdf,
  useMyCvPdfUrl,
  useUploadCvPdf,
} from "@/features/cv/useCvPdf";
import { useUpdateTutorProfile } from "@/features/marketplace/useTutors";
import {
  cvPdfFileName,
  isProfileCvComplete,
} from "@/features/profile/profilePageUtils";

interface TeacherProfileCvSectionProps {
  profile: MyProfile;
}

export function TeacherProfileCvSection({ profile }: TeacherProfileCvSectionProps) {
  const updateProfile = useUpdateTutorProfile();
  const uploadPdf = useUploadCvPdf();
  const deletePdf = useDeleteCvPdf();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cv, setCv] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hasPdf = Boolean(profile.cv_pdf_path);
  const { data: pdfUrl } = useMyCvPdfUrl(hasPdf);
  const pdfName = cvPdfFileName(profile.cv_pdf_path);
  const cvComplete = isProfileCvComplete(profile);

  useEffect(() => {
    setCv(profile.cv ?? "");
  }, [profile.cv]);

  useEffect(() => {
    if (!updateProfile.isSuccess) return;
    setSaveSuccess(true);
    const timer = window.setTimeout(() => {
      setSaveSuccess(false);
      updateProfile.reset();
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [updateProfile.isSuccess, updateProfile]);

  useEffect(() => {
    if (!uploadPdf.isSuccess) return;
    const timer = window.setTimeout(() => uploadPdf.reset(), 4000);
    return () => window.clearTimeout(timer);
  }, [uploadPdf.isSuccess, uploadPdf]);

  const textCvValid = cv.trim().length === 0 || cv.trim().length >= 50;
  const canSaveText = textCvValid && (cv.trim().length >= 50 || hasPdf);

  async function saveCv() {
    await updateProfile.mutateAsync({ cv: cv.trim() });
  }

  async function onPdfSelected(file: File | undefined) {
    if (!file) return;
    await uploadPdf.mutateAsync(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle className="text-base">Mon CV</CardTitle>
        <p className="text-sm text-ink-400">
          Texte et/ou PDF — visible par les élèves lors du choix d&apos;un professeur.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!cvComplete ? (
          <div
            className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
            role="status"
          >
            CV incomplet — les élèves verront « pas encore de CV » sur votre fiche.
            Ajoutez un texte (50 caractères min.) ou un PDF.
          </div>
        ) : null}

        <div className="space-y-3 rounded-lg border border-line bg-paper/50 p-4">
          <div>
            <p className="text-sm font-medium text-ink-900">CV en PDF</p>
            <p className="mt-1 text-xs text-ink-400">
              Déposez votre CV au format PDF (max. 5 Mo). Un seul fichier à la fois
              — le précédent est remplacé.
            </p>
            {hasPdf && pdfName ? (
              <p className="mt-2 text-xs font-medium text-ink-600">
                Fichier en ligne : {pdfName}
              </p>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
            disabled={uploadPdf.isPending}
            onChange={(e) => void onPdfSelected(e.target.files?.[0])}
          />
          {hasPdf ? (
            <div className="flex flex-wrap gap-2">
              {pdfUrl ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    Voir mon CV PDF
                  </a>
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                disabled={deletePdf.isPending}
                onClick={() => void deletePdf.mutate()}
              >
                {deletePdf.isPending ? "Suppression…" : "Supprimer le PDF"}
              </Button>
            </div>
          ) : null}
          {uploadPdf.isError ? (
            <p className="text-sm text-danger" role="alert">
              {(uploadPdf.error as Error).message}
            </p>
          ) : null}
          {uploadPdf.isSuccess ? (
            <p className="text-sm text-success" role="status">
              CV PDF enregistré.
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="profile-cv">CV texte (complément ou alternative)</Label>
            <textarea
              id="profile-cv"
              rows={8}
              className="w-full rounded-md border border-line p-3 text-sm"
              placeholder="Formation, expériences de tutorat, matières maîtrisées, langues…"
              value={cv}
              onChange={(e) => setCv(e.target.value)}
            />
          </div>
          {updateProfile.isError ? (
            <p className="text-sm text-danger" role="alert">
              {(updateProfile.error as Error).message}
            </p>
          ) : null}
          {saveSuccess ? (
            <p className="text-sm text-success" role="status">
              CV texte enregistré.
            </p>
          ) : null}
          <Button
            size="sm"
            disabled={updateProfile.isPending || !canSaveText}
            onClick={() => void saveCv()}
          >
            {updateProfile.isPending ? "Enregistrement…" : "Enregistrer le texte"}
          </Button>
          {cv.trim().length > 0 && cv.trim().length < 50 ? (
            <p className="text-xs text-ink-400">
              Minimum 50 caractères pour le texte, ou déposez un PDF.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
