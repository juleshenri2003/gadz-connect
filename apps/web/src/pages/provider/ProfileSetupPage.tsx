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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  campusDisplayName,
  SELECTED_CAMPUS_KEY,
  sortCampuses,
} from "@/features/campus/campusLabels";
import { WrongProfileLink } from "@/features/onboarding/WrongProfileContact";
import { RH_CONTACT_EMAIL } from "@/features/admin/rhContact";
import { apiFetch } from "@/lib/api";

const accountTypeSchema = z.enum([
  "student",
  "teacher_existing_siret",
  "teacher_awaiting_siret",
]);

const setupSchema = z
  .object({
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().min(1, "Nom requis"),
    campusId: z.string().uuid("Choisissez un campus"),
    accountType: accountTypeSchema,
    microEnterpriseConfirmed: z.boolean().optional(),
    cv: z.string().max(5000).optional(),
  })
  .superRefine((data, ctx) => {
    const isTeacher = data.accountType !== "student";
    if (isTeacher && !data.microEnterpriseConfirmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Gadz'Connect couvre uniquement la micro-entreprise — confirmez votre statut ou contactez le support",
        path: ["microEnterpriseConfirmed"],
      });
    }
    if (isTeacher) {
      const trimmed = data.cv?.trim() ?? "";
      if (trimmed.length < 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Décrivez votre parcours (minimum 50 caractères) — les élèves consulteront ce CV pour vous choisir",
          path: ["cv"],
        });
      }
    }
  });

type SetupForm = z.infer<typeof setupSchema>;

const ACCOUNT_OPTIONS = [
  {
    value: "student" as const,
    title: "Élève",
    description:
      "Je cherche un tutorat — pas de SIRET ni de micro-entreprise.",
    duration: "~5 min",
  },
  {
    value: "teacher_existing_siret" as const,
    title: "Professeur — déjà entrepreneur",
    description:
      "J'ai déjà un SIRET (micro-entreprise ou activité immatriculée).",
    duration: "Parcours express · ~15 min",
  },
  {
    value: "teacher_awaiting_siret" as const,
    title: "Professeur — en cours d'immatriculation",
    description:
      "Je crée ma micro-entreprise (auto-entrepreneur) et j'attends mon SIRET.",
    duration: "Parcours complet · ~2 semaines",
  },
];

const CV_PLACEHOLDER = `Exemple :
• Formation : Arts et Métiers — spécialité mécanique (promo 20XX)
• Expériences : 2 ans de tutorat en maths et physique
• Compétences : SolidWorks, Python, accompagnement projet
• Langues : français (natif), anglais (B2)`;

