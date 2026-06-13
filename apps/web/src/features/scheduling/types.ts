export type ScheduleEventKind = "course" | "slot_available" | "slot_booked";

export interface ScheduleEvent {
  id: string;
  courseId?: string;
  slotId?: string;
  clientId?: string;
  hasSummary?: boolean;
  summaryId?: string;
  folderId?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  kind: ScheduleEventKind;
  status?: string;
  counterpartName?: string;
  providerId?: string;
  providerName?: string;
  clientName?: string;
  campusId?: string;
  campusName?: string;
  replacementNotificationId?: string;
  replacementProposalCount?: number;
}

export interface ScheduleQueryOptions {
  from?: string;
  to?: string;
  includeCancelled?: boolean;
}

export interface AdminScheduleQueryOptions extends ScheduleQueryOptions {
  campusId?: string;
  status?: string[];
  search?: string;
}

export interface AdminScheduleSummary {
  totalSessions: number;
  byStatus: Record<string, number>;
  byCampus: Array<{ campusId: string; campusName: string; count: number }>;
  awaitingReplacement: number;
  openReplacements: number;
  missingSummaries: number;
  openSlots?: number;
}
