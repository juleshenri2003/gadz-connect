import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { useTeacherActionTasks } from "@/features/dashboard/useTeacherActionTasks";
import { useMyTutorProfile } from "@/features/marketplace/useTutors";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
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

function TeacherUrgentStrip() {
  const { tasks, isLoading, showBanner } = useTeacherActionTasks();

  if (isLoading || !showBanner || tasks.length === 0) return null;

  const urgent = tasks.slice(0, 3);

  return (
    <section className="rounded-md border border-warning/20 bg-warning-bg/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-warning">
        À traiter
      </p>
      <ul className="mt-3 space-y-2">
        {urgent.map((task) => (
          <li
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-ink-900">{task.title}</p>
              {task.description ? (
                <p className="mt-0.5 text-ink-600">{task.description}</p>
              ) : null}
            </div>
            {task.href ? (
              task.href.startsWith("http") ? (
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={task.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Traiter →
                  </a>
                </Button>
              ) : (
                <Button size="sm" variant="outline" asChild>
                  <Link to={task.href}>Traiter →</Link>
                </Button>
              )
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TeacherCockpit() {
  const { profile, schedule } = useProviderProgress();
  const { data: tutorProfile } = useMyTutorProfile();
  const {
    data: financial,
    isLoading: financialLoading,
    isError: financialError,
  } = useTeacherFinancial();

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

  return (
    <div className="space-y-6">
      <TeacherCockpitHeader
        firstName={profile.first_name}
        campusName={profile.campus?.name}
      />

      <TeacherUrgentStrip />
      <TeacherMarketplaceVisibility marketplace={tutorProfile?.marketplace} />
      <TeacherNextSessionHero
        session={nextSession}
        estimatedNet={estimatedNet}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TeacherWeekStrip events={allEvents} />
          <TeacherCoursesSummaryCards />
          <TeacherAgendaFeed events={upcomingEvents} />
          <TeacherRecentHistory events={pastEvents} />
        </div>

        <TeacherFinancialPanel
          financial={financial}
          isLoading={financialLoading}
          isError={financialError}
        />
      </div>
    </div>
  );
}
