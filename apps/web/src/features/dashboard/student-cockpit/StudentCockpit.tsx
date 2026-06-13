import type { MyProfile } from "@/features/auth/useMyProfile";
import type { ScheduleEvent } from "@/features/scheduling/types";
import { TeacherWeekStrip } from "@/features/dashboard/teacher-cockpit/TeacherWeekStrip";
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
  const courseEvents = getStudentCourseEvents(events);
  const nextCourse = getNextStudentCourse(events);
  const pastCourses = getPastStudentCourses(events);
  const stats = computeStudentDashboardStats(events);

  return (
    <div className="space-y-6">
      <StudentCockpitHeader
        firstName={profile.first_name}
        campusName={profile.campus?.name}
      />

      <StudentUrgentBanners tutorCount={tutorCount} />

      <StudentNextCourseHero course={nextCourse} />

      <StudentStatsRow stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TeacherWeekStrip events={courseEvents} variant="student" />
          <StudentAgendaFeed events={courseEvents} />
          <StudentRecentHistory events={pastCourses} />
        </div>

        <div className="space-y-6">
          <StudentTutorsPanel tutorCount={tutorCount} />
        </div>
      </div>
    </div>
  );
}
