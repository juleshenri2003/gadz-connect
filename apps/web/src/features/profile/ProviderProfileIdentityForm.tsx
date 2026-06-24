import {
  Button,
  Input,
  Label,
  cn,
} from "@gadz-connect/ui";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { useUpdateProfileIdentity } from "@/features/auth/useMyProfile";
import {
  campusDisplayName,
} from "@/features/campus/campusLabels";
import { useCampusOptions } from "@/features/campus/useCampusOptions";

interface ProviderProfileIdentityFormProps {
  profile: MyProfile;
  email: string | undefined;
  className?: string;
  variant?: "student" | "teacher";
}

export function ProviderProfileIdentityForm({
  profile,
  email,
  className,
  variant = "teacher",
}: ProviderProfileIdentityFormProps) {
  const updateIdentity = useUpdateProfileIdentity();
  const { campuses: sortedCampuses, isLoading: campusesLoading } =
    useCampusOptions();
  const isStudentVariant = variant === "student";

  useEffect(() => {
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setCampusId(profile.campus_id);
  }, [profile.first_name, profile.last_name, profile.campus_id]);

  useEffect(() => {
    if (!updateIdentity.isSuccess) return;
    setSaveSuccess(true);
    const timer = window.setTimeout(() => setSaveSuccess(false), 4000);
    return () => window.clearTimeout(timer);
  }, [updateIdentity.isSuccess]);

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const isDirty =
    trimmedFirst !== profile.first_name.trim() ||
    trimmedLast !== profile.last_name.trim() ||
    campusId !== profile.campus_id;
  const isValid = trimmedFirst.length > 0 && trimmedLast.length > 0;
  const campusChanged = campusId !== profile.campus_id;
  const selectedCampusName =
    sortedCampuses.find((c) => c.id === campusId)?.name ?? null;

  async function performSave() {
    setSaveError(null);
    setSaveSuccess(false);
    if (!isValid) {
      setSaveError("Prénom et nom sont obligatoires.");
      return;
    }

    try {
      await updateIdentity.mutateAsync({
        firstName: trimmedFirst !== profile.first_name.trim() ? trimmedFirst : undefined,
        lastName: trimmedLast !== profile.last_name.trim() ? trimmedLast : undefined,
        campusId: campusChanged ? campusId : undefined,
      });
      setCampusConfirmOpen(false);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }

  function handleSaveClick() {
    if (campusChanged) {
      setCampusConfirmOpen(true);
      return;
    }
    void performSave();
  }

  return (
    <>
      <section className={cn("space-y-4", className)}>
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Identité</h3>
          <p className="mt-0.5 text-sm text-ink-400">
            {isStudentVariant
              ? "Votre nom tel qu'il apparaît sur vos réservations."
              : "Modifiez votre nom et votre campus si besoin."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-first-name">Prénom</Label>
            <Input
              id="profile-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-last-name">Nom</Label>
            <Input
              id="profile-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
            />
          </div>

          {!isStudentVariant ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">E-mail</Label>
                <Input
                  id="profile-email"
                  value={email ?? ""}
                  readOnly
                  disabled
                  className="bg-paper text-ink-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-role">Rôle</Label>
                <Input
                  id="profile-role"
                  value={ROLE_LABELS[profile.role]}
                  readOnly
                  disabled
                  className="bg-paper text-ink-600"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="profile-campus">Campus</Label>
            <select
              id="profile-campus"
              className="flex h-10 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
              value={campusId}
              disabled={campusesLoading || sortedCampuses.length === 0}
              onChange={(event) => setCampusId(event.target.value)}
            >
              {sortedCampuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campusDisplayName(campus.name)}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-400">
              {isStudentVariant
                ? "Les tuteurs affichés dépendent de votre campus. En cas de changement, vérifiez vos réservations en cours."
                : "Pré-rempli depuis la page de connexion — modifiable si besoin."}
            </p>
          </div>
        </div>

        {campusChanged ? (
          <div
            className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
            role="status"
          >
            Vous changez de campus
            {selectedCampusName
              ? ` pour ${campusDisplayName(selectedCampusName)}`
              : ""}
            . Les professeurs proposés et vos créneaux peuvent être affectés.
          </div>
        ) : null}

        {saveError ? (
          <p className="text-sm text-danger" role="alert">
            {saveError}
          </p>
        ) : null}
        {saveSuccess ? (
          <p className="text-sm text-success" role="status">
            Identité enregistrée.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!isDirty || !isValid || updateIdentity.isPending}
            onClick={() => void handleSaveClick()}
          >
            {updateIdentity.isPending ? "Enregistrement…" : "Enregistrer l'identité"}
          </Button>
          {isDirty ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={updateIdentity.isPending}
              onClick={() => {
                setFirstName(profile.first_name);
                setLastName(profile.last_name);
                setCampusId(profile.campus_id);
                setSaveError(null);
                setCampusConfirmOpen(false);
              }}
            >
              Annuler
            </Button>
          ) : null}
        </div>
      </section>

      <Modal
        open={campusConfirmOpen}
        onClose={() => setCampusConfirmOpen(false)}
        title="Confirmer le changement de campus"
        description="Cette action modifie les tuteurs visibles sur la marketplace et peut impacter vos réservations."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={updateIdentity.isPending}
              onClick={() => setCampusConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={updateIdentity.isPending}
              onClick={() => void performSave()}
            >
              {updateIdentity.isPending ? "Enregistrement…" : "Confirmer"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-600">
          Vous allez passer au campus{" "}
          <strong>
            {selectedCampusName
              ? campusDisplayName(selectedCampusName)
              : "sélectionné"}
          </strong>
          . Vérifiez votre emploi du temps après l&apos;enregistrement.
        </p>
      </Modal>
    </>
  );
}
