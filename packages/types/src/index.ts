export type UserRole =
  | "student_provider"
  | "teacher"
  | "admin_campus"
  | "admin_general";

export type AccountStatus = "pending_siret" | "active" | "suspended";

export type RegistrationPath = "existing_siret" | "new_micro";

export type CourseStatus =
  | "scheduled"
  | "payment_pending"
  | "completed"
  | "cancelled";

export type TransactionStripeStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded";

export type TransactionUrssafStatus = "pending" | "declared";

export interface Campus {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  campus_id: string;
  siret: string | null;
  is_autoentrepreneur_verified: boolean;
  micro_enterprise_address: string | null;
  status_acre: boolean;
  versement_liberatoire: boolean;
  account_status: AccountStatus;
  registration_path: RegistrationPath | null;
  siret_verification_failed: boolean;
  micro_enterprise_activity: MicroEnterpriseActivity | null;
  urssaf_periodicity: UrssafPeriodicity | null;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  campus_id: string;
  provider_id: string;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  course_id: string;
  amount_gross: number;
  commission_sasu: number;
  taxes_urssaf: number;
  net_payout: number;
  status_stripe: TransactionStripeStatus;
  status_urssaf: TransactionUrssafStatus;
  created_at: string;
}

export interface FiscalCalculateInput {
  amountGross: number;
  statusAcre: boolean;
  versementLiberatoire: boolean;
}

/** Commission fixe Gadz'Connect (€) — prélevée sur chaque cours avant cotisations. */
export const COMMISSION_SASU_EUR = 3;

export function calculateCommissionSasu(amountGross: number): number {
  const gross = Math.max(0, amountGross);
  return Math.min(COMMISSION_SASU_EUR, Math.round(gross * 100) / 100);
}

export interface FiscalCalculateResult {
  amountGross: number;
  commissionSasu: number;
  baseAfterCommission: number;
  urssafRate: number;
  taxesUrssaf: number;
  liberatoireRate: number;
  taxesLiberatoire: number;
  netPayout: number;
}

export type UrssafPeriodicity = "monthly" | "quarterly";

export type MicroEnterpriseActivity =
  | "enseignement"
  | "conseil"
  | "prestation_intellectuelle";

export interface OnboardingMicroEnterpriseForm {
  activity: MicroEnterpriseActivity;
  urssafPeriodicity: UrssafPeriodicity;
  versementLiberatoire: boolean;
}

export interface TeacherFinancialMonthSummary {
  encaisseBrut: number;
  encaisseNet: number;
  enAttenteBrut: number;
  enAttenteNet: number;
  coursTermines: number;
}

export interface TeacherFinancialAllTimeSummary {
  encaisseNet: number;
  volumeBrut: number;
}

export interface TeacherFinancialForecast {
  brut: number;
  net: number;
  count: number;
}

export interface TeacherFinancialUrssafSummary {
  due: boolean;
  periodicity: UrssafPeriodicity | null;
  amountToDeclare: number;
  undeclaredCount: number;
}

export interface TeacherFinancialSummary {
  month: TeacherFinancialMonthSummary;
  allTime: TeacherFinancialAllTimeSummary;
  forecast: TeacherFinancialForecast;
  urssaf: TeacherFinancialUrssafSummary;
}

export interface TeacherTransactionCourse {
  id: string;
  subject: string | null;
  title: string;
  scheduled_at: string | null;
  client: { first_name: string; last_name: string } | null;
}

export interface TeacherTransactionItem {
  id: string;
  amount_gross: number;
  commission_sasu: number;
  taxes_urssaf: number;
  net_payout: number;
  status_stripe: TransactionStripeStatus;
  status_urssaf: TransactionUrssafStatus;
  created_at: string;
  course: TeacherTransactionCourse;
}

export type InvoiceType = "parent" | "student";

export interface PaymentInvoice {
  id: string;
  transaction_id: string;
  course_id: string;
  invoice_type: InvoiceType;
  invoice_number: string;
  amount: number;
  storage_path: string;
  provider_profile_id: string | null;
  client_profile_id: string | null;
  parent_email_sent_at: string | null;
  created_at: string;
}
