export type UserRole =
  | "student_provider"
  | "teacher"
  | "admin_campus"
  | "admin_general";

export type AccountStatus = "pending_siret" | "active" | "suspended";

export type CourseStatus = "scheduled" | "completed" | "cancelled";

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
  status_acre: boolean;
  versement_liberatoire: boolean;
  account_status: AccountStatus;
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
