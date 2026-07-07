import { Link } from "react-router-dom";
import { Button, cn } from "@gadz-connect/ui";
import { StarRatingDisplay } from "@/features/ratings/StarRating";
import { formatNotificationDate } from "@/features/notifications/notificationUtils";
import { useMyCourseEvaluations } from "./useEvaluations";
import type { CourseEvaluationListItem } from "./types";

function EvaluationRow({
  item,
  onOpen,
  showRating = true,
}: {
  item: CourseEvaluationListItem;
  onOpen: (courseId: string) => void;
  showRating?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.courseId)}
      className="w-full rounded-md border border-line bg-white px-4 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink-900">{item.subject}</p>
          <p className="text-xs text-ink-500">
            {item.counterpartName}
            {item.scheduledAt
              ? ` · ${formatNotificationDate(item.scheduledAt)}`
              : null}
          </p>
        </div>
        {showRating ? (
          item.rating ? (
            <StarRatingDisplay value={item.rating.stars} size="sm" />
          ) : item.canRate ? (
            <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
              À noter
            </span>
          ) : null
        ) : !item.hasSummary ? (
          <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
            CR manquant
          </span>
        ) : (
          <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
            CR déposé
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-500">
        {item.hasSummary ? (
          <span className="rounded bg-paper px-2 py-0.5">Compte-rendu</span>
        ) : null}
        {item.hasSummaryPdf ? (
          <span className="rounded bg-paper px-2 py-0.5">PDF</span>
        ) : null}
        {item.clarificationsCount > 0 ? (
          <span className="rounded bg-paper px-2 py-0.5">
            {item.clarificationsCount} fiche
            {item.clarificationsCount > 1 ? "s" : ""}
          </span>
        ) : null}
        {item.messagesCount > 0 ? (
          <span className="rounded bg-paper px-2 py-0.5">
            {item.messagesCount} message{item.messagesCount > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
    </button>
  );
}

interface CourseEvaluationsListProps {
  onOpenCourse: (courseId: string) => void;
  limit?: number;
  embedded?: boolean;
  variant?: "student" | "teacher-materials";
}

export function CourseEvaluationsList({
  onOpenCourse,
  limit,
  embedded = false,
  variant = "student",
}: CourseEvaluationsListProps) {
  const { data, isLoading, isError } = useMyCourseEvaluations();
  let items = data ?? [];
  if (variant === "teacher-materials") {
    items = [...items].sort((a, b) => {
      if (a.hasSummary !== b.hasSummary) return a.hasSummary ? 1 : -1;
      const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return bTime - aTime;
    });
  }
  if (limit) items = items.slice(0, limit);

  if (isLoading) {
    return (
      <div className={cn(!embedded && "space-y-3")}>
        <div className="h-16 animate-pulse rounded-md bg-paper" />
        <div className="h-16 animate-pulse rounded-md bg-paper" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-danger">Impossible de charger les évaluations</p>
    );
  }

  if (!items.length) {
    return (
      <p className="text-sm text-ink-500">
        {variant === "teacher-materials"
          ? "Vos cours terminés apparaîtront ici pour déposer un compte-rendu ou une fiche synthèse."
          : "Vos cours terminés apparaîtront ici avec notes, comptes-rendus et échanges."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <EvaluationRow
          key={item.courseId}
          item={item}
          onOpen={onOpenCourse}
          showRating={variant === "student"}
        />
      ))}
    </div>
  );
}

export function ProfileEvaluationsCard({
  role,
}: {
  role: "student" | "teacher";
}) {
  const { data } = useMyCourseEvaluations();
  const pendingRating = data?.filter((item) => item.canRate).length ?? 0;
  const pendingSummary =
    role === "teacher"
      ? data?.filter((item) => !item.hasSummary).length ?? 0
      : 0;
  const withMaterials =
    data?.filter(
      (item) =>
        item.hasSummary ||
        item.clarificationsCount > 0 ||
        item.messagesCount > 0,
    ).length ?? 0;

  return (
    <section className="rounded-md border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">Suivi & évaluations</h3>
          <p className="mt-1 text-sm text-ink-600">
            {role === "student"
              ? "Notes, comptes-rendus et fiches de vos professeurs."
              : "Notes reçues, synthèses et échanges avec vos élèves."}
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/app/suivi-cours">Voir tout</Link>
        </Button>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-md bg-paper px-2 py-3">
          <dt className="text-xs text-ink-500">Cours suivis</dt>
          <dd className="mt-1 text-lg font-semibold text-ink-900">
            {data?.length ?? 0}
          </dd>
        </div>
        <div className="rounded-md bg-paper px-2 py-3">
          <dt className="text-xs text-ink-500">
            {role === "student" ? "À noter" : "Sans CR"}
          </dt>
          <dd className="mt-1 text-lg font-semibold text-ink-900">
            {role === "student" ? pendingRating : pendingSummary}
          </dd>
        </div>
        <div className="rounded-md bg-paper px-2 py-3">
          <dt className="text-xs text-ink-500">Avec contenu</dt>
          <dd className="mt-1 text-lg font-semibold text-ink-900">
            {withMaterials}
          </dd>
        </div>
      </dl>
    </section>
  );
}
