export type DashboardTaskStatus = "todo" | "done";

export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  status: DashboardTaskStatus;
  href?: string;
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
