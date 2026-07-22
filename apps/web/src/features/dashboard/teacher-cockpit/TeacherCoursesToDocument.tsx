import { Button, Input, Label, cn } from "@gadz-connect/ui";
import { useState } from "react";
import { Link } from "react-router-dom";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";
import {
  useCoursesToDocument,
  useSubmitCourseSummary,
} from "@/features/repository/useRepository";

const COURSE_STATUS_LABELS: Record<string, string> = {
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
};

function formatSessionDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface TeacherCoursesToDocumentProps {
  variant?: "compact" | "full";
  embedded?: boolean;
}

export function TeacherCoursesToDocument({
  variant = "compact",
  embedded = false,
}: TeacherCoursesToDocumentProps) {
  const { data: courses, isLoading } = useCoursesToDocument();
  const submit = useSubmitCourseSummary();
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishedCourseId, setPublishedCourseId] = useState<string | null>(
    null,
  );

  const visibleCourses =
    variant === "compact" ? (courses?.slice(0, 4) ?? []) : (courses ?? []);

  async function handleSubmit(courseId: string) {
    if (!title.trim() || !content.trim()) return;
    await submit.mutateAsync({
      courseId,
      title: title.trim(),
      content: content.trim(),
    });
    setActiveCourseId(null);
    setTitle("");
    setContent("");
    setPublishedCourseId(courseId);
  }

  const body = (
    <>
      {!embedded ? (
        <>
          <h3 className="font-semibold text-ink-900">Cours à documenter</h3>
          <p className="mt-1 text-sm text-ink-600">
            {variant === "full"
              ? "Déposez un résumé après chaque cours — il sera classé dans le répertoire matière de l'élève."
              : "Déposez le résumé de vos séances passées."}
          </p>
        </>
      ) : null}

      {isLoading ? (
        <p className={cn("text-sm text-ink-400", !embedded && "mt-4")}>
          Chargement…
        </p>
      ) : !courses?.length ? (
        <p
          className={cn(
            "text-sm text-ink-400",
            !embedded && "mt-4",
            variant === "full" &&
              "rounded-md border border-dashed border-line bg-paper p-6 text-ink-600",
          )}
        >
          Aucune séance en attente de documentation.
        </p>
      ) : (
        <ul className={cn("space-y-3", !embedded && "mt-4")}>
          {visibleCourses.map((course) => {
            const client = course.client
              ? `${course.client.first_name} ${course.client.last_name}`.trim()
              : "Élève";
            const subject = course.subject || course.title;
            const isActive = activeCourseId === course.id;
            const statusLabel =
              course.status !== "scheduled"
                ? COURSE_STATUS_LABELS[course.status] ?? course.status
                : null;

            return (
              <li
                key={course.id}
                className="rounded-lg border border-line bg-paper/80 p-3 text-sm"
              >
                <div className="flex flex-wrap items-start gap-2">
                  <p className="font-medium text-ink-900">{subject}</p>
                  {statusLabel ? (
                    <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                      {statusLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-ink-600">
                  {client} · {formatSessionDate(course.scheduled_at)}
                </p>

                {publishedCourseId === course.id ? (
                  <p className="mt-2 text-sm text-success" role="status">
                    Résumé publié — il apparaît dans le répertoire matière de
                    l&apos;élève.
                  </p>
                ) : null}

                {isActive ? (
                  <div className="mt-3 space-y-2 border-t border-line pt-3">
                    <div className="space-y-1">
                      <Label htmlFor={`doc-title-${course.id}`}>Titre</Label>
                      <Input
                        id={`doc-title-${course.id}`}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`doc-content-${course.id}`}>
                        Notions importantes du cours
                      </Label>
                      <textarea
                        id={`doc-content-${course.id}`}
                        className="min-h-[80px] w-full rounded-md border border-line p-2 text-sm"
                        placeholder="Points clés, exercices vus, conseils pour la suite…"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={submit.isPending}
                        onClick={() => void handleSubmit(course.id)}
                      >
                        {submit.isPending
                          ? "Enregistrement…"
                          : "Publier dans le répertoire élève"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveCourseId(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                    {submit.isError ? (
                      <p className="text-sm text-danger" role="alert">
                        {(submit.error as Error).message}
                      </p>
                    ) : null}
                  </div>
                ) : publishedCourseId !== course.id ? (
                  <Button
                    className="mt-2"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveCourseId(course.id);
                      setTitle(`Session ${subject}`);
                      setContent("");
                      setPublishedCourseId(null);
                    }}
                  >
                    Déposer le résumé
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {variant === "compact" && courses && courses.length > 4 ? (
        <p className="mt-3 text-xs text-ink-400">
          {courses.length - 4} autre{courses.length - 4 > 1 ? "s" : ""} séance
          {courses.length - 4 > 1 ? "s" : ""} —{" "}
          <Link
            to={coursesTabHref("history")}
            className="font-medium text-brand-700 hover:underline"
          >
            voir tous les cours passés
          </Link>
          .
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      {body}
    </section>
  );
}
