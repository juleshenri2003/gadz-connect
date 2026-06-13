import type {
  AccountStatus,
  TransactionStripeStatus,
  TransactionUrssafStatus,
  UserRole,
} from "@gadz-connect/types";

export interface AdminProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  campus_id: string;
  siret: string | null;
  account_status: AccountStatus;
  micro_enterprise_activity: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_complete: boolean;
  registration_path: string | null;
  siret_verification_failed?: boolean;
  created_at: string;
  campus: { name: string } | null;
  email?: string | null;
  last_sign_in_at?: string | null;
  siret_is_duplicate?: boolean;
}

export interface AdminProfilesMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminProfileDetail extends AdminProfileRow {
  status_acre: boolean;
  versement_liberatoire: boolean;
  urssaf_periodicity: string | null;
  profile_setup_complete: boolean;
  bio: string | null;
  hourly_rate: number | null;
  subjects: string[] | null;
  inpi_declaration_sent_at: string | null;
  updated_at: string;
  coursesAsProvider: number;
  coursesAsClient: number;
}

export interface AdminProfilesQueryParams {
  search?: string;
  role?: UserRole | "admin";
  account_status?: AccountStatus;
  campus_id?: string;
  filter?: string;
  page?: number;
  limit?: number;
}

export interface AdminStripeAccountsSummary {
  total: number;
  withAccount: number;
  onboardingComplete: number;
  pending: number;
  withoutAccount: number;
}

export interface AdminRecentProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
  campus: { name: string } | null;
}

export interface AdminCampusBreakdownRow {
  campusId: string;
  name: string;
  teachersActive: number;
  studentsActive: number;
  coursesScheduled: number;
  pendingSiret: number;
}

export interface AdminCourseRow {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  scheduled_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  campus_id: string;
  provider_id: string | null;
  client_id: string | null;
  campus: { name: string } | null;
  provider_name: string | null;
  client_name: string | null;
  has_summary: boolean;
  missing_summary: boolean;
  stripe_status: string | null;
  replacement_notification_id: string | null;
  replacement_proposal_count: number;
  created_at: string;
}

export interface AdminCourseDetail extends AdminCourseRow {
  description: string | null;
  summary_id: string | null;
  transaction_id: string | null;
}

export interface AdminCoursesMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCoursesSummary {
  total: number;
  byStatus: Record<string, number>;
  thisWeekScheduled: number;
  awaitingReplacement: number;
  missingSummaries: number;
  cancelled: number;
}

export type AdminCoursePreset =
  | "missing_summary"
  | "awaiting_replacement"
  | "this_week"
  | "cancelled";

export interface AdminCoursesQueryParams {
  search?: string;
  status?: string;
  campus_id?: string;
  from?: string;
  to?: string;
  preset?: AdminCoursePreset;
  page?: number;
  limit?: number;
  sort?: "scheduled_at_desc" | "scheduled_at_asc" | "status";
}

export interface AdminDashboardData {
  scope: "campus" | "global";
  profiles: {
    total: number;
    byStatus: Record<AccountStatus, number>;
    byRole: Record<string, number>;
    byRoleAndStatus: Record<string, Record<AccountStatus, number>>;
  };
  courses: {
    total: number;
    byStatus: Record<string, number>;
    thisWeekScheduled: number;
    recent: Array<{
      id: string;
      title: string;
      status: string;
      created_at: string;
      campus: { name: string } | null;
    }>;
  };
  transactions: {
    total: number;
    byStripeStatus: Record<string, number>;
  };
  budgets: {
    volumeBrut: number;
    volumeCommissions: number;
    volumeUrssaf: number;
    volumeNetVerse: number;
    encaisseBrut: number;
    encaisseNet: number;
    enAttenteBrut: number;
  };
  stripeAccounts: AdminStripeAccountsSummary;
  stripeAccountsTeachers: AdminStripeAccountsSummary;
  onboarding: {
    existingSiret: number;
    newMicro: number;
    verificationFailed: number;
    inpiSent: number;
  };
  recentProfiles: AdminRecentProfileRow[];
  marketplace: {
    visibleTeachers: number;
    activeTeachers: number;
    withFutureSlots: number;
  };
  byCampus?: AdminCampusBreakdownRow[];
}

export interface AdminMe {
  id: string;
  role: UserRole;
  campus_id: string;
  first_name: string;
  last_name: string;
}

export type AdminBudgetPeriod = "month" | "week" | "30d" | "all";

export interface AdminStatusAggregate {
  count: number;
  amountGross: number;
  amountNet: number;
}

export interface AdminBudgetTotals {
  volumeBrut: number;
  volumeCommissions: number;
  volumeUrssaf: number;
  volumeNetVerse: number;
  encaisseBrut: number;
  encaisseNet: number;
  enAttenteBrut: number;
  enAttenteNet: number;
  urssafToDeclare: number;
  urssafToDeclareCount: number;
}

export interface AdminBudgetCampusFinancialRow {
  campusId: string;
  name: string;
  encaisseNet: number;
  enAttenteBrut: number;
  commission: number;
  transactionCount: number;
}

export interface AdminBudgetData {
  scope: "campus" | "global";
  period: AdminBudgetPeriod;
  periodLabel: string;
  budgets: AdminBudgetTotals;
  allTime: Pick<
    AdminBudgetTotals,
    | "volumeBrut"
    | "encaisseNet"
    | "encaisseBrut"
    | "volumeCommissions"
    | "volumeUrssaf"
  >;
  byStripeStatus: Record<string, AdminStatusAggregate>;
  byUrssafStatus: Record<string, AdminStatusAggregate>;
  transactionsTotal: number;
  byCampus?: AdminBudgetCampusFinancialRow[];
}

export interface AdminBudgetQueryParams {
  period?: AdminBudgetPeriod;
  campus_id?: string;
}

export interface AdminTransactionsQueryParams extends AdminBudgetQueryParams {
  status_stripe?: TransactionStripeStatus;
  status_urssaf?: TransactionUrssafStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminTransactionCourse {
  id: string;
  title: string;
  subject: string | null;
  scheduled_at: string | null;
  campus: { id: string; name: string } | null;
  provider: { first_name: string; last_name: string } | null;
  client: { first_name: string; last_name: string } | null;
}

export interface AdminTransactionRow {
  id: string;
  amount_gross: number;
  commission_sasu: number;
  taxes_urssaf: number;
  net_payout: number;
  status_stripe: TransactionStripeStatus;
  status_urssaf: TransactionUrssafStatus;
  created_at: string;
  course: AdminTransactionCourse;
}

export interface AdminTransactionsMeta {
  total: number;
  page: number;
  pageSize: number;
}
