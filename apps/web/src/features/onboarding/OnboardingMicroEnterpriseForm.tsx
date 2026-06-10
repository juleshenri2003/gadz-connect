import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@gadz-connect/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { OnboardingAccompanimentGuide } from "@/features/onboarding/OnboardingAccompanimentGuide";
import { OnboardingDocumentsPanel } from "@/features/onboarding/OnboardingDocumentsPanel";
import { SiretSubmissionForm } from "@/features/onboarding/SiretSubmissionForm";
import { StripeConnectPanel } from "@/features/stripe/StripeConnectPanel";
import { saveOnboardingToProfile } from "./api";
import {
  onboardingFullSchema,
  type OnboardingFormValues,
} from "./schemas";

const STEPS = [
  { id: 1, title: "Situation", description: "SIRET existant ou en cours" },
  { id: 2, title: "Activité", description: "Type d'activité micro-entreprise" },
  { id: 3, title: "URSSAF", description: "Périodicité des déclarations" },
  { id: 4, title: "Fiscalité", description: "Option versement libératoire" },
] as const;

const ACTIVITY_OPTIONS = [
  { value: "enseignement", label: "Enseignement / cours particuliers" },
  { value: "conseil", label: "Conseil et accompagnement" },
  {
    value: "prestation_intellectuelle",
    label: "Prestation intellectuelle (BNC)",
  },
] as const;

type PostSubmitView = "form" | "active" | "pending_siret";

type OnboardingLocationState = {
  registrationStatus?: "already_registered" | "awaiting_registration";
};

