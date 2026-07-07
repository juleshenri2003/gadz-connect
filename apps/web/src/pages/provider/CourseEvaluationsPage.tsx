import { useState } from "react";
import { CourseEvaluationDetailModal } from "@/features/evaluations/CourseEvaluationDetailModal";
import { CourseEvaluationsList } from "@/features/evaluations/CourseEvaluationsList";
import { TeacherRatingsSection } from "@/features/ratings/TeacherRatingsSection";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { isStudent } from "@/features/auth/roles";

export function CourseEvaluationsPage() {
  const { data: profile } = useMyProfile();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const student = profile ? isStudent(profile.role) : false;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-ink-900">Suivi des cours</h2>
        <p className="mt-1 text-sm text-ink-600">
          {student
            ? "Retrouvez vos notes, les comptes-rendus de vos professeurs, leurs fiches PDF et vos échanges."
            : "Consultez les notes reçues, déposez vos synthèses et répondez aux questions de vos élèves."}
        </p>
      </header>

      {!student ? <TeacherRatingsSection /> : null}

      <CourseEvaluationsList onOpenCourse={setSelectedCourseId} />

      <CourseEvaluationDetailModal
        courseId={selectedCourseId}
        open={Boolean(selectedCourseId)}
        onClose={() => setSelectedCourseId(null)}
      />
    </div>
  );
}
