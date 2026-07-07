import { useState } from "react";
import { Button, Input, Label } from "@gadz-connect/ui";
import { Modal } from "@/components/Modal";
import {
  CourseRatingForm,
} from "@/features/ratings/CourseRatingForm";
import { StarRatingDisplay } from "@/features/ratings/StarRating";
import { formatNotificationDate } from "@/features/notifications/notificationUtils";
import { useSubmitCourseSummary } from "@/features/repository/useRepository";
import {
  fileToPdfBase64,
  openEvaluationPdf,
  useCourseEvaluationDetail,
  usePostClarification,
  usePostCourseMessage,
  useUploadSummaryPdf,
} from "./useEvaluations";
import { useAuth } from "@/features/auth/AuthProvider";

interface CourseEvaluationDetailModalProps {
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

function PdfUploadButton({
  label,
  onFile,
  disabled,
}: {
  label: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-700 hover:underline">
      <input
        type="file"
        accept="application/pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      {label}
    </label>
  );
}

export function CourseEvaluationDetailModal({
  courseId,
  open,
  onClose,
}: CourseEvaluationDetailModalProps) {
  const { getAccessToken } = useAuth();
  const { data, isLoading, refetch } = useCourseEvaluationDetail(
    open ? courseId : null,
  );
  const postMessage = usePostCourseMessage();
  const postClarification = usePostClarification();
  const uploadSummaryPdf = useUploadSummaryPdf();
  const submitSummary = useSubmitCourseSummary();

  const [messageBody, setMessageBody] = useState("");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryContent, setSummaryContent] = useState("");
  const [clarificationTitle, setClarificationTitle] = useState("");
  const [clarificationContent, setClarificationContent] = useState("");
  const [clarificationPdf, setClarificationPdf] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = data?.viewerRole === "teacher";

  async function handleOpenPdf(kind: "summary" | "clarification", id: string) {
    const token = getAccessToken();
    if (!token) return;
    await openEvaluationPdf(token, kind, id);
  }

