import { Button, Card, CardContent } from "@gadz-connect/ui";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useAdminCampuses, useAdminMe } from "@/features/admin/useAdmin";
import { AdminAgendaList } from "@/features/scheduling/AdminAgendaList";
import { AdminScheduleEventDetail } from "@/features/scheduling/AdminScheduleEventDetail";
import { AdminScheduleFilters } from "@/features/scheduling/AdminScheduleFilters";
import { AdminScheduleKpiBand } from "@/features/scheduling/AdminScheduleKpiBand";
import { MonthCalendar } from "@/features/scheduling/MonthCalendar";
import { WeekCalendar } from "@/features/scheduling/WeekCalendar";
import {
  useAdminSchedule,
  useAdminScheduleSummary,
} from "@/features/scheduling/useSchedule";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { API_URL } from "@/lib/api";
import {
  buildAdminPlanningHref,
  formatWeekParam,
  getScheduleRange,
  parseAdminScheduleUrl,
  parseMonthParam,
  parseWeekParam,
  type AdminScheduleStatusFilter,
  type AdminScheduleViewMode,
} from "@/features/scheduling/adminScheduleUtils";
import {
  courseStatusLabel,
  isEventPast,
} from "@/features/scheduling/calendar-utils";
import { filterScheduleEvents, hasAwaitingReplacement } from "@/features/scheduling/scheduleFilters";

const VIEW_STORAGE_KEY = "gadz-admin-schedule-view";

function readStoredView(): AdminScheduleViewMode {
  if (typeof window === "undefined") return "week";
  const stored = sessionStorage.getItem(VIEW_STORAGE_KEY);
  return stored === "list" || stored === "month" || stored === "week"
    ? stored
    : "week";
}

function getInitialView(
  urlView: AdminScheduleViewMode | undefined,
): AdminScheduleViewMode {
  if (urlView) return urlView;
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches
  ) {
    return "list";
  }
  return readStoredView();
}

