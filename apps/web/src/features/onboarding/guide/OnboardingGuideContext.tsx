import { useAuth } from "@/features/auth/AuthProvider";
import type { DashboardProgress, DashboardTask } from "@/features/dashboard/dashboardTypes";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RegistrationPath } from "@gadz-connect/types";

const LAST_STEP_PREFIX = "gadz_last_onboarding_step_";

function getLastStepKey(userId: string): string {
  return `${LAST_STEP_PREFIX}${userId}`;
}

export function saveLastOnboardingStep(userId: string, taskId: string): void {
  try {
    localStorage.setItem(getLastStepKey(userId), taskId);
  } catch {
    // ignore
  }
}

export function getLastOnboardingStep(userId: string): string | null {
  try {
    return localStorage.getItem(getLastStepKey(userId));
  } catch {
    return null;
  }
}

function getCurrentTaskIndex(tasks: DashboardTask[]): number {
  const firstTodo = tasks.findIndex((task) => task.status !== "done");
  return firstTodo === -1 ? Math.max(0, tasks.length - 1) : firstTodo;
}

interface OnboardingGuideContextValue {
  open: boolean;
  openGuide: () => void;
  openGuideAt: (taskId: string) => void;
  closeGuide: () => void;
  progress: DashboardProgress | null;
  registrationPath: RegistrationPath | null;
  isStudentRole: boolean;
  isLoading: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  currentTaskIndex: number;
  lastOnboardingStepId: string | null;
}

const OnboardingGuideContext = createContext<OnboardingGuideContextValue | null>(
  null,
);

export function OnboardingGuideProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const {
    progress,
    registrationPath,
    isStudentRole,
    isLoading,
  } = useProviderProgress();

  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoOpenAttempted, setAutoOpenAttempted] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const prevCompletedCountRef = useRef(0);

  const currentTaskIndex = progress
    ? getCurrentTaskIndex(progress.tasks)
    : 0;

  const lastOnboardingStepId = user?.id
    ? getLastOnboardingStep(user.id)
    : null;

  const openGuide = useCallback(() => {
    if (progress) {
      setSelectedIndex(getCurrentTaskIndex(progress.tasks));
    }
    setOpen(true);
  }, [progress]);

  const openGuideAt = useCallback(
    (taskId: string) => {
      if (user?.id) saveLastOnboardingStep(user.id, taskId);
      if (progress) {
        const index = progress.tasks.findIndex((task) => task.id === taskId);
        if (index >= 0) {
          setSelectedIndex(index);
        } else {
          setSelectedIndex(getCurrentTaskIndex(progress.tasks));
        }
      }
      setOpen(true);
    },
    [progress, user?.id],
  );

  const closeGuide = useCallback(() => {
    setDismissedThisSession(true);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (authLoading || isLoading || !progress || autoOpenAttempted) return;

    if (progress.isComplete) {
      setAutoOpenAttempted(true);
      return;
    }

    if (!user?.id) return;

    setAutoOpenAttempted(true);

    if (dismissedThisSession) return;

    setSelectedIndex(getCurrentTaskIndex(progress.tasks));
    setOpen(true);
  }, [
    progress,
    isLoading,
    authLoading,
    autoOpenAttempted,
    user?.id,
    dismissedThisSession,
  ]);

  useEffect(() => {
    if (!open || !progress) return;
    setSelectedIndex((prev) => {
      if (prev >= progress.tasks.length) {
        return getCurrentTaskIndex(progress.tasks);
      }
      return prev;
    });
  }, [open, progress]);

  useEffect(() => {
    if (!open || !progress) return;
    if (progress.completedCount > prevCompletedCountRef.current) {
      setSelectedIndex(getCurrentTaskIndex(progress.tasks));
    }
    prevCompletedCountRef.current = progress.completedCount;
  }, [open, progress]);

  const value = useMemo(
    () => ({
      open,
      openGuide,
      openGuideAt,
      closeGuide,
      progress,
      registrationPath,
      isStudentRole,
      isLoading,
      selectedIndex,
      setSelectedIndex,
      currentTaskIndex,
      lastOnboardingStepId,
    }),
    [
      open,
      openGuide,
      openGuideAt,
      closeGuide,
      progress,
      registrationPath,
      isStudentRole,
      isLoading,
      selectedIndex,
      currentTaskIndex,
      lastOnboardingStepId,
    ],
  );

  return (
    <OnboardingGuideContext.Provider value={value}>
      {children}
    </OnboardingGuideContext.Provider>
  );
}

export function useOnboardingGuide(): OnboardingGuideContextValue {
  const context = useContext(OnboardingGuideContext);
  if (!context) {
    throw new Error(
      "useOnboardingGuide doit être utilisé dans OnboardingGuideProvider",
    );
  }
  return context;
}
