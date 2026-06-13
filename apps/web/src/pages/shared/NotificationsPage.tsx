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
  buildPlanningWeekHref,
  countAdminProposalsReceived,
  countAdminWaitingProposals,
  countOpenReplacements,
  countStudentToChoose,
  countStudentWaiting,
  countTeacherOwnDeclarations,
  countTeacherToAnswer,
  formatClientName,
  formatNotificationDate,
  getEmptyStateMessage,
  getFilterOptions,
  getKindBadgeClasses,
  getPageSubtitle,
  getPendingProposalCount,
  getPlanningPath,
  getReplacementStatusClasses,
  getReplacementStatusLabel,
  getStudentNotificationTitle,
  getTeacherResponse,
  getTeacherResponseClasses,
  getTeacherResponseLabel,
  getUniqueCampusNames,
  isActiveAction,
  isAdminProposalsReceived,
  isAdminWaitingProposals,
  isOpenProfReplacement,
  isSiteAdminRole,
  isStudentToChoose,
  isStudentWaiting,
  isTeacherActiveAction,
  isTeacherAwaitingStudent,
  isTeacherOwnDeclaration,
  isTeacherToAnswer,
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
import { usePendingReplacementsForStudent } from "@/features/replacements/useReplacements";
import { ReplacementNotificationActions } from "@/features/replacements/ReplacementNotificationActions";

