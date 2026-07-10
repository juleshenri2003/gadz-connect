import { Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import { StudentLearningProfileForm } from "@/features/onboarding/StudentLearningProfileForm";
import {
  useSaveStudentLearningProfile,
  useStudentLearningProfile,
} from "@/features/onboarding/useStudentLearningProfile";

export function StudentLearningProfileEditor() {
  const { data, isLoading } = useStudentLearningProfile();
  const saveProfile = useSaveStudentLearningProfile();

  if (isLoading) {
    return <p className="text-sm text-ink-400">Chargement…</p>;
  }

  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle className="text-lg">Profil pédagogique</CardTitle>
        <p className="text-sm text-ink-400">
          Ces informations aident vos tuteurs à mieux vous accompagner après
          réservation.
        </p>
      </CardHeader>
      <CardContent>
        <StudentLearningProfileForm
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
          onSubmit={async (values) => {
            await saveProfile.mutateAsync(values);
          }}
        />
        {saveProfile.isSuccess ? (
          <p className="mt-3 text-sm text-success">Profil enregistré.</p>
        ) : null}
        {saveProfile.error ? (
          <p className="mt-3 text-sm text-danger">
            {(saveProfile.error as Error).message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
