import {
  Button,
  Card,
  CardContent,
  cn,
} from "@gadz-connect/ui";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAdminDashboard } from "@/features/admin/useAdmin";
import {
  ConfirmAttendanceActions,
} from "@/features/course-session/ConfirmAttendanceActions";
import {
  ConfirmSessionActions,
} from "@/features/course-session/ConfirmSessionActions";
import { ReplacementNotificationActions } from "@/features/course-session/ReplacementNotificationActions";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { formatEuro } from "@/features/admin/format";
import {
  ALERT_CATEGORY_META,
  buildMarketplaceSubjectHref,
  buildPlanningWeekHref,
  countAlertsByCategory,
  formatClientName,
  formatNotificationDate,
  getAlertCategory,
  getAlertRowClasses,
  getConfirmationMissingParties,
  getCourseOutcomeMeta,
  getEmptyStateMessage,
  getFilterOptions,
  getKindBadgeClasses,
  getPageSubtitle,
  getPlanningPath,
  getStudentNotificationTitle,
  getUniqueCampusNames,
  groupAlertsByCategory,
  isCancellationKind,
  isValidAlertFilter,
  KIND_LABELS,
  matchesCampusFilter,
  matchesFilter,
  type AlertCategory,
  type NotificationFilter,
} from "@/features/notifications/notificationUtils";
import {
  useMarkNotificationRead,
  useNotifications,
  type CampusNotificationItem,
} from "@/features/notifications/useNotifications";

