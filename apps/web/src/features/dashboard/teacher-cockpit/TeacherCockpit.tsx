import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@gadz-connect/ui";
import { useMyTutorProfile } from "@/features/marketplace/useTutors";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import { TeacherScheduleEventDetail } from "@/features/scheduling/TeacherScheduleEventDetail";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { DashboardActionInbox } from "@/features/dashboard/DashboardActionInbox";
import { DashboardAlertsPopup } from "@/features/dashboard/DashboardAlertsPopup";
import { useTeacherActionTasks } from "@/features/dashboard/useTeacherActionTasks";
import {
  eventsForDayIso,
  findCourseEvent,
  toDayIso,
} from "@/features/dashboard/dashboardActionUtils";
import { startOfWeek } from "@/features/scheduling/calendar-utils";
import { TeacherAgendaFeed } from "./TeacherAgendaFeed";
import { TeacherCockpitHeader } from "./TeacherCockpitHeader";
import { TeacherCoursesSummaryCards } from "./TeacherCoursesSummaryCards";
import { TeacherFinancialPanel } from "./TeacherFinancialPanel";
import { TeacherMarketplaceVisibility } from "./TeacherMarketplaceVisibility";
import { TeacherNextSessionHero } from "./TeacherNextSessionHero";
import { TeacherRecentHistory } from "./TeacherRecentHistory";
import { TeacherWeekStrip } from "./TeacherWeekStrip";
import {
  estimateSessionNet,
  getNextSession,
  getPastEvents,
  getUpcomingEvents,
} from "./teacherCockpitUtils";
import { useTeacherFinancial } from "./useTeacherFinancial";

export function TeacherCockpit() {
  const navigate = useNavigate();
  const { profile, schedule } = useProviderProgress();
  const { data: tutorProfile } = useMyTutorProfile();
  const { tasks, isLoading: tasksLoading } = useTeacherActionTasks();
  const {
    data: financial,
    isLoading: financialLoading,
    isError: financialError,
  } = useTeacherFinancial();

  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null);

  if (!profile) return null;

  const allEvents = schedule?.events ?? [];
  const upcomingEvents = getUpcomingEvents(allEvents);
  const pastEvents = getPastEvents(allEvents);
  const nextSession = getNextSession(upcomingEvents);
  const estimatedNet = nextSession
    ? estimateSessionNet(
        nextSession,
        profile.hourly_rate,
        profile.status_acre,
        profile.versement_liberatoire,
      )
    : null;

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const focusMode =
    !tasksLoading &&
    todoTasks.some(
      (t) =>
        t.kind === "confirm" ||
        t.kind === "document" ||
        t.kind === "alert",
    );

  const agendaSource = selectedDayIso
    ? eventsForDayIso(allEvents, selectedDayIso)
    : upcomingEvents;

  const weekStartIso = toDayIso(
    startOfWeek(
      selectedDayIso
        ? new Date(`${selectedDayIso}T12:00:00`)
        : new Date(),
    ),
  );

  const agendaTitle = selectedDayIso
    ? `Agenda du ${new Date(`${selectedDayIso}T12:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}`
    : "Agenda à venir";

  const marketplace = tutorProfile?.marketplace;
  const showMarketplacePanel = marketplace && !marketplace.visible;

  function openCourseFromInbox(courseId: string) {
    const event = findCourseEvent(allEvents, courseId);
    if (event) {
      setDetailEvent(event);
      return;
    }
    navigate("/app/alertes");
  }

  return (
    <div className="space-y-6">
      <DashboardAlertsPopup />

      <TeacherCockpitHeader
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
            : "Paiements, confirmations, résumés et alertes"
        }
        onOpenCourse={openCourseFromInbox}
      />

      <TeacherNextSessionHero
        session={nextSession}
        estimatedNet={estimatedNet}
      />

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
            events={allEvents}
            selectedDayIso={selectedDayIso}
            onSelectDay={setSelectedDayIso}
            planningHref={`/app/planning?week=${weekStartIso}`}
          />
          <TeacherAgendaFeed
            events={agendaSource}
            headerTitle={agendaTitle}
            headerDescription={
              selectedDayIso
                ? "Séances et créneaux du jour — cliquez pour le détail."
                : "Sessions confirmées et créneaux publiés — cliquez pour le détail."
            }
            showHistory={Boolean(selectedDayIso)}
            onEventClick={setDetailEvent}
          />
          {!focusMode ? <TeacherCoursesSummaryCards /> : null}
          {focusMode ? (
            <p className="text-sm text-ink-500">
              Historique en retrait pendant que vous traitez vos actions.{" "}
              <Link
                to="/app/cours?tab=history"
                className="font-medium text-brand-700 underline"
              >
                Voir les cours passés →
              </Link>
            </p>
          ) : (
            <TeacherRecentHistory events={pastEvents} />
          )}
          {!focusMode && showMarketplacePanel ? (
            <TeacherMarketplaceVisibility marketplace={marketplace} />
          ) : null}
        </div>

        {!focusMode ? (
          <TeacherFinancialPanel
            financial={financial}
            isLoading={financialLoading}
            isError={financialError}
          />
        ) : null}
      </div>

      <TeacherScheduleEventDetail
        event={detailEvent}
        open={detailEvent != null}
        onClose={() => setDetailEvent(null)}
        onAttendanceConfirmed={() => setDetailEvent(null)}
        hourlyRate={profile.hourly_rate}
        statusAcre={profile.status_acre}
        versementLiberatoire={profile.versement_liberatoire}
      />
    </div>
  );
}
