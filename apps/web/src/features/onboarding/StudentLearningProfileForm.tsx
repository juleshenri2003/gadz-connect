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
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OnboardingProgressBar } from "@/features/onboarding/progress/OnboardingProgressBar";
import {
  CLASS_YEAR_OPTIONS,
  LEARNING_FLAG_OPTIONS,
} from "@/features/onboarding/studentLearningProfileOptions";
import type { StudentLearningProfileFormInput } from "@/features/onboarding/useStudentLearningProfile";

const schema = z
  .object({
    classYear: z.string().min(1, "Indiquez votre classe ou promo"),
    studyProgram: z.string().max(120).optional(),
    strongPoints: z
      .string()
      .min(10, "Décrivez vos points forts (10 caractères minimum)"),
    difficulties: z
      .string()
      .min(10, "Décrivez vos difficultés (10 caractères minimum)"),
    learningFlags: z.array(z.string()),
    learningFlagsOther: z.string().max(500).optional(),
    tutoringGoals: z
      .string()
      .min(10, "Décrivez vos objectifs (10 caractères minimum)"),
  })
  .superRefine((data, ctx) => {
    if (data.learningFlags.includes("autre") && !data.learningFlagsOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Précisez votre besoin",
        path: ["learningFlagsOther"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface StudentLearningProfileFormProps {
  defaultValues?: Partial<FormValues>;
  submitLabel?: string;
  onSubmit: (values: StudentLearningProfileFormInput) => Promise<void>;
  showIntro?: boolean;
  /** wizard = 1ère fois ; flat = édition profil déjà rempli */
  variant?: "wizard" | "flat";
  /** Pas de Card externe (déjà dans la page Profil) */
  embedded?: boolean;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: "Parcours", fields: ["classYear", "studyProgram"] as const },
  {
    id: 2,
    title: "Profil d'apprentissage",
    fields: ["strongPoints", "difficulties"] as const,
  },
  {
    id: 3,
    title: "Besoins spécifiques",
    fields: ["learningFlags", "learningFlagsOther"] as const,
  },
  { id: 4, title: "Objectifs", fields: ["tutoringGoals"] as const },
];

function FieldBlock({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="space-y-4">{children}</div>;
}

export function StudentLearningProfileForm({
  defaultValues,
  submitLabel = "Terminer mon profil",
  onSubmit,
  showIntro = true,
  variant = "wizard",
  embedded = false,
  onCancel,
}: StudentLearningProfileFormProps) {
  const flat = variant === "flat";
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      classYear: defaultValues?.classYear ?? "",
      studyProgram: defaultValues?.studyProgram ?? "",
      strongPoints: defaultValues?.strongPoints ?? "",
      difficulties: defaultValues?.difficulties ?? "",
      learningFlags: defaultValues?.learningFlags ?? [],
      learningFlagsOther: defaultValues?.learningFlagsOther ?? "",
      tutoringGoals: defaultValues?.tutoringGoals ?? "",
    },
  });

  const learningFlags = watch("learningFlags") ?? [];
  const currentStep = STEPS[step - 1]!;
  const progress = {
    completedCount: step - 1,
    totalCount: STEPS.length,
    percent: Math.round(((step - 1) / STEPS.length) * 100),
  };

  function toggleFlag(value: string) {
    const next = learningFlags.includes(value)
      ? learningFlags.filter((flag) => flag !== value)
      : [...learningFlags, value];
    setValue("learningFlags", next, { shouldValidate: true });
  }

  async function goNext() {
    const valid = await trigger([...currentStep.fields]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
  }

  async function submit(values: FormValues) {
    await onSubmit({
      classYear: values.classYear,
      studyProgram: values.studyProgram?.trim() || undefined,
      strongPoints: values.strongPoints,
      difficulties: values.difficulties,
      learningFlags: values.learningFlags,
      learningFlagsOther: values.learningFlagsOther?.trim() || undefined,
      tutoringGoals: values.tutoringGoals,
    });
  }

  const showStep = (n: number) => flat || step === n;

  const formBody = (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {showIntro && !flat && step === 1 ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4 text-sm text-ink-700">
          Gadz&apos;Connect, c&apos;est plus que des cours : de l&apos;entraide,
          de la méthode et un suivi personnalisé entre Gadz&apos;. Votre première
          séance avec chaque tuteur est offerte pour faire connaissance, sans
          engagement.
        </div>
      ) : null}

      {showStep(1) ? (
        <FieldBlock>
          <div className="space-y-2">
            <Label htmlFor="classYear">Classe / promo</Label>
            <select
              id="classYear"
              className="flex h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
              {...register("classYear")}
            >
              <option value="">Sélectionnez…</option>
              {CLASS_YEAR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.classYear ? (
              <p className="text-sm text-red-600">{errors.classYear.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="studyProgram">Filière / spécialité (optionnel)</Label>
            <Input
              id="studyProgram"
              placeholder="Ex. Génie industriel, mécanique…"
              {...register("studyProgram")}
            />
          </div>
        </FieldBlock>
      ) : null}

      {showStep(2) ? (
        <FieldBlock>
          <div className="space-y-2">
            <Label htmlFor="strongPoints">Vos points forts</Label>
            <textarea
              id="strongPoints"
              rows={4}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
              placeholder="Matières où vous êtes à l'aise, méthodes qui marchent pour vous…"
              {...register("strongPoints")}
            />
            {errors.strongPoints ? (
              <p className="text-sm text-red-600">{errors.strongPoints.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulties">Vos difficultés</Label>
            <textarea
              id="difficulties"
              rows={4}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
              placeholder="Matières bloquantes, type d'exercices difficiles, organisation…"
              {...register("difficulties")}
            />
            {errors.difficulties ? (
              <p className="text-sm text-red-600">{errors.difficulties.message}</p>
            ) : null}
          </div>
        </FieldBlock>
      ) : null}

      {showStep(3) ? (
        <FieldBlock>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink-900">
              Besoins spécifiques (optionnel)
            </legend>
            <p className="text-xs text-ink-500">
              Ces informations restent confidentielles et aident votre tuteur à
              mieux vous accompagner.
            </p>
            <div className="mt-2 space-y-2">
              {LEARNING_FLAG_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50/40"
                >
                  <input
                    type="checkbox"
                    checked={learningFlags.includes(option.value)}
                    onChange={() => toggleFlag(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          {learningFlags.includes("autre") ? (
            <div className="space-y-2">
              <Label htmlFor="learningFlagsOther">Précisez</Label>
              <Input id="learningFlagsOther" {...register("learningFlagsOther")} />
              {errors.learningFlagsOther ? (
                <p className="text-sm text-red-600">
                  {errors.learningFlagsOther.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </FieldBlock>
      ) : null}

      {showStep(4) ? (
        <FieldBlock>
          <div className="space-y-2">
            <Label htmlFor="tutoringGoals">
              Qu&apos;attendez-vous du tutorat ?
            </Label>
            <textarea
              id="tutoringGoals"
              rows={5}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
              placeholder="Ex. reprendre confiance en maths, méthode de travail, préparation concours…"
              {...register("tutoringGoals")}
            />
            {errors.tutoringGoals ? (
              <p className="text-sm text-red-600">{errors.tutoringGoals.message}</p>
            ) : null}
          </div>
        </FieldBlock>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        {!flat && step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
          >
            Retour
          </Button>
        ) : null}
        {flat && onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
        {!flat && step < STEPS.length ? (
          <Button type="button" onClick={() => void goNext()}>
            Continuer
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement…" : submitLabel}
          </Button>
        )}
      </div>
    </form>
  );

  if (embedded || flat) {
    return formBody;
  }

  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle>Votre profil d&apos;apprentissage</CardTitle>
        <CardDescription>
          Étape {step}/{STEPS.length} — {currentStep.title}
        </CardDescription>
        <OnboardingProgressBar progress={progress} />
      </CardHeader>
      <CardContent>{formBody}</CardContent>
    </Card>
  );
}
