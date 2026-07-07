import { COURSE_RATING_LOW_THRESHOLD } from "@gadz-connect/types";
import { StarRatingDisplay } from "@/features/ratings/StarRating";
import { useTeacherRatings } from "@/features/ratings/useCourseRating";
import { formatNotificationDate } from "@/features/notifications/notificationUtils";

export function TeacherRatingsSection() {
  const { data, isLoading, isError } = useTeacherRatings();

  if (isLoading) {
    return (
      <section className="rounded-md border border-line bg-white p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-paper" />
        <div className="mt-4 h-24 animate-pulse rounded bg-paper" />
      </section>
    );
  }

  if (isError) {
    return null;
  }

  if (!data || data.count === 0) {
    return (
      <section className="rounded-md border border-line bg-white p-6">
        <h3 className="text-lg font-semibold text-ink-900">Avis élèves</h3>
        <p className="mt-2 text-sm text-ink-600">
          Aucun avis pour le moment. Les notes apparaîtront ici après vos
          cours terminés.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-line bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink-900">Avis élèves</h3>
          <p className="mt-1 text-sm text-ink-600">
            Notes visibles — les commentaires restent réservés à
            l&apos;administration.
          </p>
        </div>
        {data.average != null ? (
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Moyenne
            </p>
            <StarRatingDisplay value={data.average} />
            <p className="mt-0.5 text-xs text-ink-500">
              {data.count} avis
            </p>
          </div>
        ) : null}
      </div>

      <ul className="mt-4 divide-y divide-line">
        {data.items.map((item) => (
          <li key={item.courseId} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink-900">{item.subject}</p>
                <p className="text-xs text-ink-500">
                  {item.raterName}
                  {item.scheduledAt
                    ? ` · ${formatNotificationDate(item.scheduledAt)}`
                    : null}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StarRatingDisplay value={item.stars} size="sm" />
                {item.stars < COURSE_RATING_LOW_THRESHOLD ? (
                  <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                    À approfondir
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
