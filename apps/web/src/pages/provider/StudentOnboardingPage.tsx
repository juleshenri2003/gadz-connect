import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { StudentLearningProfileForm } from "@/features/onboarding/StudentLearningProfileForm";
import { useSaveStudentLearningProfile } from "@/features/onboarding/useStudentLearningProfile";

export function StudentOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveProfile = useSaveStudentLearningProfile();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">
          Bienvenue sur Gadz&apos;Connect
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Quelques questions pour mieux vous accompagner — tutorat, entraide et
          suivi personnalisé entre Gadz&apos;.
        </p>
      </div>

      <StudentLearningProfileForm
        showIntro
        onSubmit={async (values) => {
          await saveProfile.mutateAsync(values);
          await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
          await queryClient.refetchQueries({ queryKey: ["profile-me"] });
          navigate("/app", { replace: true });
        }}
      />

      {saveProfile.error ? (
        <p className="text-sm text-red-600">
          {saveProfile.error instanceof Error
            ? saveProfile.error.message
            : "Enregistrement impossible"}
        </p>
      ) : null}
    </div>
  );
}
