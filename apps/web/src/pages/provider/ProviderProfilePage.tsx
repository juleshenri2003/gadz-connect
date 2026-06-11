import { useEffect, useRef, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from "@gadz-connect/ui";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/format";
import { isStudent } from "@/features/auth/roles";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  useDeleteCvPdf,
  useMyCvPdfUrl,
  useUploadCvPdf,
} from "@/features/cv/useCvPdf";
import { useUpdateTutorProfile } from "@/features/marketplace/useTutors";

export function ProviderProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateTutorProfile();
  const uploadPdf = useUploadCvPdf();
  const deletePdf = useDeleteCvPdf();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cv, setCv] = useState("");

  const hasPdf = Boolean(profile?.cv_pdf_path);
  const { data: pdfUrl } = useMyCvPdfUrl(hasPdf);

  useEffect(() => {
    setCv(profile?.cv ?? "");
  }, [profile?.cv]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement du profil…</p>;
  }

  if (isError || !profile) {
    return (
      <p className="text-sm text-red-600">Impossible de charger votre profil</p>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const student = isStudent(profile.role);
  const textCvValid = cv.trim().length === 0 || cv.trim().length >= 50;
  const canSaveText = textCvValid && (cv.trim().length >= 50 || hasPdf);

  const fields = student
    ? [
        ["E-mail", user?.email],
        ["Rôle", ROLE_LABELS[profile.role]],
        ["Campus", profile.campus?.name],
        ["Statut", "Compte élève actif"],
      ]
    : [
        ["E-mail", user?.email],
        ["Rôle", ROLE_LABELS[profile.role]],
        ["Campus", profile.campus?.name],
        ["Statut", STATUS_LABELS[profile.account_status]],
        ["SIRET", profile.siret ?? "Non renseigné"],
        ["Activité", profile.micro_enterprise_activity ?? "—"],
        ["Périodicité URSSAF", profile.urssaf_periodicity ?? "—"],
        [
          "Versement libératoire",
          profile.versement_liberatoire ? "Oui" : "Non",
        ],
      ];

  async function saveCv() {
    await updateProfile.mutateAsync({ cv: cv.trim() });
  }

  async function onPdfSelected(file: File | undefined) {
    if (!file) return;
    await uploadPdf.mutateAsync(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mon profil</h2>
        <p className="mt-1 text-sm text-slate-600">
          {student
            ? "Votre compte élève — pas de micro-entreprise requise"
            : "Informations de votre compte prestataire"}
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">{fullName || user?.email}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {value ?? "—"}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {!student ? (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Mon CV</CardTitle>
            <p className="text-sm text-slate-500">
              Texte et/ou PDF — visible par les élèves lors du choix d&apos;un
              professeur.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">CV en PDF</p>
                <p className="mt-1 text-xs text-slate-500">
                  Déposez votre CV au format PDF (max. 5 Mo). Un seul fichier à
                  la fois — le précédent est remplacé.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700"
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
                <p className="text-sm text-red-600" role="alert">
                  {(uploadPdf.error as Error).message}
                </p>
              ) : null}
              {uploadPdf.isSuccess ? (
                <p className="text-sm text-green-700" role="status">
                  CV PDF enregistré.
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="profile-cv">
                  CV texte (complément ou alternative)
                </Label>
                <textarea
                  id="profile-cv"
                  rows={8}
                  className="w-full rounded-md border border-slate-200 p-3 text-sm"
                  placeholder="Formation, expériences de tutorat, matières maîtrisées, langues…"
                  value={cv}
                  onChange={(e) => setCv(e.target.value)}
                />
              </div>
              {updateProfile.isError ? (
                <p className="text-sm text-red-600" role="alert">
                  {(updateProfile.error as Error).message}
                </p>
              ) : null}
              {updateProfile.isSuccess ? (
                <p className="text-sm text-green-700" role="status">
                  CV texte enregistré.
                </p>
              ) : null}
              <Button
                size="sm"
                disabled={updateProfile.isPending || !canSaveText}
                onClick={() => void saveCv()}
              >
                {updateProfile.isPending
                  ? "Enregistrement…"
                  : "Enregistrer le texte"}
              </Button>
              {cv.trim().length > 0 && cv.trim().length < 50 ? (
                <p className="text-xs text-slate-500">
                  Minimum 50 caractères pour le texte, ou déposez un PDF.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
