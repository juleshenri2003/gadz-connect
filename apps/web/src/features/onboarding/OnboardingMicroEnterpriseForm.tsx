import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Input,
  Label,
} from "@gadz-connect/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { FiscalQuestionnaireRecap } from "@/features/onboarding/FiscalQuestionnaireRecap";
import { FiscalProfileStep } from "@/features/onboarding/FiscalProfileStep";
import {
  DEFAULT_MICRO_ENTERPRISE_ACTIVITY,
  hasValidSiret,
  isQuestionnaireEditable,
} from "@/features/onboarding/fiscalLabels";
import { MicroEnterpriseAlerts } from "@/features/onboarding/MicroEnterpriseAlerts";
import { MicroEnterpriseTimeline } from "@/features/onboarding/MicroEnterpriseTimeline";
import { MicroEnterpriseWizardStepper } from "@/features/onboarding/MicroEnterpriseWizardStepper";
import {
  getPrimaryRecapCta,
  isMicroEnterpriseRecapView,
  type MicroStep,
} from "@/features/onboarding/microEnterprisePageUtils";
import {
  inferRegistrationPath,
  registrationPathToStatus,
} from "@/features/onboarding/registrationPath";
import {
  INPI_GUIDE_SECTION_ID,
  MicroEnterpriseInpiGuidePanel,
} from "@/features/onboarding/MicroEnterpriseInpiGuidePanel";
import { SiretSubmissionForm } from "@/features/onboarding/SiretSubmissionForm";
import { MicroEnterpriseAddressForm } from "@/features/onboarding/MicroEnterpriseAddressForm";
import { MicroEnterpriseValidatedPanel } from "@/features/onboarding/MicroEnterpriseValidatedPanel";
import { WrongProfileLink } from "@/features/onboarding/WrongProfileContact";
import { saveOnboardingToProfile } from "./api";
import {
  onboardingFullSchema,
  type OnboardingFormValues,
} from "./schemas";

const STEPS = [
  { id: 1, title: "Situation", description: "SIRET existant ou en cours" },
  { id: 2, title: "URSSAF", description: "Périodicité des déclarations" },
  { id: 3, title: "Fiscalité", description: "Profil URSSAF et simulation net" },
] as const;

type OnboardingLocationState = {
  registrationStatus?: "already_registered" | "awaiting_registration";
};

interface RecapPanelProps {
  profile: NonNullable<ReturnType<typeof useMyProfile>["data"]>;
  questionnaireEditable: boolean;
}

