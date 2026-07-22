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
        <LearningProfileFields profile={data} />
      </CardContent>
    </Card>
  );
}

/** Affichage RH — utilise la fiche embarquée dans le détail admin si fournie. */
export function AdminStudentLearningProfileSection({
  studentId,
  profile: embeddedProfile,
  isDetailLoading = false,
}: {
  studentId: string;
  profile?: StudentLearningProfile | null;
  isDetailLoading?: boolean;
}) {
  const shouldFetch = embeddedProfile === undefined && !isDetailLoading;
  const { data, isLoading, isError, error } =
    useStudentLearningProfileForStudent(studentId, shouldFetch);

  const profile = embeddedProfile !== undefined ? embeddedProfile : data;
  const loading = isDetailLoading || (shouldFetch && isLoading);

  if (loading) {
    return <p className="text-sm text-ink-400">Chargement du profil pédagogique…</p>;
  }

  if (shouldFetch && isError) {
    const message =
      error instanceof Error ? error.message : "Chargement impossible";
    return (
      <p className="text-sm text-danger">
        Impossible d&apos;afficher le profil pédagogique ({message}).
      </p>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-md border border-dashed border-line bg-paper px-4 py-3 text-sm text-ink-500">
        Aucun profil pédagogique complété pour cet élève.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-line bg-paper p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {profile.onboardingComplete ? (
          <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
            Complété
          </span>
        ) : (
          <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
            Brouillon
          </span>
        )}
      </div>
      {!profile.onboardingComplete ? (
        <p className="rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning">
          Questionnaire incomplet — brouillon visible côté RH uniquement.
        </p>
      ) : null}
      <LearningProfileFields profile={profile} />
    </div>
  );
}

function LearningProfileFields({
  profile,
}: {
  profile: StudentLearningProfile;
}) {
  return (
    <>
      <Detail
        label="Classe / promo"
        value={
          profile.studyProgram
            ? `${profile.classYear} · ${profile.studyProgram}`
            : profile.classYear
        }
      />
      <Detail label="Points forts" value={profile.strongPoints} multiline />
      <Detail label="Difficultés" value={profile.difficulties} multiline />
      <Detail label="Besoins spécifiques" value={formatFlags(profile)} />
      <Detail label="Objectifs" value={profile.tutoringGoals} multiline />
    </>
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
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-ink-900 ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
