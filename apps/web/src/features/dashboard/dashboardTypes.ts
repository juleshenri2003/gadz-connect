export type DashboardTaskStatus = "todo" | "done";

/** Catégories d’inbox — alignées sur les familles d’alertes admin. */
export type DashboardTaskKind =
  | "confirm"
  | "document"
  | "onboarding"
  | "payment"
  | "alert"
  | "other";

export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  status: DashboardTaskStatus;
  href?: string;
  kind?: DashboardTaskKind;
  /** Séance liée — ouvre le détail / actions de confirmation sur place. */
  courseId?: string;
  /** CTA ouvre le cours via `onOpenCourse` plutôt que naviguer. */
  openCourse?: boolean;
  readOnly?: boolean;
  manualAction?: "inpi_sent";
}

export interface DashboardProgress {
  tasks: DashboardTask[];
  completedCount: number;
  totalCount: number;
  percent: number;
  isComplete: boolean;
}
