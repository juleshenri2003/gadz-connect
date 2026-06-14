import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@gadz-connect/ui";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAdminDashboard } from "@/features/admin/useAdmin";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  buildMarketplaceSubjectHref,
  buildPlanningWeekHref,
  formatClientName,
  formatNotificationDate,
  getEmptyStateMessage,
  getFilterOptions,
  getKindBadgeClasses,
  getPageSubtitle,
  getPlanningPath,
  getStudentNotificationTitle,
  getUniqueCampusNames,
  isCancellationKind,
  isValidAdminFilter,
  KIND_LABELS,
  matchesCampusFilter,
  matchesFilter,
  sortByScheduledAt,
  type NotificationFilter,
} from "@/features/notifications/notificationUtils";
import {
  useMarkNotificationRead,
  useNotifications,
  type CampusNotificationItem,
} from "@/features/notifications/useNotifications";

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
  const initialFilter: NotificationFilter =
    isAdminRoute && isValidAdminFilter(filterParam)
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
    if (isAdminRoute && isValidAdminFilter(filterParam)) {
      setFilter(filterParam);
    }
  }, [filterParam, isAdminRoute]);

  const filtered = items.filter((item) => matchesFilter(item, filter));

  const unread = filtered.filter((n) => !n.read_at);
  const history = sortByScheduledAt(filtered.filter((n) => n.read_at));

  const isEmpty = filtered.length === 0;
  const filterOptions = getFilterOptions(profile, isAdminRoute);
  const campusNames = isAdminGeneral ? getUniqueCampusNames(data ?? []) : [];

  const markableUnreadIds = items
    .filter((n) => !n.read_at)
    .map((n) => n.id);

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
        </div>

        {!isLoading &&
        !isError &&
        markableUnreadIds.length > 0 ? (
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
          {filterOptions.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={filter === option.value ? "default" : "outline"}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-danger">Impossible de charger les alertes.</p>
      ) : (
        <>
          {unread.length > 0 ? (
            <Card className="border-warning/20">
              <CardHeader>
                <CardTitle className="text-base text-warning">
                  Non lues ({unread.length})
                </CardTitle>
                <CardDescription>
                  Alertes pas encore consultées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {unread.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    isAdminRoute={isAdminRoute}
                    isFocused={item.id === focusId}
                    onMarkRead={() => markRead.mutate(item.id)}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {unread.length > 0 ? "Historique" : "Alertes"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEmpty ? (
                <div className="space-y-2">
                  <p className="text-sm text-ink-400">
                    {getEmptyStateMessage(profile)}
                  </p>
                  {!isAdminRoute ? (
                    <Link
                      to={planningPath}
                      className="text-sm font-medium text-brand-700 hover:underline"
                    >
                      Voir mon emploi du temps →
                    </Link>
                  ) : null}
                </div>
              ) : history.length === 0 && unread.length > 0 ? (
                <p className="text-sm text-ink-400">
                  Aucune alerte archivée pour ce filtre.
                </p>
              ) : (
                history.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    isAdminRoute={isAdminRoute}
                    isFocused={item.id === focusId}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
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
    n.subject ??
    n.title.replace(/^Séance annulée — /, "");
  const displayTitle = student
    ? getStudentNotificationTitle(n.kind, subject, declarant)
    : n.title;
  const showLongMessage = n.message.length > 160;
  const planningHref = buildPlanningWeekHref(n.scheduled_at, isAdminRoute);
  const marketplaceHref = buildMarketplaceSubjectHref(subject);
  const showMarketplaceCta =
    student &&
    !isAdminRoute &&
    isCancellationKind(n.kind) &&
    n.kind === "prof_unavailable";

  return (
    <div
      ref={rowRef}
      id={`alert-${item.id}`}
      className={cn(
        "rounded-lg border p-4 text-sm transition-shadow",
        item.read_at
          ? "border-line bg-paper/50"
          : "border-warning/30 bg-warning-bg",
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
              <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                Non lu
              </span>
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
        <p className="mt-2 text-xs text-ink-400">
          Motif : « {n.reason} »
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-3">
        {n.course_id ? (
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
