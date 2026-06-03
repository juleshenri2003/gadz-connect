import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
} from "@gadz-connect/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { saveOnboardingToProfile } from "./api";
import {
  onboardingFullSchema,
  type OnboardingFormValues,
} from "./schemas";
import { StripeConnectPanel } from "@/features/stripe/StripeConnectPanel";

const STEPS = [
  { id: 1, title: "Activité", description: "Type d'activité micro-entreprise" },
  { id: 2, title: "URSSAF", description: "Périodicité des déclarations" },
  { id: 3, title: "Fiscalité", description: "Option versement libératoire" },
] as const;

const ACTIVITY_OPTIONS = [
  { value: "enseignement", label: "Enseignement / cours particuliers" },
  { value: "conseil", label: "Conseil et accompagnement" },
  {
    value: "prestation_intellectuelle",
    label: "Prestation intellectuelle (BNC)",
  },
] as const;

export function OnboardingMicroEnterpriseForm() {
  const [step, setStep] = useState(1);
  const [awaitingSiret, setAwaitingSiret] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFullSchema),
    defaultValues: {
      activity: undefined,
      urssafPeriodicity: undefined,
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

  const versementLiberatoire = watch("versementLiberatoire");

  async function goNext() {
    const fieldsByStep: (keyof OnboardingFormValues)[][] = [
      ["activity"],
      ["urssafPeriodicity"],
      ["versementLiberatoire"],
    ];
    const valid = await trigger(fieldsByStep[step - 1]);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit(values: OnboardingFormValues) {
    setSubmitError(null);
    const { error } = await saveOnboardingToProfile(values);
    if (error) {
      setSubmitError(error);
      return;
    }
    setAwaitingSiret(true);
  }

  if (awaitingSiret) {
    return (
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>En attente de votre SIRET</CardTitle>
          <CardDescription>
            Votre dossier micro-entreprise a été enregistré. Vous recevrez un
            e-mail dès que votre numéro SIRET sera validé par l&apos;INSEE
            (délai habituel : 1 à 4 semaines).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            role="status"
          >
            Statut du compte : <strong>pending_siret</strong>
          </div>
          <p className="text-sm text-slate-600">
            En attendant, configurez votre compte de paiement Stripe Connect
            pour recevoir vos virements une fois le SIRET validé.
          </p>
          <StripeConnectPanel />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Onboarding micro-entreprise</CardTitle>
        <CardDescription>
          Module 2 — Paramétrage simplifié avant immatriculation
        </CardDescription>
        <ol className="mt-4 flex gap-2">
          {STEPS.map((s) => (
            <li
              key={s.id}
              className={`flex-1 rounded-md px-2 py-1 text-center text-xs font-medium ${
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

          {step === 2 && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">
                Périodicité URSSAF
              </legend>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[:checked]:border-slate-900">
                <input
                  type="radio"
                  value="monthly"
                  {...register("urssafPeriodicity")}
                />
                <span className="text-sm">Mensuelle (recommandée)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[:checked]:border-slate-900">
                <input
                  type="radio"
                  value="quarterly"
                  {...register("urssafPeriodicity")}
                />
                <span className="text-sm">Trimestrielle</span>
              </label>
              {errors.urssafPeriodicity && (
                <p className="text-sm text-red-600">
                  {errors.urssafPeriodicity.message}
                </p>
              )}
            </fieldset>
          )}

          {step === 3 && (
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
            {step < 3 ? (
              <Button type="button" onClick={goNext}>
                Continuer
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                Envoyer et attendre le SIRET
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
