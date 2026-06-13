import { useEffect, useState } from "react";

const VIEW_STORAGE_KEY = "gadz-teacher-schedule-view";
const STUDENT_VIEW_STORAGE_KEY = "gadz-student-schedule-view";

export type TeacherScheduleViewMode = "week" | "list";

export function useTeacherScheduleView(
  defaultView: TeacherScheduleViewMode = "week",
) {
  const [view, setViewState] = useState<TeacherScheduleViewMode>(() => {
    if (typeof window === "undefined") return defaultView;
    const stored = sessionStorage.getItem(VIEW_STORAGE_KEY);
    return stored === "list" || stored === "week" ? stored : defaultView;
  });

  useEffect(() => {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  function setView(next: TeacherScheduleViewMode) {
    setViewState(next);
  }

  return { view, setView };
}

export function useShowScheduleHistory(defaultValue = false) {
  const [showHistory, setShowHistory] = useState(defaultValue);
  return { showHistory, setShowHistory };
}

export function useStudentScheduleView(
  defaultView: TeacherScheduleViewMode = "week",
) {
  const [view, setViewState] = useState<TeacherScheduleViewMode>(() => {
    if (typeof window === "undefined") return defaultView;
    const stored = sessionStorage.getItem(STUDENT_VIEW_STORAGE_KEY);
    return stored === "list" || stored === "week" ? stored : defaultView;
  });

  useEffect(() => {
    sessionStorage.setItem(STUDENT_VIEW_STORAGE_KEY, view);
  }, [view]);

  function setView(next: TeacherScheduleViewMode) {
    setViewState(next);
  }

  return { view, setView };
}