function isPastScheduledAt(scheduledAt: string | null | undefined): boolean {
  if (!scheduledAt) return false;
  const t = new Date(scheduledAt).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

export function NotificationsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focus");
  const filterParam = searchParams.get("filter");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { data: profile } = useMyProfile();
  const { data: adminDashboard } = useAdminDashboard(isAdminRoute);
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const initialFilter: NotificationFilter = isValidAlertFilter(filterParam)
    ? filterParam
    : "all";
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
  const [campusFilter, setCampusFilter] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const isAdminGeneral = profile?.role === "admin_general";
  const planningPath = getPlanningPath(isAdminRoute);
  const scopeItems = (data ?? []).filter((item) =>
    matchesCampusFilter(item, campusFilter),
  );
  const items = scopeItems;

  useEffect(() => {
    if (isValidAlertFilter(filterParam)) {
      setFilter(filterParam);
    }
  }, [filterParam]);

  const filtered = items.filter((item) => matchesFilter(item, filter));
  // Alertes = file d'actions : uniquement le non lu.
  const unread = filtered.filter((n) => !n.read_at);
  const categoryCounts = useMemo(
    () => countAlertsByCategory(unread),
    [unread],
  );
  const groupedUnread = groupAlertsByCategory(unread);

  const isEmpty = unread.length === 0;
  const filterOptions = getFilterOptions(profile, isAdminRoute);
  const campusNames = isAdminGeneral ? getUniqueCampusNames(data ?? []) : [];

  const markableUnreadIds = unread.map((n) => n.id);

  async function handleMarkAllRead() {
    if (markableUnreadIds.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(markableUnreadIds.map((id) => markRead.mutateAsync(id)));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Alertes</h2>
          <p className="mt-1 text-sm text-ink-600">
            {getPageSubtitle(profile)}
          </p>
          {isAdminRoute && adminDashboard ? (
            <p className="mt-1 text-xs text-ink-400">
              {adminDashboard.scope === "global"
                ? "Périmètre : tous les campus Arts et Métiers"
                : "Périmètre : limité à votre campus"}
            </p>
          ) : null}
          <Link
            to={planningPath}
            className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            {isAdminRoute
              ? "Voir l'emploi du temps campus →"
              : "Voir mon emploi du temps →"}
          </Link>
          {isAdminRoute ? (
            <Link
              to="/admin/cours"
              className="mt-1 block text-sm font-medium text-brand-700 hover:underline"
            >
              Registre des cours (historique classé) →
            </Link>
          ) : null}
        </div>

        {!isLoading && !isError && markableUnreadIds.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={markingAll || markRead.isPending}
            onClick={() => void handleMarkAllRead()}
          >
            {markingAll ? "Marquage…" : "Tout marquer comme lu"}
          </Button>
        ) : null}
      </div>

      {!isLoading && !isError ? (
        <>
          {isAdminGeneral && campusNames.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={campusFilter === null ? "default" : "outline"}
                onClick={() => setCampusFilter(null)}
              >
                Tous les campus
              </Button>
              {campusNames.map((name) => (
                <Button
                  key={name}
                  type="button"
                  size="sm"
                  variant={campusFilter === name ? "default" : "outline"}
                  onClick={() => setCampusFilter(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const count =
                option.value === "all"
                  ? unread.length
                  : option.value === "student_unavailable"
                    ? categoryCounts.cancelled
                    : option.value in categoryCounts
                      ? categoryCounts[option.value as AlertCategory]
                      : 0;
              const meta =
                option.value !== "all" &&
                option.value !== "student_unavailable" &&
                option.value !== "other"
                  ? ALERT_CATEGORY_META[option.value]
                  : null;

              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={filter === option.value ? "default" : "outline"}
                  className={cn(
                    filter !== option.value && meta
                      ? `border-transparent ${meta.badge}`
                      : undefined,
                  )}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                  <span className="ml-1.5 tabular-nums opacity-80">
                    ({count})
                  </span>
                </Button>
              );
            })}
          </div>
        </>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-danger">Impossible de charger les alertes.</p>
      ) : isEmpty ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-ink-400">
              {getEmptyStateMessage(profile)}
            </p>
            {isAdminRoute ? (
              <Link
                to="/admin/cours"
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                Voir le registre des cours →
              </Link>
            ) : (
              <Link
                to={planningPath}
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                Voir mon emploi du temps →
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink-900">
              À traiter ({unread.length})
            </h3>
            <p className="text-sm text-ink-600">
              Marquez comme lu une fois traité — l&apos;alerte quitte cette
              liste
            </p>
          </div>
          {groupedUnread.map((group) => (
            <AlertCategorySection
              key={`unread-${group.category}`}
              category={group.category}
              label={group.label}
              hint={group.hint}
              count={group.items.length}
            >
              {group.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  isAdminRoute={isAdminRoute}
                  isFocused={item.id === focusId}
                  onMarkRead={() => markRead.mutate(item.id)}
                />
              ))}
            </AlertCategorySection>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCategorySection({
  category,
  label,
  hint,
  count,
  children,
}: {
  category: AlertCategory;
  label: string;
  hint: string;
  count: number;
  children: ReactNode;
}) {
  const meta = ALERT_CATEGORY_META[category];

  return (
    <section
      className={cn(
        "overflow-hidden rounded-md border border-line border-l-4 bg-surface",
        meta.accent,
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3",
          meta.header,
        )}
      >
        <div>
          <h4 className="text-sm font-semibold text-ink-900">{label}</h4>
          <p className="mt-0.5 text-xs text-ink-600">{hint}</p>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
            meta.badge,
          )}
        >
          {count}
        </span>
      </header>
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

function NotificationRow({
  item,
  isAdminRoute,
  isFocused = false,
  onMarkRead,
}: {
  item: CampusNotificationItem;
  isAdminRoute: boolean;
  isFocused?: boolean;
  onMarkRead?: () => void;
}) {
  const { data: profile } = useMyProfile();
  const [messageExpanded, setMessageExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const n = item.notification;
  if (!n) return null;

  const student = profile?.role ? isStudent(profile.role) : false;
  const isSiteAdmin =
    profile?.role === "admin_general" || profile?.role === "admin_campus";
  const category = getAlertCategory(n.kind);

  useEffect(() => {
    if (isFocused && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isFocused]);

  const declarant = n.declarant
    ? `${n.declarant.first_name} ${n.declarant.last_name}`.trim()
    : "Membre";

  const declarantRole =
    n.declarant?.role === "teacher"
      ? "Professeur"
      : n.declarant?.role === "student" || n.declarant?.role === "student_provider"
        ? "Élève"
        : null;

  const clientName = formatClientName(n.client);
  const subject =
    n.subject ?? n.title.replace(/^Séance annulée — /, "");
  const displayTitle = student
    ? getStudentNotificationTitle(n.kind, subject, declarant)
    : n.title;
  const showLongMessage = n.message.length > 160;
  const planningHref = buildPlanningWeekHref(n.scheduled_at, isAdminRoute);
  const marketplaceHref = buildMarketplaceSubjectHref(subject);
  const showRepositoryCta =
    student && !isAdminRoute && n.kind === "course_follow_up";
  const showSuiviCta =
    student && !isAdminRoute && n.kind === "course_follow_up" && n.course_id;
  const pastSession = isPastScheduledAt(n.scheduled_at);
  const showPostSessionConfirmCta =
    !isAdminRoute &&
    Boolean(n.course_id) &&
    (n.kind === "session_confirm_reminder" ||
      ((n.kind === "course_confirmation_reminder" ||
        n.kind === "course_confirmation_escalation") &&
        pastSession));
  const showPreSessionConfirmCta =
    !isAdminRoute &&
    n.kind === "course_confirmation_reminder" &&
    Boolean(n.course_id) &&
    !pastSession;
  const showReplacementActions =
    !isAdminRoute &&
    (n.kind === "replacement_offer" || n.kind === "replacement_candidate");
  const showMarketplaceCta =
    student &&
    !isAdminRoute &&
    isCancellationKind(n.kind) &&
    n.kind === "prof_unavailable";

  const confirmationParties =
    category === "confirmation"
      ? getConfirmationMissingParties(item)
      : null;
  const outcomeMeta =
    category === "completed"
      ? getCourseOutcomeMeta(n.kind, n.message)
      : null;

  return (
    <div
      ref={rowRef}
      id={`alert-${item.id}`}
      className={cn(
        "rounded-lg border p-4 text-sm transition-shadow",
        getAlertRowClasses(n.kind, !item.read_at),
        isFocused && "ring-2 ring-accent-600 ring-offset-2",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                getKindBadgeClasses(n.kind),
              )}
            >
              {KIND_LABELS[n.kind] ?? n.kind}
            </span>
            {!item.read_at ? (
              <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink-600">
                Non lu
              </span>
            ) : null}
            {confirmationParties ? (
              <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                {confirmationParties.label}
              </span>
            ) : null}
            {outcomeMeta ? (
              <>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    outcomeMeta.hasRating
                      ? "bg-success-bg text-success"
                      : "bg-paper text-ink-600",
                  )}
                >
                  {outcomeMeta.ratingLabel}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    outcomeMeta.hasComment
                      ? "bg-success-bg text-success"
                      : "bg-paper text-ink-600",
                  )}
                >
                  {outcomeMeta.commentLabel}
                </span>
              </>
            ) : null}
          </div>

          <div>
            <p className="font-semibold text-ink-900">{displayTitle}</p>
            {n.scheduled_at ? (
              <p className="mt-0.5 text-sm font-medium text-ink-600">
                Séance prévue le {formatNotificationDate(n.scheduled_at)}
              </p>
            ) : null}
            {clientName && !student ? (
              <p className="mt-0.5 text-sm text-ink-600">
                Élève : {clientName}
              </p>
            ) : null}
            {isSiteAdmin && isAdminRoute && n.declarant?.role === "teacher" ? (
              <p className="mt-0.5 text-sm text-ink-600">
                Professeur : {declarant}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-ink-400">
              {n.campus?.name ? `${n.campus.name} · ` : ""}
              Déclaré le {formatNotificationDate(n.created_at)}
              {declarantRole && !student ? ` · ${declarantRole}` : ""}
            </p>
          </div>
        </div>

        {!item.read_at && onMarkRead ? (
          <Button type="button" size="sm" variant="outline" onClick={onMarkRead}>
            Marquer lu
          </Button>
        ) : null}
      </div>

      {showLongMessage && !messageExpanded ? (
        <div className="mt-2">
          <p className="line-clamp-2 text-ink-600">{n.message}</p>
          <button
            type="button"
            className="mt-1 text-xs font-medium text-brand-700 hover:underline"
            onClick={() => setMessageExpanded(true)}
          >
            Voir le détail
          </button>
        </div>
      ) : (
        <p className="mt-2 text-ink-600">{n.message}</p>
      )}

      {n.kind === "refund_processed" && n.refundAmount != null ? (
        <div className="mt-3 rounded-md border border-violet-200 bg-violet-50 px-3 py-2">
          <p className="text-sm font-semibold text-ink-900">
            Montant remboursé : {formatEuro(n.refundAmount)}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            Sur la carte utilisée lors du paiement — délai habituel 5 à 10 jours
            ouvrés
          </p>
        </div>
      ) : null}

      {messageExpanded && showLongMessage ? (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-brand-700 hover:underline"
          onClick={() => setMessageExpanded(false)}
        >
          Réduire
        </button>
      ) : null}

      {n.reason ? (
        <p className="mt-2 text-xs text-ink-400">Motif : « {n.reason} »</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-3">
        {showPostSessionConfirmCta && n.course_id ? (
          <ConfirmAttendanceActions
            courseId={n.course_id}
            audience={student ? "student" : "teacher"}
            studentSessionConfirmedAt={
              n.studentSessionConfirmedAt ?? n.studentConfirmedAt
            }
            providerSessionConfirmedAt={
              n.providerSessionConfirmedAt ?? n.providerConfirmedAt
            }
            compact
            confirmLabel="Confirmer que le cours a eu lieu"
          />
        ) : null}
        {showPreSessionConfirmCta && n.course_id ? (
          <ConfirmSessionActions
            courseId={n.course_id}
            audience={student ? "student" : "teacher"}
            studentConfirmedAt={n.studentConfirmedAt}
            providerConfirmedAt={n.providerConfirmedAt}
            compact
          />
        ) : null}
        {showReplacementActions ? (
          <ReplacementNotificationActions
            kind={n.kind}
            notificationId={n.id}
            courseId={n.course_id}
            audience={student ? "student" : "teacher"}
          />
        ) : null}
        {showRepositoryCta ? (
          <Link
            to="/app/repertoire"
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            Voir dans mon répertoire →
          </Link>
        ) : null}
        {showSuiviCta ? (
          <Link
            to="/app/suivi-cours"
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            Voir le suivi du cours →
          </Link>
        ) : null}
        {n.course_id && !showRepositoryCta ? (
          <Link
            to={planningHref}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            {isAdminRoute
              ? "Voir dans le planning campus →"
              : "Voir dans mon planning →"}
          </Link>
        ) : null}
        {showMarketplaceCta ? (
          <Link
            to={marketplaceHref}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            Trouver un autre tuteur →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