  async function handleSendMessage() {
    if (!courseId || !messageBody.trim()) return;
    setError(null);
    try {
      await postMessage.mutateAsync({
        courseId,
        body: messageBody.trim(),
      });
      setMessageBody("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSubmitSummary() {
    if (!courseId || !summaryTitle.trim() || !summaryContent.trim()) return;
    setError(null);
    try {
      await submitSummary.mutateAsync({
        courseId,
        title: summaryTitle.trim(),
        content: summaryContent.trim(),
      });
      setSummaryTitle("");
      setSummaryContent("");
      await refetch();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSummaryPdf(file: File) {
    if (!courseId) return;
    setError(null);
    try {
      const pdfBase64 = await fileToPdfBase64(file);
      await uploadSummaryPdf.mutateAsync({ courseId, pdfBase64 });
      await refetch();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSubmitClarification() {
    if (!courseId || !clarificationTitle.trim()) return;
    if (!clarificationContent.trim() && !clarificationPdf) return;
    setError(null);
    try {
      let pdfBase64: string | undefined;
      if (clarificationPdf) {
        pdfBase64 = await fileToPdfBase64(clarificationPdf);
      }
      await postClarification.mutateAsync({
        courseId,
        title: clarificationTitle.trim(),
        content: clarificationContent.trim() || undefined,
        pdfBase64,
      });
      setClarificationTitle("");
      setClarificationContent("");
      setClarificationPdf(null);
      await refetch();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={data?.subject ?? "Suivi du cours"}
      description={
        data
          ? `${data.counterpart.name} · ${data.scheduledAt ? formatNotificationDate(data.scheduledAt) : "—"}`
          : undefined
      }
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      {isLoading || !data ? (
        <p className="text-sm text-ink-500">Chargement…</p>
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Note de l&apos;élève
            </h3>
            <div className="mt-2">
              {data.rating ? (
                <StarRatingDisplay value={data.rating.stars} />
              ) : data.canRate && courseId ? (
                <CourseRatingForm
                  courseId={courseId}
                  courseTitle={data.subject}
                  onSubmitted={() => void refetch()}
                />
              ) : isTeacher ? (
                <p className="text-sm text-ink-500">Pas encore noté</p>
              ) : (
                <p className="text-sm text-ink-500">Pas encore noté</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Compte-rendu du professeur
            </h3>
            {data.summary ? (
              <div className="mt-2 space-y-2 rounded-md border border-line bg-paper p-4 text-sm">
                <p className="font-medium text-ink-900">{data.summary.title}</p>
                <p className="whitespace-pre-wrap text-ink-700">
                  {data.summary.content}
                </p>
                {data.summary.hasPdf ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void handleOpenPdf("summary", data.summary!.id)
                    }
                  >
                    Télécharger le PDF
                  </Button>
                ) : null}
                {isTeacher && !data.summary.hasPdf ? (
                  <PdfUploadButton
                    label="Joindre un PDF au compte-rendu"
                    disabled={uploadSummaryPdf.isPending}
                    onFile={(file) => void handleSummaryPdf(file)}
                  />
                ) : null}
              </div>
            ) : isTeacher ? (
              <div className="mt-2 space-y-3 rounded-md border border-dashed border-line p-4">
                <p className="text-sm text-ink-600">
                  Synthèse ou mini récap du cours — déposé dans le répertoire
                  de l&apos;élève.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="summary-title">Titre</Label>
                  <Input
                    id="summary-title"
                    value={summaryTitle}
                    onChange={(e) => setSummaryTitle(e.target.value)}
                    placeholder="Ex. Séance du 12 mars — dérivées"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary-content">Contenu</Label>
                  <textarea
                    id="summary-content"
                    value={summaryContent}
                    onChange={(e) => setSummaryContent(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm"
                    placeholder="Points clés, exercices à revoir…"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={submitSummary.isPending}
                  onClick={() => void handleSubmitSummary()}
                >
                  {submitSummary.isPending ? "Publication…" : "Publier le compte-rendu"}
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-500">
                Le professeur n&apos;a pas encore déposé de compte-rendu.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Fiches complémentaires
            </h3>
            {data.clarifications.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {data.clarifications.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-line bg-paper p-3 text-sm"
                  >
                    <p className="font-medium text-ink-900">{item.title}</p>
                    {item.content ? (
                      <p className="mt-1 whitespace-pre-wrap text-ink-700">
                        {item.content}
                      </p>
                    ) : null}
                    {item.hasPdf ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() =>
                          void handleOpenPdf("clarification", item.id)
                        }
                      >
                        Ouvrir le PDF
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-500">
                Aucune fiche complémentaire pour le moment.
              </p>
            )}

            {isTeacher ? (
              <div className="mt-4 space-y-3 rounded-md border border-dashed border-line p-4">
                <p className="text-sm text-ink-600">
                  Déposez une fiche PDF ou un texte si l&apos;élève a besoin
                  d&apos;une précision après le cours.
                </p>
                <Input
                  value={clarificationTitle}
                  onChange={(e) => setClarificationTitle(e.target.value)}
                  placeholder="Titre de la fiche"
                />
                <textarea
                  value={clarificationContent}
                  onChange={(e) => setClarificationContent(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm"
                  placeholder="Contenu texte (optionnel si PDF)"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-brand-700">
                    <input
                      type="file"
                      accept="application/pdf"
                      className="mr-2"
                      onChange={(e) =>
                        setClarificationPdf(e.target.files?.[0] ?? null)
                      }
                    />
                    PDF (optionnel)
                  </label>
                  {clarificationPdf ? (
                    <span className="text-xs text-ink-500">
                      {clarificationPdf.name}
                    </span>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={postClarification.isPending}
                  onClick={() => void handleSubmitClarification()}
                >
                  {postClarification.isPending
                    ? "Envoi…"
                    : "Déposer la fiche"}
                </Button>
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Échanges
            </h3>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border border-line bg-paper p-3">
              {data.messages.length === 0 ? (
                <p className="text-sm text-ink-500">
                  {isTeacher
                    ? "Échangez avec votre élève."
                    : "Échangez avec votre professeur — posez une question si besoin."}
                </p>
              ) : (
                data.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-md px-3 py-2 text-sm ${
                      msg.isMine
                        ? "ml-6 bg-brand-50 text-brand-900"
                        : "mr-6 bg-white text-ink-800"
                    }`}
                  >
                    <p className="text-xs font-medium text-ink-500">
                      {msg.authorName} ·{" "}
                      {formatNotificationDate(msg.createdAt)}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={2}
                className="min-h-0 flex-1 rounded-md border border-line px-3 py-2 text-sm"
                placeholder={
                  isTeacher
                    ? "Votre message à l'élève…"
                    : "Votre question au professeur…"
                }
              />
              <Button
                type="button"
                size="sm"
                disabled={postMessage.isPending || !messageBody.trim()}
                onClick={() => void handleSendMessage()}
              >
                Envoyer
              </Button>
            </div>
          </section>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      )}
    </Modal>
  );
}
