import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Button, cn } from "@gadz-connect/ui";
import { StarRatingDisplay } from "@/features/ratings/StarRating";
import { formatNotificationDate } from "@/features/notifications/notificationUtils";
import { useMyCourseEvaluations } from "./useEvaluations";
import type { CourseEvaluationListItem } from "./types";

function isBothConfirmed(item: CourseEvaluationListItem): boolean {
  if (item.bothConfirmed != null) return item.bothConfirmed;
  return Boolean(
    item.sessionConfirmationCompletedAt ||
      (item.studentSessionConfirmedAt && item.providerSessionConfirmedAt),
  );
}

function scheduledTime(item: CourseEvaluationListItem): number {
  return item.scheduledAt ? new Date(item.scheduledAt).getTime() : 0;
}

/** Confirmations incomplètes : actions d’abord, puis date récente. */
function sortIncomplete(a: CourseEvaluationListItem, b: CourseEvaluationListItem): number {
  if (a.canRate !== b.canRate) return a.canRate ? -1 : 1;
  if (a.hasSummary !== b.hasSummary) return a.hasSummary ? 1 : -1;
  return scheduledTime(b) - scheduledTime(a);
}

/** Séances validées : note ↓, puis matière, puis date. */
function sortConfirmed(a: CourseEvaluationListItem, b: CourseEvaluationListItem): number {
  if (a.canRate !== b.canRate) return a.canRate ? -1 : 1;
  const aStars = a.rating?.stars ?? -1;
  const bStars = b.rating?.stars ?? -1;
  if (aStars !== bStars) return bStars - aStars;
  const bySubject = a.subject.localeCompare(b.subject, "fr", {
    sensitivity: "base",
  });
  if (bySubject !== 0) return bySubject;
  return scheduledTime(b) - scheduledTime(a);
}

/** Matériaux prof : CR manquant d’abord, puis date. */
function sortTeacherMaterials(
  a: CourseEvaluationListItem,
  b: CourseEvaluationListItem,
): number {
  if (a.hasSummary !== b.hasSummary) return a.hasSummary ? 1 : -1;
  return scheduledTime(b) - scheduledTime(a);
}

function ConfirmationChips({ item }: { item: CourseEvaluationListItem }) {
  const studentOk = Boolean(item.studentSessionConfirmedAt);
  const providerOk = Boolean(item.providerSessionConfirmedAt);
  return (
    <div className="flex flex-wrap gap-1.5 text-[11px]">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 font-medium",
          providerOk
            ? "bg-success-bg text-success"
            : "bg-paper text-ink-500",
        )}
      >
        Prof {providerOk ? "✓" : "—"}
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 font-medium",
          studentOk
            ? "bg-success-bg text-success"
            : "bg-paper text-ink-500",
        )}
      >
        Élève {studentOk ? "✓" : "—"}
      </span>
    </div>
  );
}

function EvaluationRow({
  item,
  onOpen,
  showRating = true,
  showConfirmation = false,
}: {
  item: CourseEvaluationListItem;
  onOpen: (courseId: string) => void;
  showRating?: boolean;
  showConfirmation?: boolean;
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
      {showConfirmation ? (
        <div className="mt-2">
          <ConfirmationChips item={item} />
        </div>
      ) : null}
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

function EvaluationSection({
  title,
  hint,
  count,
  accent,
  header,
  children,
}: {
  title: string;
  hint: string;
  count: number;
  accent: string;
  header: string;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className={cn("overflow-hidden rounded-md border border-line", accent)}>
      <header className={cn("border-b border-line px-4 py-3", header)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
            <p className="mt-0.5 text-xs text-ink-600">{hint}</p>
          </div>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-ink-700">
            {count}
          </span>
        </div>
      </header>
      <div className="space-y-2 bg-surface p-3">{children}</div>
    </section>
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
  const raw = data ?? [];

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

  if (!raw.length) {
    return (
      <p className="text-sm text-ink-500">
        {variant === "teacher-materials"
          ? "Vos cours terminés apparaîtront ici pour déposer un compte-rendu ou une fiche synthèse."
          : "Vos cours terminés apparaîtront ici avec notes, comptes-rendus et échanges."}
      </p>
    );
  }

  if (variant === "teacher-materials") {
    let items = [...raw].sort(sortTeacherMaterials);
    if (limit) items = items.slice(0, limit);
    const incomplete = items.filter((item) => !isBothConfirmed(item));
    const confirmed = items.filter((item) => isBothConfirmed(item));

    return (
      <div className="space-y-4">
        <EvaluationSection
          title="Confirmations incomplètes"
          hint="En attente élève et/ou prof — déposez le CR dès que possible"
          count={incomplete.length}
          accent="border-l-4 border-l-warning"
          header="bg-warning-bg/50"
        >
          {incomplete.map((item) => (
            <EvaluationRow
              key={item.courseId}
              item={item}
              onOpen={onOpenCourse}
              showRating={false}
              showConfirmation
            />
          ))}
        </EvaluationSection>
        <EvaluationSection
          title="Séances validées"
          hint="Double confirmation OK — classés CR manquant d’abord, puis date"
          count={confirmed.length}
          accent="border-l-4 border-l-success"
          header="bg-success-bg/40"
        >
          {confirmed.map((item) => (
            <EvaluationRow
              key={item.courseId}
              item={item}
              onOpen={onOpenCourse}
              showRating={false}
              showConfirmation
            />
          ))}
        </EvaluationSection>
      </div>
    );
  }

  let incomplete = raw.filter((item) => !isBothConfirmed(item)).sort(sortIncomplete);
  let confirmed = raw.filter((item) => isBothConfirmed(item)).sort(sortConfirmed);

  if (limit) {
    const budget = limit;
    incomplete = incomplete.slice(0, budget);
    confirmed = confirmed.slice(0, Math.max(0, budget - incomplete.length));
  }

  return (
    <div className="space-y-4">
      <EvaluationSection
        title="Confirmations incomplètes"
        hint="Une ou deux parties n’ont pas encore validé la séance"
        count={incomplete.length}
        accent="border-l-4 border-l-warning"
        header="bg-warning-bg/50"
      >
        {incomplete.map((item) => (
          <EvaluationRow
            key={item.courseId}
            item={item}
            onOpen={onOpenCourse}
            showConfirmation
          />
        ))}
      </EvaluationSection>
      <EvaluationSection
        title="Séances validées (double confirmation)"
        hint="Classées par note, puis matière, puis date"
        count={confirmed.length}
        accent="border-l-4 border-l-success"
        header="bg-success-bg/40"
      >
        {confirmed.map((item) => (
          <EvaluationRow
            key={item.courseId}
            item={item}
            onOpen={onOpenCourse}
            showConfirmation
          />
        ))}
      </EvaluationSection>
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
