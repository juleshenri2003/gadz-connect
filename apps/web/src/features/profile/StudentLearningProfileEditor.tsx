import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import type { StudentLearningProfile } from "@gadz-connect/types";
import { StudentLearningProfileForm } from "@/features/onboarding/StudentLearningProfileForm";
import { LEARNING_FLAG_LABELS } from "@/features/onboarding/studentLearningProfileOptions";
import {
  useSaveStudentLearningProfile,
  useStudentLearningProfile,
} from "@/features/onboarding/useStudentLearningProfile";

function formatFlags(profile: StudentLearningProfile): string {
  if (!profile.learningFlags.length) return "Aucun signalé";
  return profile.learningFlags
    .map((flag) =>
      flag === "autre" && profile.learningFlagsOther
        ? profile.learningFlagsOther
        : (LEARNING_FLAG_LABELS[flag] ?? flag),
    )
    .join(", ");
}

function SummaryRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p
        className={`mt-1 text-sm text-ink-900 ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export function StudentLearningProfileEditor() {
  const { data, isLoading } = useStudentLearningProfile();
  const saveProfile = useSaveStudentLearningProfile();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-ink-400">Chargement…</p>;
  }

  const completed = Boolean(data?.onboardingComplete);
  const showForm = !completed || editing;

  return (
    <section className="border-t border-line pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">
            Profil pédagogique
          </h3>
          <p className="mt-1 text-sm text-ink-400">
            Ces informations aident vos tuteurs à mieux vous accompagner après
            réservation.
          </p>
        </div>
        {completed && !editing ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
          >
            Modifier
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        {completed && !editing && data ? (
          <Card className="border-line bg-paper/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-ink-900">
                Profil complété
              </CardTitle>
              <p className="text-xs text-ink-500">
                Visible par vos tuteurs après réservation, et par le RH de votre
                campus.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SummaryRow
                label="Classe / promo"
                value={
                  data.studyProgram
                    ? `${data.classYear} · ${data.studyProgram}`
                    : data.classYear
                }
              />
              <SummaryRow
                label="Besoins spécifiques"
                value={formatFlags(data)}
              />
              <SummaryRow
                label="Points forts"
                value={data.strongPoints}
                multiline
              />
              <SummaryRow
                label="Difficultés"
                value={data.difficulties}
                multiline
              />
              <div className="sm:col-span-2">
                <SummaryRow
                  label="Objectifs"
                  value={data.tutoringGoals}
                  multiline
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showForm ? (
          <div className={completed ? "mt-4" : undefined}>
            {!completed ? (
              <p className="mb-3 text-sm text-ink-600">
                Complétez ce questionnaire une fois — vous pourrez le modifier
                plus tard si besoin.
              </p>
            ) : null}
            <StudentLearningProfileForm
              key={editing ? "edit" : "create"}
              embedded
              variant={completed ? "flat" : "wizard"}
              showIntro={false}
              submitLabel="Enregistrer"
              defaultValues={
                data
                  ? {
                      classYear: data.classYear,
                      studyProgram: data.studyProgram ?? "",
                      strongPoints: data.strongPoints,
                      difficulties: data.difficulties,
                      learningFlags: data.learningFlags,
                      learningFlagsOther: data.learningFlagsOther ?? "",
                      tutoringGoals: data.tutoringGoals,
                    }
                  : undefined
              }
              onCancel={completed ? () => setEditing(false) : undefined}
              onSubmit={async (values) => {
                await saveProfile.mutateAsync(values);
                setEditing(false);
              }}
            />
          </div>
        ) : null}

        {saveProfile.isSuccess && !editing ? (
          <p className="mt-3 text-sm text-success">Profil enregistré.</p>
        ) : null}
        {saveProfile.error ? (
          <p className="mt-3 text-sm text-danger">
            {(saveProfile.error as Error).message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
