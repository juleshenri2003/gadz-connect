import { AdminScheduleEventDetail } from "@/features/scheduling/AdminScheduleEventDetail";
import type { AdminCourseRow } from "@/features/admin/types";
import { useAdminCourseDetail } from "@/features/admin/useAdmin";
import { courseRowToScheduleEvent } from "./courseUtils";

interface CourseDetailDrawerProps {
  courseId: string | null;
  listCourse: AdminCourseRow | null;
  onClose: () => void;
}

export function CourseDetailDrawer({
  courseId,
  listCourse,
  onClose,
}: CourseDetailDrawerProps) {
  const { data: detail } = useAdminCourseDetail(courseId);

  if (!courseId) return null;

  const source = detail ?? listCourse;
  if (!source) return null;

  return (
    <AdminScheduleEventDetail
      event={courseRowToScheduleEvent(source)}
      open
      onClose={onClose}
    />
  );
}
