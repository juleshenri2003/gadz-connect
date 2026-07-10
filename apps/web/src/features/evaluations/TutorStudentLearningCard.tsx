import type { StudentLearningProfile } from "@gadz-connect/types";
import { Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import { LEARNING_FLAG_LABELS } from "@/features/onboarding/studentLearningProfileOptions";
import { useStudentLearningProfileForStudent } from "@/features/onboarding/useStudentLearningProfile";

interface TutorStudentLearningCardProps {
  studentId: string;
  studentFirstName?: string;
}

function formatFlags(profile: StudentLearningProfile): string {
  if (!profile.learningFlags.length) return "Aucun signalé";
  return profile.learningFlags
    .map((flag) =>
      flag === "autre" && profile.learningFlagsOther
        ? profile.learningFlagsOther
        : LEARNING_FLAG_LABELS[flag] ?? flag,
    )
    .join(", ");
}

export function TutorStudentLearningCard({
  studentId,
  studentFirstName,
}: TutorStudentLearningCardProps) {
  const { data, isLoading, isError } =
    useStudentLearningProfileForStudent(studentId);

  if (isLoading) {
    return (
      <p className="text-sm text-ink-500">Chargement de la fiche pédagogique…</p>
    );
  }

  if (isError || !data) {
    return null;
  }

  const title = studentFirstName
    ? `Fiche pédagogique de ${studentFirstName}`
    : "Fiche pédagogique";

  return (
    <Card className="border-brand-100 bg-brand-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-ink-500">
          Document confidentiel — visible uniquement après réservation
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Parcours
          </p>
          <p className="mt-1 text-ink-900">
            {data.classYear}
            {data.studyProgram ? ` · ${data.studyProgram}` : ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Points forts
          </p>
          <p className="mt-1 whitespace-pre-wrap text-ink-700">
            {data.strongPoints}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Difficultés
          </p>
          <p className="mt-1 whitespace-pre-wrap text-ink-700">
            {data.difficulties}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Besoins spécifiques
          </p>
          <p className="mt-1 text-ink-700">{formatFlags(data)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Objectifs
          </p>
          <p className="mt-1 whitespace-pre-wrap text-ink-700">
            {data.tutoringGoals}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminStudentLearningProfileSection({
  studentId,
}: {
  studentId: string;
}) {
  const { data, isLoading, isError } =
    useStudentLearningProfileForStudent(studentId);

  if (isLoading) {
    return <p className="text-sm text-ink-400">Chargement du profil pédagogique…</p>;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-ink-500">
        Aucun profil pédagogique complété pour cet élève.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-line bg-paper p-4 text-sm">
      <Detail label="Classe / promo" value={data.classYear} />
      {data.studyProgram ? (
        <Detail label="Filière" value={data.studyProgram} />
      ) : null}
      <Detail label="Points forts" value={data.strongPoints} multiline />
      <Detail label="Difficultés" value={data.difficulties} multiline />
      <Detail label="Besoins spécifiques" value={formatFlags(data)} />
      <Detail label="Objectifs" value={data.tutoringGoals} multiline />
    </div>
  );
}

function Detail({
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
      <p className="text-xs text-ink-400">{label}</p>
      <p className={`mt-0.5 text-ink-900 ${multiline ? "whitespace-pre-wrap" : ""}`}>
        {value}
      </p>
    </div>
  );
}
