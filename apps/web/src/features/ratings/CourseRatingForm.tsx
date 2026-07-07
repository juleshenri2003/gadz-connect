import { useState } from "react";
import { Button } from "@gadz-connect/ui";
import { useSubmitCourseRating } from "./useCourseRating";
import { StarRatingDisplay, StarRatingInput } from "./StarRating";

interface CourseRatingFormProps {
  courseId: string;
  courseTitle: string;
  onSubmitted?: () => void;
}

export function CourseRatingForm({
  courseId,
  courseTitle,
  onSubmitted,
}: CourseRatingFormProps) {
  const [stars, setStars] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submittedStars, setSubmittedStars] = useState<number | null>(null);
  const { mutate, isPending, error } = useSubmitCourseRating();

  if (submittedStars != null) {
    return <CourseRatingSummary stars={submittedStars} />;
  }

  const handleSubmit = () => {
    if (stars == null) return;
    mutate(
      {
        courseId,
        stars,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSubmittedStars(stars);
          onSubmitted?.();
        },
      },
    );
  };

  return (
    <section className="rounded-md border border-line bg-paper p-4">
      <h3 className="text-sm font-semibold text-ink-900">
        Noter ce cours — {courseTitle}
      </h3>
      <p className="mt-1 text-xs text-ink-500">
        Votre commentaire est transmis à l&apos;équipe RH uniquement (le
        professeur ne le verra pas).
      </p>

      <div className="mt-4">
        <StarRatingInput value={stars} onChange={setStars} disabled={isPending} />
      </div>

      <label className="mt-4 block text-xs font-medium text-ink-600">
        Commentaire (optionnel, réservé à l&apos;administration)
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={isPending}
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink-900"
          placeholder="Expliquez votre note si vous le souhaitez…"
        />
      </label>

      {error ? (
        <p className="mt-2 text-xs text-danger">{error.message}</p>
      ) : null}

      <Button
        type="button"
        size="sm"
        className="mt-4"
        disabled={stars == null || isPending}
        onClick={handleSubmit}
      >
        {isPending ? "Envoi…" : "Envoyer mon avis"}
      </Button>
    </section>
  );
}

interface CourseRatingSummaryProps {
  stars: number;
  createdAt?: string;
}

export function CourseRatingSummary({
  stars,
  createdAt,
}: CourseRatingSummaryProps) {
  return (
    <section className="rounded-md border border-line bg-paper px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
        Votre avis
      </p>
      <div className="mt-2">
        <StarRatingDisplay value={stars} />
      </div>
      {createdAt ? (
        <p className="mt-1 text-xs text-ink-500">
          Envoyé le{" "}
          {new Date(createdAt).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      ) : null}
    </section>
  );
}