export function OnboardingMicroEnterpriseForm() {
  const location = useLocation();
  const prefilledStatus = (location.state as OnboardingLocationState | null)
    ?.registrationStatus;
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [step, setStep] = useState(1);
  const [postSubmit, setPostSubmit] = useState<PostSubmitView>("form");
  const [submittedSiret, setSubmittedSiret] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFullSchema),
    defaultValues: {
      registrationStatus: undefined,
      siret: "",
      activity: undefined,
      urssafPeriodicity: "quarterly",
      versementLiberatoire: false,
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const registrationStatus = watch("registrationStatus");
  const versementLiberatoire = watch("versementLiberatoire");
  const alreadyRegistered = registrationStatus === "already_registered";

  useEffect(() => {
    if (!prefilledStatus) return;
    form.setValue("registrationStatus", prefilledStatus, {
      shouldValidate: true,
    });
  }, [prefilledStatus, form]);

  useEffect(() => {
    if (!profile?.micro_enterprise_activity) return;
    if (profile.account_status === "active") {
      setPostSubmit("active");
    } else if (profile.account_status === "pending_siret") {
      setPostSubmit("pending_siret");
    }
  }, [profile]);

  async function goNext() {
    const fieldsByStep: (keyof OnboardingFormValues)[][] = [
      ["registrationStatus", "siret"],
      ["activity"],
      ["urssafPeriodicity"],
      ["versementLiberatoire"],
    ];
    const valid = await trigger(fieldsByStep[step - 1]);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit(values: OnboardingFormValues) {
    setSubmitError(null);
    const { error, accountStatus } = await saveOnboardingToProfile(values);
    if (error) {
      setSubmitError(error);
      return;
    }
    if (accountStatus === "active") {
      setSubmittedSiret(values.siret?.replace(/\s/g, "") ?? null);
      setPostSubmit("active");
    } else {
      setPostSubmit("pending_siret");
    }
  }

  if (profileLoading) {
    return (
      <Card className="w-full max-w-xl">
        <CardContent className="py-8 text-center text-sm text-slate-500">
          Chargement de votre profil…
        </CardContent>
      </Card>
    );
  }

  if (postSubmit === "active") {
    return (
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Compte micro-entreprise validé</CardTitle>
          <CardDescription>
            Votre SIRET est enregistré — vous pouvez proposer des cours et
            configurer vos paiements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900"
            role="status"
          >
            Statut : <strong>Validé (active)</strong>
            {(submittedSiret ?? profile?.siret) ? (
              <>
                <br />
                SIRET : <strong>{submittedSiret ?? profile?.siret}</strong>
              </>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">
            Configurez Stripe Connect pour recevoir vos virements.
          </p>
          <StripeConnectPanel />
        </CardContent>
      </Card>
    );
  }

  if (postSubmit === "pending_siret") {
    return (
      <div className="w-full max-w-3xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>En attente de votre SIRET</CardTitle>
            <CardDescription>
              Votre questionnaire est enregistré. Suivez le guide ci-dessous sur
              le Guichet Unique INPI, puis revenez saisir votre numéro SIRET
              (délai INSEE habituel : 1 à 4 semaines).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              role="status"
            >
              Statut du compte : <strong>En attente SIRET</strong>
            </div>
            <SiretSubmissionForm existingSiret={profile?.siret} />
            {!profile?.siret ? (
              <p className="text-xs text-slate-500">
                Une fois votre SIRET déclaré, l&apos;équipe RH validera votre
                compte. Les paiements Stripe seront disponibles après activation.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <OnboardingAccompanimentGuide showInpiGuide />
        <OnboardingDocumentsPanel />
      </div>
    );
  }

  const showCompactGuide =
    registrationStatus === "awaiting_registration" && step >= 1;

  return (
    <div className="w-full max-w-3xl space-y-8">
    {showCompactGuide ? (
      <OnboardingAccompanimentGuide showInpiGuide={false} />
    ) : null}
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Onboarding micro-entreprise</CardTitle>
        <CardDescription>
          Déjà entrepreneur ou en cours d&apos;immatriculation — parcours adapté
          à votre situation
        </CardDescription>
        <ol className="mt-4 flex gap-1">
          {STEPS.map((s) => (
            <li
              key={s.id}
              className={`flex-1 rounded-md px-1 py-1 text-center text-[10px] font-medium sm:text-xs ${
                step === s.id
                  ? "bg-slate-900 text-white"
                  : step > s.id
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {s.title}
            </li>
          ))}
        </ol>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Votre situation</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50">
                <input
                  type="radio"
                  value="already_registered"
                  className="mt-1"
                  {...register("registrationStatus")}
                />
                <span className="text-sm">
                  <strong>Je possède déjà un SIRET</strong>
                  <br />
                  <span className="text-slate-500">
                    Micro-entreprise ou activité déjà immatriculée — accès
                    immédiat après validation.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50">
                <input
                  type="radio"
                  value="awaiting_registration"
                  className="mt-1"
                  {...register("registrationStatus")}
                />
                <span className="text-sm">
                  <strong>J&apos;attends mon SIRET INSEE</strong>
                  <br />
                  <span className="text-slate-500">
                    Création en cours — statut en attente jusqu&apos;à
                    validation RH.
                  </span>
                </span>
              </label>
              {errors.registrationStatus && (
                <p className="text-sm text-red-600">
                  {errors.registrationStatus.message}
                </p>
              )}
              {alreadyRegistered && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="siret">Numéro SIRET (14 chiffres)</Label>
                  <Input
                    id="siret"
                    inputMode="numeric"
                    placeholder="12345678901234"
                    maxLength={14}
                    {...register("siret")}
                  />
                  {errors.siret && (
                    <p className="text-sm text-red-600">{errors.siret.message}</p>
                  )}
                </div>
              )}
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Activité choisie</legend>
              {ACTIVITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50"
                >
                  <input
                    type="radio"
                    value={opt.value}
                    className="mt-1"
                    {...register("activity")}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
              {errors.activity && (
                <p className="text-sm text-red-600">{errors.activity.message}</p>
              )}
            </fieldset>
          )}

          {step === 3 && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">
                Périodicité URSSAF
              </legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50">
                <input
                  type="radio"
                  value="quarterly"
                  className="mt-1"
                  {...register("urssafPeriodicity")}
                />
                <span className="text-sm">
                  <strong>Trimestrielle (recommandée)</strong>
                  <br />
                  <span className="text-slate-500">
                    Conseil du guide Méthodo — moins de risque d&apos;oubli
                    qu&apos;en mensuel (amende URSSAF possible).
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[:checked]:border-slate-900">
                <input
                  type="radio"
                  value="monthly"
                  {...register("urssafPeriodicity")}
                />
                <span className="text-sm">Mensuelle</span>
              </label>
              {errors.urssafPeriodicity && (
                <p className="text-sm text-red-600">
                  {errors.urssafPeriodicity.message}
                </p>
              )}
            </fieldset>
          )}

          {step === 4 && (
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium">Option fiscale</legend>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="versementLiberatoire">
                    Versement libératoire (+2,2 %)
                  </Label>
                  <p className="mt-1 text-xs text-slate-500">
                    Paiement de l&apos;impôt sur le revenu en même temps que les
                    cotisations URSSAF.
                  </p>
                </div>
                <input
                  id="versementLiberatoire"
                  type="checkbox"
                  className="h-5 w-5"
                  {...register("versementLiberatoire")}
                />
              </div>
              {versementLiberatoire && (
                <p className="text-xs text-slate-600">
                  Sur un cours de 40 € brut, le libératoire représente environ
                  0,77 € (2,2 % de la base après commission).
                </p>
              )}
            </fieldset>
          )}

          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 1}
            >
              Retour
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={() => void goNext()}>
                Continuer
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {alreadyRegistered
                  ? "Valider mon SIRET et continuer"
                  : "Envoyer et attendre le SIRET"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
    {registrationStatus === "awaiting_registration" && step >= 3 ? (
      <p className="text-xs text-slate-500">
        Après envoi, le guide INPI interactif pas à pas s&apos;affichera ici avec
        les alertes arnaques et le volet CFE.
      </p>
    ) : null}
    </div>
  );
}
