import { useState } from "react";
import { CourseEvaluationDetailModal } from "@/features/evaluations/CourseEvaluationDetailModal";
import { CourseEvaluationsList } from "@/features/evaluations/CourseEvaluationsList";
import { TeacherRatingsSection } from "@/features/ratings/TeacherRatingsSection";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { useStudentLearningProfile } from "@/features/onboarding/useStudentLearningProfile";

export function CourseEvaluationsPage() {
  const { data: profile } = useMyProfile();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const student = profile ? isStudent(profile.role) : false;
  const { data: learningProfile } = useStudentLearningProfile(student);

  if (student) {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-bold text-ink-900">Suivi & entraide</h2>
          <p className="mt-1 text-sm text-ink-600">
            Retrouvez vos notes, les comptes-rendus de vos tuteurs, leurs fiches
            PDF et vos échanges — plus qu&apos;un cours, un accompagnement
            personnalisé.
          </p>
        </header>

        {learningProfile?.tutoringGoals ? (
          <section className="rounded-lg border border-brand-100 bg-brand-50/40 p-4">
            <h3 className="text-sm font-semibold text-ink-900">Vos objectifs</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">
              {learningProfile.tutoringGoals}
            </p>
          </section>
        ) : null}

        <CourseEvaluationsList onOpenCourse={setSelectedCourseId} />

        <CourseEvaluationDetailModal
          courseId={selectedCourseId}
          open={Boolean(selectedCourseId)}
          onClose={() => setSelectedCourseId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-ink-900">Suivi des cours</h2>
        <p className="mt-1 text-sm text-ink-600">
          Notes reçues, comptes-rendus et échanges avec vos élèves — deux
          espaces complémentaires.
        </p>
      </header>

      <section className="space-y-4">
        <TeacherRatingsSection onOpenCourse={setSelectedCourseId} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-ink-900">
            Comptes-rendus & fiches synthèse
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            Déposez un récapitulatif de séance ou une fiche sur un point
            précis si l&apos;élève en a besoin. Les documents sont classés
            dans son répertoire matière.
          </p>
        </div>
        <CourseEvaluationsList
          variant="teacher-materials"
          onOpenCourse={setSelectedCourseId}
        />
      </section>

      <CourseEvaluationDetailModal
        courseId={selectedCourseId}
        open={Boolean(selectedCourseId)}
        onClose={() => setSelectedCourseId(null)}
      />
    </div>
  );
}