function RecapPanel({
  profile,
  questionnaireEditable,
}: RecapPanelProps) {
  const cta = getPrimaryRecapCta(profile);
  const isPendingSiret = profile.account_status === "pending_siret";
  const canDeclareSiret = isPendingSiret && !hasValidSiret(profile.siret);
  const inpiSent = Boolean(profile.inpi_declaration_sent_at);

  const registrationPath = inferRegistrationPath(profile);
  const showInpiGuide = registrationPath === "new_micro";
  const inpiPending = showInpiGuide && !inpiSent;
  const showActionAside = !inpiPending;

  const primaryCta =
    showInpiGuide && cta.primary.href.includes("#inpi-guide") ? null : cta.primary;
  const secondaryCta =
    showInpiGuide && cta.secondary?.href.includes("#inpi-guide")
      ? null
      : cta.secondary;

  const hasActionAside =
    showActionAside && Boolean(primaryCta || secondaryCta || canDeclareSiret);

  return (
    <div className="space-y-6">
      <div
        className={
          hasActionAside
            ? "grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start"
            : undefined
        }
      >
        <FiscalQuestionnaireRecap
          profile={profile}
          editable={questionnaireEditable}
        />
        {hasActionAside ? (
          <div className="space-y-4 rounded-md border border-brand-100 bg-brand-50/50 p-5 shadow-surface sm:p-6">
            <MicroEnterpriseAlerts profile={profile} />
            <div className="flex flex-wrap gap-3">
              {primaryCta ? (
                canDeclareSiret || primaryCta.href.includes("siret") ? (
                  <Button asChild>
                    <Link to={primaryCta.href}>{primaryCta.label}</Link>
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link to={primaryCta.href}>{primaryCta.label}</Link>
                  </Button>
                )
              ) : null}
              {secondaryCta ? (
                <Button variant="outline" asChild>
                  <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {showInpiGuide ? (
        <MicroEnterpriseInpiGuidePanel profile={profile} />
      ) : profile.micro_enterprise_activity ? (
        <MicroEnterpriseAddressForm
          existingAddress={profile.micro_enterprise_address}
        />
      ) : null}
    </div>
  );
}

export function OnboardingMicroEnterpriseForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get("step") as MicroStep | null;
  const isEditMode =
    stepParam === "questionnaire" && searchParams.get("edit") === "1";

  const prefilledStatus = (location.state as OnboardingLocationState | null)
    ?.registrationStatus;
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [submittedSiret, setSubmittedSiret] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questionnaireDone = Boolean(profile?.micro_enterprise_activity);
  const isActive = profile?.account_status === "active";
  const isPendingSiret = profile?.account_status === "pending_siret";
  const questionnaireEditable = Boolean(
    profile && isQuestionnaireEditable(profile),
  );

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFullSchema),
    defaultValues: {
      registrationStatus: undefined,
      siret: "",
      activity: DEFAULT_MICRO_ENTERPRISE_ACTIVITY,
      urssafPeriodicity: "quarterly",
      versementLiberatoire: false,
      statusAcre: false,
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
  const statusAcre = watch("statusAcre");
  const alreadyRegistered = registrationStatus === "already_registered";
  const lockedRegistrationPath = profile?.registration_path ?? null;

  useEffect(() => {
    if (!profile?.registration_path) return;
    form.setValue(
      "registrationStatus",
      registrationPathToStatus(inferRegistrationPath(profile)),
      { shouldValidate: true },
    );
  }, [profile, form]);

  useEffect(() => {
    if (!prefilledStatus || lockedRegistrationPath) return;
    form.setValue("registrationStatus", prefilledStatus, {
      shouldValidate: true,
    });
  }, [prefilledStatus, lockedRegistrationPath, form]);

  useEffect(() => {
    if (!profile || !isEditMode) return;

    form.reset({
      registrationStatus: registrationPathToStatus(inferRegistrationPath(profile)),
      siret: "",
      activity:
        (profile.micro_enterprise_activity as typeof DEFAULT_MICRO_ENTERPRISE_ACTIVITY) ??
        DEFAULT_MICRO_ENTERPRISE_ACTIVITY,
      urssafPeriodicity:
        profile.urssaf_periodicity === "monthly" ? "monthly" : "quarterly",
      versementLiberatoire: profile.versement_liberatoire,
      statusAcre: profile.status_acre ?? false,
    });
  }, [profile, isEditMode, form]);

  useEffect(() => {
    if (stepParam !== "guide") return;
    requestAnimationFrame(() => {
      document
        .getElementById(INPI_GUIDE_SECTION_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [stepParam, profile?.id]);

  async function goNext() {
    const fieldsByStep: (keyof OnboardingFormValues)[][] = [
      ["registrationStatus", "siret"],
      ["urssafPeriodicity"],
      ["versementLiberatoire", "statusAcre"],
    ];
    const valid = await trigger(fieldsByStep[step - 1]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
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
    await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    if (accountStatus === "active") {
      setSubmittedSiret(values.siret?.replace(/\s/g, "") ?? null);
      navigate("/app", { replace: true });
      return;
    }
    navigate("/app/micro-entreprise", { replace: true });
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (event.target instanceof HTMLTextAreaElement) return;

    if (step < STEPS.length) {
      event.preventDefault();
      void goNext();
      return;
    }

    // Étape fiscalité : Entrée ne doit pas enregistrer le questionnaire.
    event.preventDefault();
  }

  function submitQuestionnaire() {
    void handleSubmit(onSubmit)();
  }

  const pageShell = (content: ReactNode) => (
    <div className="w-full space-y-6">
      {profile && !isActive ? (
        <MicroEnterpriseTimeline profile={profile} stepParam={stepParam} />
      ) : null}
      {content}
    </div>
  );

  if (profileLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-ink-400">
          Chargement de votre profil…
        </CardContent>
      </Card>
    );
  }

  if (isActive && questionnaireDone && !stepParam) {
    return pageShell(
      <Card className="w-full">
        <CardContent className="px-6 py-8 sm:px-8">
          {profile ? (
            <MicroEnterpriseValidatedPanel
              profile={profile}
              submittedSiret={submittedSiret}
            />
          ) : null}
        </CardContent>
      </Card>,
    );
  }

  if (stepParam === "guide" && !questionnaireDone) {
    return pageShell(
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-3 px-6 py-6 sm:px-8">
            <p className="text-sm text-ink-600">
              Pour valider votre parcours, complétez d&apos;abord le
              questionnaire fiscal. Vous pouvez consulter le guide INPI
              ci-dessous en parallèle.
            </p>
            <Button size="sm" asChild>
              <Link to="/app/micro-entreprise?step=questionnaire">
                Remplir le questionnaire
              </Link>
            </Button>
          </CardContent>
        </Card>
        <MicroEnterpriseInpiGuidePanel profile={profile} />
      </div>,
    );
  }

  if (stepParam === "siret") {
    return pageShell(
      <Card className="w-full">
        <CardContent className="space-y-6 px-6 py-8 sm:px-8">
          {profile ? <MicroEnterpriseAlerts profile={profile} /> : null}
          {isPendingSiret ? (
            <SiretSubmissionForm
              existingSiret={profile?.siret}
              accountStatus={profile?.account_status}
              siretVerificationFailed={profile?.siret_verification_failed}
            />
          ) : (
            <div className="space-y-3 rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink-600">
              <p>
                Complétez d&apos;abord le questionnaire fiscal pour pouvoir
                déclarer votre SIRET.
              </p>
              <Button size="sm" asChild>
                <Link to="/app/micro-entreprise?step=questionnaire">
                  Remplir le questionnaire
                </Link>
              </Button>
            </div>
          )}
          {profile &&
          profile.micro_enterprise_activity &&
          (hasValidSiret(profile.siret) ||
            profile.account_status === "active" ||
            Boolean(profile.siret?.trim())) ? (
            <MicroEnterpriseAddressForm
              existingAddress={profile.micro_enterprise_address}
            />
          ) : null}
        </CardContent>
      </Card>,
    );
  }

  if (
    isMicroEnterpriseRecapView(profile, stepParam, isEditMode) &&
    profile &&
    !isEditMode
  ) {
    return pageShell(
      <RecapPanel
        profile={profile}
        questionnaireEditable={questionnaireEditable}
      />,
    );
  }

  if (isEditMode && questionnaireDone && !questionnaireEditable) {
    return pageShell(
      <Card>
        <CardContent className="py-8 text-center text-sm text-ink-600">
          Le questionnaire fiscal n&apos;est plus modifiable — votre SIRET a
          déjà été transmis.
        </CardContent>
      </Card>,
    );
  }

  const isEditing = isEditMode && questionnaireDone;
  const showInpiGuideTeaser =
    (lockedRegistrationPath === "new_micro" ||
      registrationStatus === "awaiting_registration") &&
    !alreadyRegistered;

  return pageShell(
    <div className="space-y-6">
      {showInpiGuideTeaser ? (
        <MicroEnterpriseInpiGuidePanel profile={profile} />
      ) : null}
      <Card className="w-full">
        <CardHeader className="px-6 py-6 sm:px-8">
          <CardDescription className="text-base">
            {isEditing
              ? "Ajustez vos réponses tant que votre SIRET n'a pas été déclaré."
              : "Déjà entrepreneur ou en cours d'immatriculation — parcours adapté à votre situation"}
          </CardDescription>
          <MicroEnterpriseWizardStepper steps={STEPS} currentStep={step} />
        </CardHeader>

        <CardContent className="px-6 pb-8 sm:px-8">
          <form
            onSubmit={(event) => event.preventDefault()}
            onKeyDown={handleFormKeyDown}
            className="space-y-6"
          >
            {step === 1 && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Votre situation</legend>
                {lockedRegistrationPath ? (
                  <p className="rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink-600">
                    Parcours choisi lors de votre inscription — contactez le
                    support pour modifier votre situation.
                  </p>
                ) : null}
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 hover:bg-paper has-[:checked]:border-brand-700 has-[:checked]:bg-paper">
                  <input
                    type="radio"
                    value="already_registered"
                    className="mt-1"
                    {...register("registrationStatus")}
                    disabled={Boolean(lockedRegistrationPath)}
                  />
                  <span className="text-sm">
                    <strong>Je possède déjà un SIRET</strong>
                    <br />
                    <span className="text-ink-400">
                      Micro-entreprise déjà immatriculée — activation automatique
                      après saisie du SIRET.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 hover:bg-paper has-[:checked]:border-brand-700 has-[:checked]:bg-paper">
                  <input
                    type="radio"
                    value="awaiting_registration"
                    className="mt-1"
                    {...register("registrationStatus")}
                    disabled={Boolean(lockedRegistrationPath)}
                  />
                  <span className="text-sm">
                    <strong>J&apos;attends mon SIRET INSEE</strong>
                    <br />
                    <span className="text-ink-400">
                      Création en cours — déclarez votre SIRET dès réception
                      pour activer votre compte.
                    </span>
                  </span>
                </label>
                {errors.registrationStatus && (
                  <p className="text-sm text-danger">
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
                      <p className="text-sm text-danger">{errors.siret.message}</p>
                    )}
                  </div>
                )}
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">
                  Périodicité URSSAF
                </legend>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 hover:bg-paper has-[:checked]:border-brand-700 has-[:checked]:bg-paper">
                  <input
                    type="radio"
                    value="quarterly"
                    className="mt-1"
                    {...register("urssafPeriodicity")}
                  />
                  <span className="text-sm">
                    <strong>Trimestrielle (recommandée)</strong>
                    <br />
                    <span className="text-ink-400">
                      Conseil du guide Méthodo — moins de risque d&apos;oubli
                      qu&apos;en mensuel (amende URSSAF possible).
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 hover:bg-paper has-[:checked]:border-brand-700 has-[:checked]:bg-paper">
                  <input
                    type="radio"
                    value="monthly"
                    className="mt-1"
                    {...register("urssafPeriodicity")}
                  />
                  <span className="text-sm">Mensuelle</span>
                </label>
                {errors.urssafPeriodicity && (
                  <p className="text-sm text-danger">
                    {errors.urssafPeriodicity.message}
                  </p>
                )}
              </fieldset>
            )}

            {step === 3 ? (
              <FiscalProfileStep
                register={register}
                statusAcre={Boolean(statusAcre)}
                versementLiberatoire={Boolean(versementLiberatoire)}
                exampleAmount={profile?.hourly_rate}
              />
            ) : null}

            {submitError && (
              <p className="text-sm text-danger" role="alert">
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
              {step < STEPS.length ? (
                <Button type="button" onClick={() => void goNext()}>
                  Continuer
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={submitQuestionnaire}
                >
                  {isEditing
                    ? "Enregistrer les modifications"
                    : alreadyRegistered
                      ? "Valider mon SIRET et continuer"
                      : "Envoyer et retourner au tableau de bord"}
                </Button>
              )}
            </div>
            <WrongProfileLink className="text-center" />
          </form>
        </CardContent>
      </Card>
    </div>,
  );
}
