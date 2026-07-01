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
  acre_start_date: string | null;
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

/** Taux URSSAF micro-entreprise BNC — taux plein */
export const URSSAF_RATE_FULL = 0.211;

/** Taux URSSAF avec ACRE (1ère année) */
export const URSSAF_RATE_ACRE = 0.106;

/** Versement libératoire de l'impôt sur le revenu */
export const LIBERATOIRE_RATE = 0.022;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcule le découpage financier d'un cours.
 * 1. Commission Gadz'Connect (3 € fixes)
 * 2. URSSAF + versement libératoire sur le reste (base après commission)
 * 3. Net versé au prof = brut − commission − cotisations
 */
export function calculateFiscalBreakdown(
  input: FiscalCalculateInput,
): FiscalCalculateResult {
  const { amountGross, statusAcre, versementLiberatoire } = input;

  const commissionSasu = calculateCommissionSasu(amountGross);
  const baseAfterCommission = round2(amountGross - commissionSasu);

  const urssafRate = statusAcre ? URSSAF_RATE_ACRE : URSSAF_RATE_FULL;
  const taxesUrssaf = round2(baseAfterCommission * urssafRate);

  const liberatoireRate = versementLiberatoire ? LIBERATOIRE_RATE : 0;
  const taxesLiberatoire = round2(baseAfterCommission * liberatoireRate);

  const netPayout = round2(
    amountGross - commissionSasu - taxesUrssaf - taxesLiberatoire,
  );

  return {
    amountGross: round2(amountGross),
    commissionSasu,
    baseAfterCommission,
    urssafRate,
    taxesUrssaf,
    liberatoireRate,
    taxesLiberatoire,
    netPayout,
  };
}

export type FiscalProfileKey =
  | "standard"
  | "acre"
  | "liberatoire"
  | "acre_liberatoire";

export function getFiscalProfileKey(
  statusAcre: boolean,
  versementLiberatoire: boolean,
): FiscalProfileKey {
  if (statusAcre && versementLiberatoire) return "acre_liberatoire";
  if (statusAcre) return "acre";
  if (versementLiberatoire) return "liberatoire";
  return "standard";
}

/** Durée de l'ACRE micro-entreprise (mois glissants à partir du début). */
export const ACRE_DURATION_MONTHS = 12;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Ancre en UTC minuit pour éviter les décalages de fuseau.
  const date = new Date(`${trimmed.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date de fin de l'ACRE = début + 12 mois. Null si pas de date de début. */
export function getAcreEndDate(
  startDate: string | null | undefined,
): Date | null {
  const start = parseDateOnly(startDate);
  if (!start) return null;
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + ACRE_DURATION_MONTHS);
  return end;
}

/**
 * ACRE encore active à la date de référence (défaut : maintenant).
 * Nécessite une date de début ; l'ACRE couvre [début, début + 12 mois).
 */
export function isAcreActive(
  startDate: string | null | undefined,
  reference: Date = new Date(),
): boolean {
  const start = parseDateOnly(startDate);
  const end = getAcreEndDate(startDate);
  if (!start || !end) return false;
  const refMs = reference.getTime();
  return refMs >= start.getTime() && refMs < end.getTime();
}

/** Nombre de jours d'ACRE restants (0 si absente ou expirée). */
export function getAcreDaysRemaining(
  startDate: string | null | undefined,
  reference: Date = new Date(),
): number {
  const end = getAcreEndDate(startDate);
  if (!end) return 0;
  const diffMs = end.getTime() - reference.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / MS_PER_DAY);
}

/**
 * ACRE effective = accordée (statusAcre) ET dans la fenêtre de 12 mois.
 * Si aucune date de début n'est renseignée, on retombe sur le booléen brut
 * (compatibilité avec les profils existants avant la migration 023).
 */
export function resolveEffectiveAcre(input: {
  statusAcre: boolean;
  acreStartDate: string | null | undefined;
  referenceDate?: Date;
}): boolean {
  if (!input.statusAcre) return false;
  if (!input.acreStartDate) return true;
  return isAcreActive(input.acreStartDate, input.referenceDate ?? new Date());
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
