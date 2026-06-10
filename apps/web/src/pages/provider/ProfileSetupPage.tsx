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
import { apiFetch } from "@/lib/api";

const accountTypeSchema = z.enum([
  "student",
  "teacher_existing_siret",
  "teacher_awaiting_siret",
]);

const setupSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  campusId: z.string().uuid("Choisissez un campus"),
  accountType: accountTypeSchema,
});

type SetupForm = z.infer<typeof setupSchema>;

const ACCOUNT_OPTIONS = [
  {
    value: "student" as const,
    title: "Élève",
    description:
      "Je cherche un tutorat — pas de SIRET ni de micro-entreprise.",
  },
  {
    value: "teacher_existing_siret" as const,
    title: "Professeur — déjà entrepreneur",
    description:
      "J'ai déjà un SIRET (micro-entreprise ou activité immatriculée).",
  },
  {
    value: "teacher_awaiting_siret" as const,
    title: "Professeur — en cours d'immatriculation",
    description:
      "Je crée ma micro-entreprise (auto-entrepreneur) et j'attends mon SIRET.",
  },
];

export function ProfileSetupPage() {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);

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
  });

  const accountType = watch("accountType");

  async function goToIdentity() {
    const valid = await trigger("accountType");
    if (valid) setStep(2);
  }

  async function onSubmit(values: SetupForm) {
    const token = getAccessToken();
    if (!token) return;

    const role =
      values.accountType === "student" ? "student_provider" : "teacher";

    try {
      await apiFetch("/api/profile/setup", {
        method: "PATCH",
        token,
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          campusId: values.campusId,
          role,
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
        <h2 className="text-2xl font-bold text-slate-900">Bienvenue</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choisissez votre parcours pour accéder à Gadz&apos;Connect
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>
            {step === 1 ? "Qui êtes-vous ?" : "Vos informations"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Élève ou intervenant — le parcours s'adapte à votre situation."
              : "Prénom, nom et campus Arts et Métiers."}
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
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50"
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
                        <span className="text-slate-500">{opt.description}</span>
                      </span>
                    </label>
                  ))}
                  {errors.accountType ? (
                    <p className="text-sm text-red-600">
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
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" {...register("firstName")} />
                    {errors.firstName ? (
                      <p className="text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" {...register("lastName")} />
                    {errors.lastName ? (
                      <p className="text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campusId">Campus</Label>
                  <select
                    id="campusId"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    {...register("campusId")}
                    disabled={isLoading}
                  >
                    <option value="">Sélectionner…</option>
                    {campuses?.data.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.campusId ? (
                    <p className="text-sm text-red-600">
                      {errors.campusId.message}
                    </p>
                  ) : null}
                </div>

                {accountType && accountType !== "student" ? (
                  <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    {accountType === "teacher_existing_siret"
                      ? "Étape suivante : saisie de votre SIRET et paramètres micro-entreprise."
                      : "Étape suivante : questionnaire micro-entreprise et documents INPI / ACRE."}
                  </p>
                ) : null}

                {errors.root ? (
                  <p className="text-sm text-red-600">{errors.root.message}</p>
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
    </div>
  );
}