export function AdminSchedulePage() {
  const { getAccessToken } = useAuth();
  const { data: me } = useAdminMe();
  const { data: campuses = [] } = useAdminCampuses();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(
    () => parseAdminScheduleUrl(searchParams),
    [searchParams],
  );

  const [view, setViewState] = useState<AdminScheduleViewMode>(() =>
    getInitialView(urlState.view),
  );
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [exporting, setExporting] = useState(false);
  const [searchDraft, setSearchDraft] = useState(urlState.search ?? "");

  const weekAnchor = useMemo(
    () => parseWeekParam(urlState.week ?? null) ?? new Date(),
    [urlState.week],
  );
  const monthAnchor = useMemo(
    () =>
      parseMonthParam(urlState.month ?? null) ??
      parseWeekParam(urlState.week ?? null) ??
      new Date(),
    [urlState.month, urlState.week],
  );

  const showHistory = urlState.showHistory ?? false;
  const campusId = urlState.campusId;
  const selectedStatus = urlState.status ?? [];
  const isGlobalScope = me?.role === "admin_general";

  const range = useMemo(
    () => getScheduleRange(view, weekAnchor, monthAnchor),
    [view, weekAnchor, monthAnchor],
  );

  const scheduleParams = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      campusId,
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      includeCancelled: showHistory,
      search: urlState.search,
    }),
    [
      range.from,
      range.to,
      campusId,
      selectedStatus,
      showHistory,
      urlState.search,
    ],
  );

  const { data, isLoading, isError } = useAdminSchedule(scheduleParams);
  const summaryQuery = useAdminScheduleSummary({
    from: range.from,
    to: range.to,
    campusId,
  });

  const rawEvents = data?.events ?? [];
  const events = useMemo(
    () => filterScheduleEvents(rawEvents, showHistory),
    [rawEvents, showHistory],
  );
  const replacementPending = hasAwaitingReplacement(events);

  function patchParams(
    patch: Record<string, string | undefined>,
    replace = false,
  ) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(replace ? undefined : prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value == null || value === "") next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  }

  function setView(next: AdminScheduleViewMode) {
    setViewState(next);
    sessionStorage.setItem(VIEW_STORAGE_KEY, next);
    patchParams({ view: next === "week" ? undefined : next });
  }

  function handleWeekAnchorChange(anchor: Date) {
    patchParams({ week: formatWeekParam(anchor), month: undefined });
  }

  function handleMonthAnchorChange(anchor: Date) {
    const month = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, "0")}`;
    patchParams({ month, week: undefined });
  }

  function handleDayClick(day: Date) {
    setView("week");
    patchParams({
      view: undefined,
      week: formatWeekParam(day),
      month: undefined,
    });
  }

  function handleCampusChange(nextCampusId: string | undefined) {
    patchParams({ campus: nextCampusId });
  }

  function handleSearchChange(value: string) {
    setSearchDraft(value);
    patchParams({ q: value.trim() || undefined });
  }

  function handleStatusToggle(status: AdminScheduleStatusFilter) {
    const next = selectedStatus.includes(status)
      ? selectedStatus.filter((s) => s !== status)
      : [...selectedStatus, status];
    patchParams({
      status: next.length > 0 ? next.join(",") : undefined,
    });
  }

  function handleShowHistoryChange(value: boolean) {
    patchParams({ history: value ? "1" : undefined });
  }

  function renderMeta(event: ScheduleEvent): string | undefined {
    const parts = [
      event.providerName ? `Prof : ${event.providerName}` : null,
      event.clientName ? `Élève : ${event.clientName}` : null,
      event.campusName,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }

  function renderEventSubtitle(event: ScheduleEvent): string | undefined {
    const status = courseStatusLabel(event.status);
    if (event.status === "awaiting_replacement") return "Remplacement en cours";
    return status && status !== "Planifié" ? status : undefined;
  }

  function renderMissingSummaryBadge(event: ScheduleEvent) {
    if (
      event.hasSummary ||
      !isEventPast(event.startsAt, event.endsAt) ||
      event.status === "cancelled"
    ) {
      return null;
    }
    return (
      <span className="mt-1 inline-block rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
        CR manquant
      </span>
    );
  }

  async function handleExport() {
    const token = getAccessToken();
    if (!token) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (scheduleParams.from) params.set("from", scheduleParams.from);
      if (scheduleParams.to) params.set("to", scheduleParams.to);
      if (scheduleParams.campusId) params.set("campusId", scheduleParams.campusId);
      if (scheduleParams.search) params.set("search", scheduleParams.search);
      if (scheduleParams.status?.length) {
        params.set("status", scheduleParams.status.join(","));
      }
      if (scheduleParams.includeCancelled) params.set("includeCancelled", "true");

      const res = await fetch(
        `${API_URL}/api/admin/schedule/export?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Export impossible");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "planning-campus.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Impossible d'exporter le planning.");
    } finally {
      setExporting(false);
    }
  }

  const emptyLabel =
    campusId || urlState.search || selectedStatus.length > 0
      ? "Aucune session ne correspond à vos filtres."
      : "Aucun cours planifié sur cette période.";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Emploi du temps</h2>
        <p className="mt-1 text-sm text-ink-600">
          Activité tutorat sur votre périmètre — vision globale multi-campus
        </p>
      </div>

      <AdminScheduleKpiBand
        summary={summaryQuery.data}
        loading={summaryQuery.isLoading}
        campusId={campusId}
        isGlobalScope={isGlobalScope}
      />

      {replacementPending ? (
        <div className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning">
          Un ou plusieurs cours sont en attente de remplacement sur la période
          affichée.{" "}
          <Link
            to={buildAdminPlanningHref({
              campusId,
              status: ["awaiting_replacement"],
            })}
            className="font-medium underline"
          >
            Filtrer les cours concernés →
          </Link>{" "}
          ·{" "}
          <Link to="/admin/alertes" className="font-medium underline">
            Alertes campus →
          </Link>
        </div>
      ) : null}

      <AdminScheduleFilters
        campuses={campuses}
        campusId={campusId}
        search={searchDraft}
        selectedStatus={selectedStatus}
        showHistory={showHistory}
        showCampusFilter={isGlobalScope}
        onCampusChange={handleCampusChange}
        onSearchChange={handleSearchChange}
        onStatusToggle={handleStatusToggle}
        onShowHistoryChange={handleShowHistoryChange}
        onExport={handleExport}
        exporting={exporting}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={view === "week" ? "default" : "outline"}
            onClick={() => setView("week")}
          >
            Semaine
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            Liste
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "month" ? "default" : "outline"}
            onClick={() => setView("month")}
          >
            Mois
          </Button>
        </div>
        <p className="text-sm text-ink-400">
          {events.length} session{events.length > 1 ? "s" : ""} affichée
          {events.length > 1 ? "s" : ""}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isError ? (
            <p className="text-sm text-danger">
              Impossible de charger l&apos;emploi du temps.
            </p>
          ) : view === "list" ? (
            <AdminAgendaList
              events={events}
              loading={isLoading}
              onEventClick={setSelectedEvent}
              emptyLabel={emptyLabel}
            />
          ) : view === "month" ? (
            <MonthCalendar
              events={events}
              initialAnchor={monthAnchor}
              onAnchorChange={handleMonthAnchorChange}
              onDayClick={handleDayClick}
              loading={isLoading}
            />
          ) : (
            <WeekCalendar
              events={events}
              loading={isLoading}
              showDuration
              showLegend
              legendVariant="student"
              initialAnchor={weekAnchor}
              onAnchorChange={handleWeekAnchorChange}
              onEventClick={setSelectedEvent}
              emptyLabel={emptyLabel}
              emptyLabelWeekOnly="Aucune session cette semaine — utilisez ← → pour parcourir les autres semaines."
              renderEventTitle={(event) => event.title}
              renderEventSubtitle={renderEventSubtitle}
              renderEventMeta={renderMeta}
              renderEventExtra={renderMissingSummaryBadge}
            />
          )}
        </CardContent>
      </Card>

      <AdminScheduleEventDetail
        event={selectedEvent}
        open={selectedEvent != null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
