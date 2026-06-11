import { Button, Input, Label } from "@gadz-connect/ui";
import { useState } from "react";
import {
  useCoursesToDocument,
  useSubmitCourseSummary,
} from "@/features/repository/useRepository";

function formatSessionDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function CourseDocumentPanel() {
  const { data: courses, isLoading } = useCoursesToDocument();
  const submit = useSubmitCourseSummary();
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handleSubmit(courseId: string) {
    if (!title.trim() || !content.trim()) return;
    await submit.mutateAsync({ courseId, title: title.trim(), content: content.trim() });
    setActiveCourseId(null);
    setTitle("");
    setContent("");
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement des séances…</p>;
  }

  if (!courses?.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
        Aucune séance à documenter pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const client = course.client
          ? `${course.client.first_name} ${course.client.last_name}`.trim()
          : "Élève";
        const subject = course.subject || course.title;
        const isActive = activeCourseId === course.id;

        return (
          <div
            key={course.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{subject}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Élève : {client} · {formatSessionDate(course.scheduled_at)}
                </p>
              </div>
              {!isActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveCourseId(course.id);
                    setTitle(`Session ${subject}`);
                    setContent("");
                  }}
                >
                  Déposer le résumé
                </Button>
              ) : null}
            </div>

            {isActive ? (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <div className="space-y-1">
                  <Label htmlFor={`title-${course.id}`}>Titre</Label>
                  <Input
                    id={`title-${course.id}`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`content-${course.id}`}>
                    Notions importantes du cours
                  </Label>
                  <textarea
                    id={`content-${course.id}`}
                    className="min-h-[120px] w-full rounded-md border border-slate-200 p-2 text-sm"
                    placeholder="Points clés, exercices vus, conseils pour la suite…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={submit.isPending}
                    onClick={() => void handleSubmit(course.id)}
                  >
                    {submit.isPending ? "Enregistrement…" : "Publier dans le répertoire élève"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveCourseId(null)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
