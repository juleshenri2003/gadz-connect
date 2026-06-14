import { Button, Card, CardContent } from "@gadz-connect/ui";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { StudentNextCourseHero } from "@/features/dashboard/student-cockpit/StudentNextCourseHero";
import {
  getNextStudentCourse,
  getStudentCourseEvents,
  getTutorName,
} from "@/features/dashboard/student-cockpit/studentCockpitUtils";
import { getSessionLabel } from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";
import { StudentScheduleEventDetail } from "@/features/scheduling/StudentScheduleEventDetail";
import { TeacherAgendaList } from "@/features/scheduling/TeacherAgendaList";
import { filterScheduleEvents } from "@/features/scheduling/scheduleFilters";
import { TeacherScheduleEventDetail } from "@/features/scheduling/TeacherScheduleEventDetail";
import { TeacherScheduleHeader } from "@/features/scheduling/TeacherScheduleHeader";
import {
  addDays,
  isEventPast,
  startOfWeek,
} from "@/features/scheduling/calendar-utils";
import type { ScheduleEvent } from "@/features/scheduling/types";
import {
  useShowScheduleHistory,
  useStudentScheduleView,
  useTeacherScheduleView,
} from "@/features/scheduling/useTeacherScheduleView";
import { useMySchedule } from "@/features/scheduling/useSchedule";
import { WeekCalendar } from "@/features/scheduling/WeekCalendar";

function parseWeekParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function SchedulePage() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { view: teacherView, setView: setTeacherView } = useTeacherScheduleView();
  const { view: studentView, setView: setStudentView } = useStudentScheduleView();
  const { showHistory, setShowHistory } = useShowScheduleHistory();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(
    null,
  );
  const student = Boolean(profile && isStudent(profile.role));

  const weekAnchor = useMemo(
    () => parseWeekParam(searchParams.get("week")) ?? new Date(),
    [searchParams],
  );

  const scheduleParams = useMemo(() => {
    if (student) return undefined;
    const base = { includeCancelled: showHistory };
    if (teacherView !== "week") return base;
    const weekStart = startOfWeek(weekAnchor);
    return {
      ...base,
      from: weekStart.toISOString(),
      to: addDays(weekStart, 7).toISOString(),
    };
  }, [student, showHistory, teacherView, weekAnchor]);

  const { data, isLoading, isError } = useMySchedule(scheduleParams);
  const rawEvents = data?.events ?? [];
  const events = student
    ? rawEvents
    : filterScheduleEvents(rawEvents, showHistory);
  const studentCourseEvents = useMemo(
    () => getStudentCourseEvents(events),
    [events],
  );
  const nextStudentCourse = useMemo(
    () => getNextStudentCourse(events),
    [events],
  );

  function renderTeacherTitle(event: ScheduleEvent): string {
    if (event.kind === "slot_available") return "Créneau ouvert";
    return getSessionLabel(event);
  }

  function renderTeacherSubtitle(event: ScheduleEvent): string | undefined {
    if (event.kind === "slot_available") return undefined;
    return event.title;
  }

  function renderStudentTitle(event: ScheduleEvent): string {
    return getTutorName(event);
  }

  function renderStudentSubtitle(event: ScheduleEvent): string | undefined {
    return event.title;
  }

  function renderTeacherMeta(event: ScheduleEvent): string | undefined {
    if (event.kind === "slot_available") return "Ouvert aux réservations";
    return undefined;
  }

  function handleWeekAnchorChange(anchor: Date) {
    const weekStart = startOfWeek(anchor);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("week", weekStart.toISOString().slice(0, 10));
        return next;
      },
      { replace: true },
    );
  }

  function renderStudentSummaryBadge(event: ScheduleEvent) {
    if (!event.hasSummary || !isEventPast(event.startsAt, event.endsAt)) {
      return null;
    }
    return (
      <Link
        to="/app/repertoire"
        className="mt-2 inline-block rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 hover:bg-brand-100"
      >
        Compte-rendu
      </Link>
    );
  }

  const studentEmptyAction = (
    <Button asChild>
      <Link to="/app/cours">Trouver mon tuteur</Link>
    </Button>
  );

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-lg bg-paper" />
        <Card>
          <CardContent className="pt-6">
            <WeekCalendar events={[]} loading teacherMode={false} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {student ? (
        <>
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Emploi du temps</h2>
            <p className="mt-1 text-sm text-ink-600">
              Vos cours de tutorat réservés sur Gadz&apos;Connect
            </p>
          </div>
          <StudentNextCourseHero course={nextStudentCourse} />
        </>
      ) : (
        <TeacherScheduleHeader
          events={rawEvents}
          hourlyRate={profile?.hourly_rate ?? null}
          statusAcre={profile?.status_acre ?? false}
          versementLiberatoire={profile?.versement_liberatoire ?? false}
        />
      )}

      {student ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={studentView === "week" ? "default" : "outline"}
            onClick={() => setStudentView("week")}
          >
            Semaine
          </Button>
          <Button
            type="button"
            size="sm"
            variant={studentView === "list" ? "default" : "outline"}
            onClick={() => setStudentView("list")}
          >
            Liste
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={teacherView === "week" ? "default" : "outline"}
              onClick={() => setTeacherView("week")}
            >
              Semaine
            </Button>
            <Button
              type="button"
              size="sm"
              variant={teacherView === "list" ? "default" : "outline"}
              onClick={() => setTeacherView("list")}
            >
              Liste
            </Button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              className="rounded border-line"
              checked={showHistory}
              onChange={(e) => setShowHistory(e.target.checked)}
            />
            Afficher l&apos;historique
          </label>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            !student && teacherView === "list" ? (
              <TeacherAgendaList events={[]} loading />
            ) : student && studentView === "list" ? (
              <TeacherAgendaList events={[]} loading />
            ) : (
              <WeekCalendar
                events={[]}
                loading
                teacherMode={!student}
              />
            )
          ) : isError ? (
            <p className="text-sm text-danger">
              Impossible de charger l&apos;emploi du temps.
            </p>
          ) : student && studentView === "list" ? (
            <TeacherAgendaList
              events={studentCourseEvents}
              variant="full"
              onEventClick={setSelectedEvent}
              renderEventActions={(event) => renderStudentSummaryBadge(event)}
            />
          ) : !student && teacherView === "list" ? (
            <TeacherAgendaList
              events={events}
              variant="full"
              showHistory={showHistory}
              onEventClick={setSelectedEvent}
            />
          ) : (
            <WeekCalendar
              events={student ? studentCourseEvents : events}
              loading={false}
              teacherMode={!student}
              showDuration
              legendVariant={student ? "student" : "teacher"}
              initialAnchor={weekAnchor}
              onAnchorChange={handleWeekAnchorChange}
              onEventClick={setSelectedEvent}
              emptyLabel={
                student
                  ? "Aucun cours réservé — parcourez le tutorat pour réserver un créneau."
                  : "Aucun créneau ni cours — ajoutez des disponibilités dans Mes cours."
              }
              emptyLabelWeekOnly="Aucun événement cette semaine — utilisez ← → pour parcourir les autres semaines."
              emptyAction={student ? studentEmptyAction : undefined}
              renderEventTitle={student ? renderStudentTitle : renderTeacherTitle}
              renderEventSubtitle={
                student ? renderStudentSubtitle : renderTeacherSubtitle
              }
              renderEventMeta={student ? undefined : renderTeacherMeta}
              renderEventActions={(event) =>
                student ? renderStudentSummaryBadge(event) : null
              }
            />
          )}
        </CardContent>
      </Card>

      {student && studentCourseEvents.length > 0 ? (
        <p className="text-sm text-ink-600">
          <Link
            to="/app/cours"
            className="font-medium text-brand-700 hover:underline"
          >
            Réserver un cours →
          </Link>
        </p>
      ) : null}

      {student ? (
        <StudentScheduleEventDetail
          event={selectedEvent}
          open={selectedEvent != null}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}

      {!student && profile ? (
        <TeacherScheduleEventDetail
          event={selectedEvent}
          open={selectedEvent != null}
          onClose={() => setSelectedEvent(null)}
          hourlyRate={profile.hourly_rate}
          statusAcre={profile.status_acre ?? false}
          versementLiberatoire={profile.versement_liberatoire ?? false}
        />
      ) : null}
    </div>
  );
}