export function ProfileSetupPage() {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: campuses, isLoading } = useQuery({
    queryKey: ["campus"],
    queryFn: () =>
      apiFetch<{ data: { id: string; name: string }[] }>("/api/campus"),
  });

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      campusId: sessionStorage.getItem(SELECTED_CAMPUS_KEY) ?? "",
    },
  });

  const accountType = watch("accountType");
  const isTeacher = accountType && accountType !== "student";

  async function goToIdentity() {
    const valid = await trigger(["accountType", "microEnterpriseConfirmed"]);
    if (valid) setStep(2);
  }

  async function goToCv() {
    const valid = await trigger(["firstName", "lastName", "campusId"]);
    if (!valid) return;
    if (isTeacher) {
      setStep(3);
      return;
    }
    await handleSubmit(onSubmit)();
  }

  async function onSubmit(values: SetupForm) {
    const token = getAccessToken();
    if (!token) return;

    const role =
      values.accountType === "student" ? "student_provider" : "teacher";

    try {
      const registrationPath =
        values.accountType === "teacher_existing_siret"
          ? "existing_siret"
          : "new_micro";

      await apiFetch("/api/profile/setup", {
        method: "PATCH",
        token,
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          campusId: values.campusId,
          role,
          ...(role === "teacher"
            ? { cv: values.cv?.trim(), registrationPath }
            : {}),
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });

      if (values.accountType === "student") {
        navigate("/app", { replace: true });
        return;
      }

      const registrationStatus =
        values.accountType === "teacher_existing_siret"
          ? "already_registered"
          : "awaiting_registration";

      navigate("/app/micro-entreprise", {
        replace: true,
        state: { registrationStatus },
      });
    } catch (err) {
      setError("root", { message: (err as Error).message });
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Bienvenue</h2>
        <p className="mt-1 text-sm text-ink-600">
          Choisissez votre parcours pour accéder à Gadz&apos;Connect
        </p>
      </div>

      <Card className="border-line">
        <CardHeader>
          <CardTitle>
            {step === 1
              ? "Qui êtes-vous ?"
              : step === 2
                ? "Vos informations"
                : "Votre CV"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Élève ou intervenant — le parcours s'adapte à votre situation."
              : step === 2
                ? "Prénom, nom et campus Arts et Métiers."
                : "Présentez votre parcours — les élèves le consulteront avant de réserver."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 ? (
              <>
                <fieldset className="space-y-2">
                  <legend className="sr-only">Type de compte</legend>
                  {ACCOUNT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 hover:bg-paper has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50/50"
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        className="mt-1"
                        {...register("accountType")}
                      />
                      <span className="text-sm">
                        <strong>{opt.title}</strong>
                        <br />
                        <span className="text-ink-400">{opt.description}</span>
                        <br />
                        <span className="text-xs font-medium text-brand-600">
                          {opt.duration}
                        </span>
                      </span>
                    </label>
                  ))}
                  {isTeacher ? (
                    <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        {...register("microEnterpriseConfirmed")}
                      />
                      <span className="text-sm text-ink-600">
                        Je confirme exercer (ou créer) une activité en{" "}
                        <strong>micro-entreprise / auto-entrepreneur</strong>.
                        Autres statuts juridiques :{" "}
                        <a
                          href={`mailto:${RH_CONTACT_EMAIL}`}
                          className="text-brand-600 underline"
                        >
                          contactez le support
                        </a>
                        .
                      </span>
                    </label>
                  ) : null}
                  {errors.microEnterpriseConfirmed ? (
                    <p className="text-sm text-danger">
                      {errors.microEnterpriseConfirmed.message}
                    </p>
                  ) : null}
                  {errors.accountType ? (
                    <p className="text-sm text-danger">
                      {errors.accountType.message}
                    </p>
                  ) : null}
                </fieldset>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void goToIdentity()}
                >
                  Continuer →
                </Button>
              </>
            ) : step === 2 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" {...register("firstName")} />
                    {errors.firstName ? (
                      <p className="text-sm text-danger">
                        {errors.firstName.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" {...register("lastName")} />
                    {errors.lastName ? (
                      <p className="text-sm text-danger">
                        {errors.lastName.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campusId">Campus / ville</Label>
                  <select
                    id="campusId"
                    className="flex h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
                    {...register("campusId")}
                    disabled={isLoading}
                  >
                    <option value="">Sélectionner…</option>
                    {(campuses?.data ? sortCampuses(campuses.data) : []).map(
                      (c) => (
                        <option key={c.id} value={c.id}>
                          {campusDisplayName(c.name)}
                        </option>
                      ),
                    )}
                  </select>
                  <p className="text-xs text-ink-400">
                    Pré-rempli depuis la page de connexion — modifiable si besoin.
                  </p>
                  {errors.campusId ? (
                    <p className="text-sm text-danger">
                      {errors.campusId.message}
                    </p>
                  ) : null}
                </div>

                {isTeacher ? (
                  <p className="rounded-lg bg-paper p-3 text-xs text-ink-600">
                    Étape suivante : rédaction de votre CV (visible par les
                    élèves), puis onboarding micro-entreprise.
                  </p>
                ) : null}

                {errors.root ? (
                  <p className="text-sm text-danger">{errors.root.message}</p>
                ) : null}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Retour
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={isSubmitting}
                    onClick={() => void goToCv()}
                  >
                    {isTeacher
                      ? "Continuer vers le CV →"
                      : isSubmitting
                        ? "Enregistrement…"
                        : "Accéder à mon espace →"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cv">CV — parcours et compétences</Label>
                  <textarea
                    id="cv"
                    rows={10}
                    className="w-full rounded-md border border-line p-3 text-sm"
                    placeholder={CV_PLACEHOLDER}
                    {...register("cv")}
                  />
                  <p className="text-xs text-ink-400">
                    Formation, expériences de tutorat ou professionnelles,
                    matières maîtrisées, langues… Les élèves pourront lire ce
                    CV avant de réserver un créneau.
                  </p>
                  {errors.cv ? (
                    <p className="text-sm text-danger">{errors.cv.message}</p>
                  ) : null}
                </div>

                {accountType === "teacher_existing_siret" ? (
                  <p className="rounded-lg bg-paper p-3 text-xs text-ink-600">
                    Ensuite : saisie de votre SIRET et paramètres
                    micro-entreprise.
                  </p>
                ) : accountType === "teacher_awaiting_siret" ? (
                  <p className="rounded-lg bg-paper p-3 text-xs text-ink-600">
                    Ensuite : questionnaire micro-entreprise et guide INPI.
                  </p>
                ) : null}

                {errors.root ? (
                  <p className="text-sm text-danger">{errors.root.message}</p>
                ) : null}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enregistrement…" : "Accéder à mon espace →"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
      <WrongProfileLink className="text-center" />
    </div>
  );
}
