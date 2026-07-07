import { useRef, useState } from "react";
import { Button, Input, Label } from "@gadz-connect/ui";
import { FileText, X } from "lucide-react";
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

function PdfPickField({
  file,
  onFile,
  onClear,
  disabled,
  description = "PDF — max. 5 Mo",
}: {
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  description?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-md border border-line bg-paper p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink-900">Document PDF</p>
          <p className="mt-0.5 text-xs text-ink-500">{description}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) onFile(picked);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          className="shrink-0 gap-1.5"
          onClick={() => inputRef.current?.click()}
        >
          <FileText className="h-4 w-4" aria-hidden />
          PDF
        </Button>
      </div>

      {file ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-brand-100 bg-brand-50/60 px-3 py-2">
          <p className="min-w-0 truncate text-sm font-medium text-ink-900">
            {file.name}
          </p>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-ink-500"
            aria-label="Retirer le PDF"
            disabled={disabled}
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-ink-400">
          Cliquez sur <span className="font-medium text-ink-600">PDF</span> pour
          parcourir vos documents.
        </p>
      )}
    </div>
  );
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
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked) onFile(picked);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        className="gap-1.5"
        onClick={() => inputRef.current?.click()}
      >
        <FileText className="h-4 w-4" aria-hidden />
        {label}
      </Button>
    </>
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
  const [success, setSuccess] = useState<string | null>(null);

  const isTeacher = data?.viewerRole === "teacher";

  function showSuccess(message: string) {
    setSuccess(message);
    setError(null);
    window.setTimeout(() => setSuccess(null), 4000);
  }

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
      await refetch();
      showSuccess("Message envoyé.");
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
      showSuccess("Compte-rendu publié — visible dans le répertoire de l'élève.");
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
      showSuccess("PDF joint au compte-rendu.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSubmitClarification() {
    if (!courseId || !clarificationTitle.trim()) {
      setError("Indiquez un titre pour la fiche.");
      return;
    }
    if (!clarificationContent.trim() && !clarificationPdf) {
      setError("Ajoutez un texte ou sélectionnez un PDF.");
      return;
    }
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
      showSuccess("Fiche déposée — visible dans le suivi et le répertoire de l'élève.");
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
                    label="Joindre un PDF"
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
                  placeholder="Contenu texte (optionnel si vous joignez un PDF)"
                />
                <PdfPickField
                  file={clarificationPdf}
                  disabled={postClarification.isPending}
                  onFile={setClarificationPdf}
                  onClear={() => setClarificationPdf(null)}
                />
                <Button
                  type="button"
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

          {success ? (
            <p className="rounded-md border border-success/20 bg-success-bg px-3 py-2 text-sm text-success">
              {success}
            </p>
          ) : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      )}
    </Modal>
  );
}