export function NotificationsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focus");
  const filterParam = searchParams.get("filter");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { data: profile } = useMyProfile();
  const { data: adminDashboard } = useAdminDashboard(isAdminRoute);
  const { data, isLoading, isError } = useNotifications();
  const { data: pendingForStudent } = usePendingReplacementsForStudent();
  const markRead = useMarkNotificationRead();
  const initialFilter: NotificationFilter =
    isAdminRoute && isValidAdminFilter(filterParam)
      ? filterParam
      : "all";
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
  const [campusFilter, setCampusFilter] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const supervisionRef = useRef<HTMLDivElement>(null);

  const isTeacher = profile?.role === "teacher";
  const isStudentRole = profile?.role ? isStudent(profile.role) : false;
  const isSiteAdmin = isAdminRoute && isSiteAdminRole(profile?.role);
  const isAdminGeneral = profile?.role === "admin_general";
  const planningPath = getPlanningPath(isAdminRoute);
  const scopeItems = (data ?? []).filter((item) =>
    matchesCampusFilter(item, campusFilter),
  );
  const items = scopeItems;
  const profileId = profile?.id;

  useEffect(() => {
    if (isAdminRoute && isValidAdminFilter(filterParam)) {
      setFilter(filterParam);
    }
  }, [filterParam, isAdminRoute]);

  const filtered = items.filter((item) =>
    matchesFilter(item, filter, profileId),
  );

  const activeActions = isTeacher
    ? filtered.filter((item) => isTeacherActiveAction(item, profileId))
    : filtered.filter(isActiveAction);

  const sortedActiveActions = sortByScheduledAt(activeActions);

  const toAnswer = sortedActiveActions.filter((item) =>
    isTeacherToAnswer(item, profileId),
  );
  const ownDeclarations = sortedActiveActions.filter((item) =>
    isTeacherOwnDeclaration(item, profileId),
  );
  const awaitingStudent = sortedActiveActions.filter((item) =>
    isTeacherAwaitingStudent(item, profileId),
  );

  const studentToChoose = sortedActiveActions.filter(isStudentToChoose);
  const studentWaiting = sortedActiveActions.filter(isStudentWaiting);

  const adminWaitingProposals = sortedActiveActions.filter(isAdminWaitingProposals);
  const adminProposalsReceived = sortedActiveActions.filter(isAdminProposalsReceived);

  const activeActionIds = new Set(activeActions.map((item) => item.id));
  const unread = filtered.filter((n) => !n.read_at && !activeActionIds.has(n.id));
  const history = sortByScheduledAt(
    filtered.filter((n) => n.read_at && !activeActionIds.has(n.id)),
  );

  const openReplacementCount = countOpenReplacements(items);
  const adminWaitingCount = countAdminWaitingProposals(items);
  const adminProposalsReceivedCount = countAdminProposalsReceived(items);
  const campusNames = isAdminGeneral ? getUniqueCampusNames(data ?? []) : [];
  const toAnswerCount = countTeacherToAnswer(items, profileId);
  const ownDeclarationsCount = countTeacherOwnDeclarations(items, profileId);
  const _studentToChooseCount = countStudentToChoose(items);
  const studentWaitingCount = countStudentWaiting(items);
  const pendingProposalTotal =
    pendingForStudent?.reduce((sum, p) => sum + p.pendingProposalsCount, 0) ?? 0;

  const isEmpty =
    activeActions.length === 0 && unread.length === 0 && history.length === 0;

  const filterOptions = getFilterOptions(profile, items, isAdminRoute);

  const studentFocusedMode =
    isStudentRole && !isAdminRoute && studentToChoose.length === 1;

  const markableUnreadIds = items
    .filter((n) => {
      if (n.read_at) return false;
      if (activeActionIds.has(n.id)) return false;
      return true;
    })
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

  function scrollToFirstToChoose() {
    const first = studentToChoose[0];
    if (!first) return;
    const el = document.getElementById(`alert-${first.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function scrollToSupervision() {
    supervisionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      {isAdminRoute && openReplacementCount > 0 ? (
        <div
          className="rounded-md border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
          role="status"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="font-semibold">
                {openReplacementCount} remplacement
                {openReplacementCount > 1 ? "s" : ""} en cours
              </span>
              {campusFilter ? ` — ${campusFilter}` : null}
              {" "}— supervisez les indisponibilités prof et le choix des
              remplaçants.
              <p className="mt-1 text-xs text-warning">
                {adminWaitingCount > 0
                  ? `${adminWaitingCount} sans proposition prof`
                  : null}
                {adminWaitingCount > 0 && adminProposalsReceivedCount > 0
                  ? " · "
                  : null}
                {adminProposalsReceivedCount > 0
                  ? `${adminProposalsReceivedCount} en attente du choix élève`
                  : null}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-warning/30 bg-surface text-warning"
              onClick={scrollToSupervision}
            >
              Voir les dossiers en cours →
            </Button>
          </div>
        </div>
      ) : null}

      {isTeacher && !isAdminRoute && (toAnswerCount > 0 || ownDeclarationsCount > 0) ? (
        <div
          className="rounded-md border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700"
          role="status"
        >
          {toAnswerCount > 0 ? (
            <span className="font-semibold">
              {toAnswerCount} remplacement{toAnswerCount > 1 ? "s" : ""} à
              traiter
            </span>
          ) : null}
          {toAnswerCount > 0 && ownDeclarationsCount > 0 ? " · " : null}
          {ownDeclarationsCount > 0 ? (
            <span className="font-semibold">
              {ownDeclarationsCount} déclaration
              {ownDeclarationsCount > 1 ? "s" : ""} en cours
            </span>
          ) : null}
          {" "}— répondez aux collègues ou suivez vos propres indisponibilités.
        </div>
      ) : null}

      {isStudentRole && !isAdminRoute && pendingProposalTotal > 0 ? (
        <div
          className="rounded-md border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700"
          role="status"
        >
          <span className="font-semibold">
            {pendingProposalTotal} proposition
            {pendingProposalTotal > 1 ? "s" : ""} de professeur
            {pendingProposalTotal > 1 ? "s" : ""}
          </span>{" "}
          — choisissez votre remplaçant pour maintenir vos cours au même
          horaire.
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 border-brand-100 bg-surface text-brand-700"
            onClick={scrollToFirstToChoose}
          >
            Choisir maintenant →
          </Button>
        </div>
      ) : null}

      {isStudentRole &&
      !isAdminRoute &&
      studentWaitingCount > 0 &&
      pendingProposalTotal === 0 ? (
        <div
          className="rounded-md border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
          role="status"
        >
          <span className="font-semibold">
            {studentWaitingCount} remplacement
            {studentWaitingCount > 1 ? "s" : ""} en cours
          </span>{" "}
          — en attente de propositions des professeurs de votre campus.
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Alertes campus</h2>
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
          {!isAdminRoute ? (
            <Link
              to={planningPath}
              className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Voir mon emploi du temps →
            </Link>
          ) : (
            <Link
              to={planningPath}
              className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Voir l&apos;emploi du temps campus →
            </Link>
          )}
        </div>

        {!isLoading &&
        !isError &&
        markableUnreadIds.length > 0 &&
        !studentFocusedMode ? (
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
        </>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-ink-400">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-danger">Impossible de charger les alertes.</p>
      ) : (
        <>
          {studentFocusedMode ? (
            <Card className="border-brand-100 shadow-raised">
              <CardHeader>
                <CardTitle className="text-lg text-brand-700">
                  Choisissez votre remplaçant
                </CardTitle>
                <CardDescription>
                  Un professeur est indisponible — validez le remplaçant pour
                  garder votre cours au même horaire.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentToChoose[0] ? (
                  <NotificationRow
                    item={studentToChoose[0]}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    isFocused={studentToChoose[0].id === focusId}
                    inActiveAction
                    onMarkRead={() => markRead.mutate(studentToChoose[0]!.id)}
                  />
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {activeActions.length > 0 && !studentFocusedMode ? (
            <div ref={isSiteAdmin ? supervisionRef : undefined}>
            <Card className="border-brand-100">
              <CardHeader>
                <CardTitle className="text-base text-brand-700">
                  {isSiteAdmin
                    ? `Remplacements à superviser (${activeActions.length})`
                    : isStudentRole
                      ? `Remplacements de cours (${activeActions.length})`
                      : `Actions en cours (${activeActions.length})`}
                </CardTitle>
                <CardDescription>
                  {isSiteAdmin
                    ? "Indisponibilités prof — suivez les propositions et le choix de l'élève"
                    : isTeacher
                      ? "Remplacements ouverts — réponse, suivi ou attente élève"
                      : "Remplacements ouverts — choix de remplaçant ou suivi"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isSiteAdmin && adminWaitingProposals.length > 0 ? (
                  <ActionGroup
                    title="En attente de propositions prof"
                    description="Aucune proposition reçue — les professeurs du campus sont sollicités"
                    items={adminWaitingProposals}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    focusId={focusId}
                    inActiveAction
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ) : null}

                {isSiteAdmin && adminProposalsReceived.length > 0 ? (
                  <ActionGroup
                    title="Propositions reçues — choix élève"
                    description="Des professeurs ont proposé de remplacer — l'élève doit choisir"
                    items={adminProposalsReceived}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    focusId={focusId}
                    inActiveAction
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ) : null}

                {isTeacher && toAnswer.length > 0 ? (
                  <ActionGroup
                    title="À répondre"
                    description="Collègues indisponibles — proposez ou refusez de remplacer"
                    items={toAnswer}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    focusId={focusId}
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ) : null}

                {isTeacher && ownDeclarations.length > 0 ? (
                  <ActionGroup
                    title="Mes déclarations"
                    description="Vos indisponibilités — suivez les propositions reçues"
                    items={ownDeclarations}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    focusId={focusId}
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ) : null}

                {isTeacher && awaitingStudent.length > 0 ? (
                  <ActionGroup
                    title="En attente de l'élève"
                    description="Votre proposition est envoyée — l'élève choisit le remplaçant"
                    items={awaitingStudent}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    focusId={focusId}
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ) : null}

                {isStudentRole && studentToChoose.length > 0 ? (
                  <ActionGroup
                    title="Choisissez votre remplaçant"
                    description="Des professeurs ont proposé de reprendre vos cours"
                    items={studentToChoose}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    focusId={focusId}
                    inActiveAction
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ) : null}

                {isStudentRole && studentWaiting.length > 0 ? (
                  <ActionGroup
                    title="En attente de propositions"
                    description="Les professeurs de votre campus sont sollicités"
                    items={studentWaiting}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    focusId={focusId}
                    inActiveAction
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ) : null}
              </CardContent>
            </Card>
            </div>
          ) : null}

          {unread.length > 0 ? (
            <Card className="border-warning/20">
              <CardHeader>
                <CardTitle className="text-base text-warning">
                  Non lues ({unread.length})
                </CardTitle>
                <CardDescription>
                  Alertes informatives pas encore consultées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {unread.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    planningPath={planningPath}
                    isAdminRoute={isAdminRoute}
                    isFocused={item.id === focusId}
                    onMarkRead={() => markRead.mutate(item.id)}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}

          {!studentFocusedMode ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique</CardTitle>
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
                ) : history.length === 0 ? (
                  <p className="text-sm text-ink-400">
                    Aucune alerte archivée pour ce filtre.
                  </p>
                ) : (
                  history.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      planningPath={planningPath}
                      isAdminRoute={isAdminRoute}
                      isFocused={item.id === focusId}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function ActionGroup({
  title,
  description,
  items,
  planningPath,
  isAdminRoute,
  focusId,
  inActiveAction = false,
  onMarkRead,
}: {
  title: string;
  description: string;
  items: CampusNotificationItem[];
  planningPath: string;
  isAdminRoute: boolean;
  focusId: string | null;
  inActiveAction?: boolean;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        <p className="text-xs text-ink-400">{description}</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            planningPath={planningPath}
            isAdminRoute={isAdminRoute}
            isFocused={item.id === focusId}
            inActiveAction={inActiveAction}
            onMarkRead={() => onMarkRead(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationRow({
  item,
  planningPath: _planningPath,
  isAdminRoute,
  isFocused = false,
  inActiveAction = false,
  onMarkRead,
}: {
  item: CampusNotificationItem;
  planningPath: string;
  isAdminRoute: boolean;
  isFocused?: boolean;
  inActiveAction?: boolean;
  onMarkRead?: () => void;
}) {
  const { data: profile } = useMyProfile();
  const [messageExpanded, setMessageExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const n = item.notification;
  if (!n) return null;

  const student = profile?.role ? isStudent(profile.role) : false;
  const isTeacherRole = profile?.role === "teacher";
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
      : n.declarant?.role === "student"
        ? "Élève"
        : null;

  const clientName = formatClientName(n.client);
  const subject =
    n.subject ?? n.title.replace(/^Remplacement (professeur|élève) — /, "");
  const displayTitle = student
    ? getStudentNotificationTitle(n.kind, subject, declarant)
    : subject;
  const replacementLabel = getReplacementStatusLabel(n.replacement_status);
  const pendingCount = getPendingProposalCount(item);
  const showLongMessage = n.message.length > 160;
  const teacherResponse = getTeacherResponse(item);
  const responseLabel = isTeacherRole
    ? getTeacherResponseLabel(teacherResponse)
    : null;
  const isConfirmation =
    n.kind === "replacement_accepted" || n.replacement_status === "filled";
  const planningHref = buildPlanningWeekHref(n.scheduled_at, isAdminRoute);
  const collapseMessageByDefault = student && n.kind === "prof_unavailable";
  const messageCollapsed = collapseMessageByDefault && !messageExpanded;

  return (
    <div
      ref={rowRef}
      id={`alert-${item.id}`}
      className={cn(
        "rounded-lg border p-4 text-sm transition-shadow",
        inActiveAction
          ? "border-brand-100 bg-brand-50/30"
          : item.read_at
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
            {replacementLabel ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  getReplacementStatusClasses(n.replacement_status),
                )}
              >
                {replacementLabel}
              </span>
            ) : null}
            {isConfirmation ? (
              <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
                Cours confirmé
              </span>
            ) : null}
            {responseLabel ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  getTeacherResponseClasses(teacherResponse),
                )}
              >
                {responseLabel}
              </span>
            ) : null}
            {student && pendingCount > 0 ? (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                {pendingCount} proposition{pendingCount > 1 ? "s" : ""}
              </span>
            ) : null}
            {isSiteAdmin && isAdminRoute && isOpenProfReplacement(item) ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  pendingCount > 0
                    ? "bg-brand-600 text-white"
                    : "bg-warning-bg text-warning",
                )}
              >
                {pendingCount > 0
                  ? `${pendingCount} proposition${pendingCount > 1 ? "s" : ""}`
                  : "Sans proposition"}
              </span>
            ) : null}
            {!item.read_at && !inActiveAction ? (
              <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-white">
                Non lu
              </span>
            ) : null}
          </div>

          <div>
            <p className="font-semibold text-ink-900">{displayTitle}</p>
            {n.scheduled_at ? (
              <p className="mt-0.5 text-sm font-medium text-ink-600">
                Cours prévu le {formatNotificationDate(n.scheduled_at)}
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

        {!item.read_at && onMarkRead && !inActiveAction ? (
          <Button type="button" size="sm" variant="outline" onClick={onMarkRead}>
            Marquer lu
          </Button>
        ) : null}
      </div>

      {messageCollapsed ? (
        <div className="mt-2">
          {n.reason ? (
            <p className="text-ink-600">
              <span className="font-medium">Motif :</span> « {n.reason} »
            </p>
          ) : null}
          <button
            type="button"
            className="mt-1 text-xs font-medium text-brand-700 hover:underline"
            onClick={() => setMessageExpanded(true)}
          >
            Voir le message complet
          </button>
        </div>
      ) : showLongMessage && !messageExpanded ? (
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

      {(messageExpanded || (!messageCollapsed && showLongMessage)) ? (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-brand-700 hover:underline"
          onClick={() => setMessageExpanded(false)}
        >
          Réduire
        </button>
      ) : null}

      {!student ? (
        <p className="mt-2 text-xs text-ink-400">
          Déclaré par {declarant}
          {n.reason ? ` — « ${n.reason} »` : ""}
        </p>
      ) : n.reason ? (
        <p className="mt-2 text-xs text-ink-400">
          Motif indiqué : « {n.reason} »
        </p>
      ) : null}

      {n.course_id ? (
        <Link
          to={planningHref}
          className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline"
        >
          {isAdminRoute
            ? "Voir dans le planning campus →"
            : "Voir dans mon planning →"}
        </Link>
      ) : null}

      {n.replacement_status === "open" && n.kind === "prof_unavailable" ? (
        student && pendingCount === 0 ? (
          <p className="mt-2 text-xs font-medium text-warning">
            Votre professeur est indisponible — des remplaçants vont être
            proposés ici. Vous choisirez celui qui reprendra le cours au même
            horaire.
          </p>
        ) : student ? null : isSiteAdmin ? (
          <p className="mt-2 text-xs font-medium text-ink-600">
            Suivi plateforme — cours en attente de remplacement sur le campus.
          </p>
        ) : (
          <p className="mt-2 text-xs font-medium text-brand-700">
            Remplacement en cours — les profs du campus peuvent proposer,
            l&apos;élève choisit.
          </p>
        )
      ) : null}
      {n.replacement_status === "filled" ? (
        <p className="mt-2 text-xs font-medium text-success">
          Remplacement confirmé — cours replanifié au même horaire.
        </p>
      ) : null}

      <ReplacementNotificationActions
        item={item}
        onActionComplete={onMarkRead}
      />
    </div>
  );
}
