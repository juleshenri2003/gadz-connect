import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@gadz-connect/ui";
import type { MyProfile } from "@/features/auth/useMyProfile";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { startOfWeek } from "@/features/scheduling/calendar-utils";
import { StudentScheduleEventDetail } from "@/features/scheduling/StudentScheduleEventDetail";
import { TeacherWeekStrip } from "@/features/dashboard/teacher-cockpit/TeacherWeekStrip";
import { DashboardActionInbox } from "@/features/dashboard/DashboardActionInbox";
import { DashboardAlertsPopup } from "@/features/dashboard/DashboardAlertsPopup";
import { useStudentActionTasks } from "@/features/dashboard/useStudentActionTasks";
import {
  eventsForDayIso,
  findCourseEvent,
  toDayIso,
} from "@/features/dashboard/dashboardActionUtils";
import { StudentAgendaFeed } from "./StudentAgendaFeed";
import { StudentCockpitHeader } from "./StudentCockpitHeader";
import { StudentNextCourseHero } from "./StudentNextCourseHero";
import { StudentRecentHistory } from "./StudentRecentHistory";
import { StudentStatsRow } from "./StudentStatsRow";
import { StudentTutorsPanel } from "./StudentTutorsPanel";
import { StudentUrgentBanners } from "./StudentUrgentBanners";
import {
  computeStudentDashboardStats,
  getNextStudentCourse,
  getPastStudentCourses,
  getStudentCourseEvents,
} from "./studentCockpitUtils";

interface StudentCockpitProps {
  profile: MyProfile;
  events: ScheduleEvent[];
  tutorCount: number;
}

export function StudentCockpit({
  profile,
  events,
  tutorCount,
}: StudentCockpitProps) {
  const navigate = useNavigate();
  const { tasks, isLoading: tasksLoading } = useStudentActionTasks();
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null);

  const courseEvents = getStudentCourseEvents(events);
  const nextCourse = getNextStudentCourse(events);
  const pastCourses = getPastStudentCourses(events);
  const stats = computeStudentDashboardStats(events);

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const focusMode =
    !tasksLoading &&
    todoTasks.some(
      (t) =>
        t.kind === "confirm" ||
        t.kind === "document" ||
        t.kind === "alert",
    );

  const agendaEvents = useMemo(() => {
    const base = selectedDayIso
      ? eventsForDayIso(courseEvents, selectedDayIso)
      : courseEvents;
    // Le prochain cours est déjà dans le hero — on évite le doublon dans la liste.
    if (!selectedDayIso && nextCourse) {
      return base.filter((e) => e.id !== nextCourse.id);
    }
    return base;
  }, [courseEvents, selectedDayIso, nextCourse]);

  const weekStartIso = toDayIso(
    startOfWeek(
      selectedDayIso ? new Date(`${selectedDayIso}T12:00:00`) : new Date(),
    ),
  );

  const agendaTitle = selectedDayIso
    ? `Cours du ${new Date(`${selectedDayIso}T12:00:00`).toLocaleDateString(
        "fr-FR",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
        },
      )}`
    : "Autres cours à venir";

  function openCourseFromInbox(courseId: string) {
    const event = findCourseEvent(events, courseId);
    if (event) {
      setDetailEvent(event);
      return;
    }
    navigate("/app/alertes");
  }

  return (
    <div className="space-y-6">
      <DashboardAlertsPopup />

      <StudentCockpitHeader
        firstName={profile.first_name}
        campusName={profile.campus?.name}
      />

      <DashboardActionInbox
        tasks={tasks}
        isLoading={tasksLoading}
        title="À faire"
        subtitle={
          focusMode
            ? "Traitez d’abord ces actions — le reste est en retrait"
            : "Confirmations, alertes et prochaines étapes"
        }
        hideWhenEmpty
        onOpenCourse={openCourseFromInbox}
      />

      {!focusMode ? <StudentUrgentBanners tutorCount={tutorCount} /> : null}

      <StudentNextCourseHero course={nextCourse} />

      {!focusMode ? <StudentStatsRow stats={stats} /> : null}

      <div
        className={cn(
          "grid gap-6",
          focusMode ? "lg:grid-cols-1" : "lg:grid-cols-3",
        )}
      >
        <div
          className={cn("space-y-6", focusMode ? undefined : "lg:col-span-2")}
        >
          <TeacherWeekStrip
            events={courseEvents}
            variant="student"
            selectedDayIso={selectedDayIso}
            onSelectDay={setSelectedDayIso}
            planningHref={`/app/planning?week=${weekStartIso}`}
          />
          <StudentAgendaFeed
            events={agendaEvents}
            headerTitle={agendaTitle}
            headerDescription={
              selectedDayIso
                ? "Séances du jour sélectionné — cliquez pour le détail."
                : agendaEvents.length > 0
                  ? "Les séances suivantes — cliquez pour le détail."
                  : nextCourse
                    ? "Pas d’autre séance planifiée pour l’instant."
                    : "Réservez un créneau pour voir vos prochains cours ici."
            }
            showHistory={Boolean(selectedDayIso)}
            onEventClick={setDetailEvent}
          />
          {focusMode ? (
            <p className="text-sm text-ink-500">
              Historique en retrait pendant que vous traitez vos actions.{" "}
              <Link
                to="/app/planning"
                className="font-medium text-brand-700 underline"
              >
                Voir le planning →
              </Link>
            </p>
          ) : (
            <StudentRecentHistory events={pastCourses} />
          )}
        </div>

        {!focusMode ? (
          <div className="space-y-6">
            <StudentTutorsPanel tutorCount={tutorCount} />
          </div>
        ) : null}
      </div>

      <StudentScheduleEventDetail
        event={detailEvent}
        open={detailEvent != null}
        onClose={() => setDetailEvent(null)}
        onAttendanceConfirmed={() => setDetailEvent(null)}
      />
    </div>
  );
}
