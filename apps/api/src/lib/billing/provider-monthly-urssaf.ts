import {
  getFiscalProfileKey,
  LIBERATOIRE_RATE,
  URSSAF_RATE_ACRE,
  URSSAF_RATE_FULL,
} from "@gadz-connect/types";
import { supabaseAdmin } from "../supabase.js";

export interface ProviderUrssafSynthesis {
  courseCount: number;
  totalInvoicedHt: number;
  totalPaidParentTtc: number;
  totalCommission: number;
  totalBaseAfterCommission: number;
  fiscalProfileLabel: string;
  urssafRateLabel: string;
  cotisationsLabel: string;
  totalUrssafCotisations: number;
  totalNetPayout: number;
  urssafPeriodicityLabel: string;
}

export interface TransactionFinancialRow {
  amount_gross: number;
  commission_sasu: number;
  taxes_urssaf: number;
  net_payout: number;
  teacher_gross_revenue?: number | null;
}

const FISCAL_PROFILE_LABELS: Record<
  ReturnType<typeof getFiscalProfileKey>,
  string
> = {
  standard: "Standard (taux plein)",
  acre: "ACRE — 1ʳᵉ année",
  liberatoire: "Versement libératoire",
  acre_liberatoire: "ACRE + versement libératoire",
};

const URSSAF_PERIODICITY_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseAmount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? round2(parsed) : 0;
}

function teacherGross(row: TransactionFinancialRow): number {
  const explicit = row.teacher_gross_revenue;
  if (explicit != null && Number.isFinite(Number(explicit))) {
    return round2(Number(explicit));
  }
  return round2(parseAmount(row.amount_gross) - parseAmount(row.commission_sasu));
}

export function formatUrssafRateLabel(input: {
  statusAcre: boolean;
  versementLiberatoire: boolean;
}): string {
  const urssafRate = input.statusAcre ? URSSAF_RATE_ACRE : URSSAF_RATE_FULL;
  const urssafPct = (urssafRate * 100).toFixed(1).replace(/\.0$/, "");
  const parts = [`${urssafPct} % URSSAF sur la base après commission`];
  if (input.versementLiberatoire) {
    const libPct = (LIBERATOIRE_RATE * 100).toFixed(1).replace(/\.0$/, "");
    parts.push(`+ ${libPct} % versement libératoire`);
  }
  return parts.join(" ");
}

export function formatFiscalProfileLabel(input: {
  statusAcre: boolean;
  versementLiberatoire: boolean;
}): string {
  const key = getFiscalProfileKey(
    input.statusAcre,
    input.versementLiberatoire,
  );
  return FISCAL_PROFILE_LABELS[key];
}

export function formatUrssafPeriodicityLabel(
  periodicity: string | null | undefined,
): string {
  if (!periodicity) return "Non renseignée";
  return URSSAF_PERIODICITY_LABELS[periodicity] ?? periodicity;
}

export function summarizeProviderTransactions(
  rows: TransactionFinancialRow[],
  fiscalProfile: {
    statusAcre: boolean;
    versementLiberatoire: boolean;
    urssafPeriodicity: string | null;
  },
  courseCount: number,
): ProviderUrssafSynthesis {
  let totalInvoicedHt = 0;
  let totalPaidParentTtc = 0;
  let totalCommission = 0;
  let totalUrssafCotisations = 0;
  let totalNetPayout = 0;

  for (const row of rows) {
    totalInvoicedHt += teacherGross(row);
    totalPaidParentTtc += parseAmount(row.amount_gross);
    totalCommission += parseAmount(row.commission_sasu);
    totalUrssafCotisations += parseAmount(row.taxes_urssaf);
    totalNetPayout += parseAmount(row.net_payout);
  }

  totalInvoicedHt = round2(totalInvoicedHt);
  totalPaidParentTtc = round2(totalPaidParentTtc);
  totalCommission = round2(totalCommission);
  totalUrssafCotisations = round2(totalUrssafCotisations);
  totalNetPayout = round2(totalNetPayout);

  const cotisationsLabel = fiscalProfile.versementLiberatoire
    ? "Cotisations estimées (URSSAF + versement libératoire)"
    : "Cotisations URSSAF estimées";

  return {
    courseCount,
    totalInvoicedHt,
    totalPaidParentTtc,
    totalCommission,
    totalBaseAfterCommission: totalInvoicedHt,
    fiscalProfileLabel: formatFiscalProfileLabel(fiscalProfile),
    urssafRateLabel: formatUrssafRateLabel(fiscalProfile),
    cotisationsLabel,
    totalUrssafCotisations,
    totalNetPayout,
    urssafPeriodicityLabel: formatUrssafPeriodicityLabel(
      fiscalProfile.urssafPeriodicity,
    ),
  };
}

export async function aggregateProviderUrssafSynthesis(input: {
  transactionIds: string[];
  providerProfileId: string;
  courseCount: number;
}): Promise<ProviderUrssafSynthesis> {
  const { transactionIds, providerProfileId, courseCount } = input;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("status_acre, versement_liberatoire, urssaf_periodicity")
    .eq("id", providerProfileId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const fiscalProfile = {
    statusAcre: Boolean(profile?.status_acre),
    versementLiberatoire: Boolean(profile?.versement_liberatoire),
    urssafPeriodicity: (profile?.urssaf_periodicity as string | null) ?? null,
  };

  if (transactionIds.length === 0) {
    return summarizeProviderTransactions([], fiscalProfile, courseCount);
  }

  const { data: transactions, error: txError } = await supabaseAdmin
    .from("transactions")
    .select(
      "id, amount_gross, commission_sasu, taxes_urssaf, net_payout, teacher_gross_revenue",
    )
    .in("id", transactionIds)
    .eq("status_stripe", "succeeded");

  if (txError) {
    throw new Error(txError.message);
  }

  const rows = (transactions ?? []).map((row) => ({
    amount_gross: parseAmount(row.amount_gross),
    commission_sasu: parseAmount(row.commission_sasu),
    taxes_urssaf: parseAmount(row.taxes_urssaf),
    net_payout: parseAmount(row.net_payout),
    teacher_gross_revenue:
      row.teacher_gross_revenue != null
        ? parseAmount(row.teacher_gross_revenue)
        : null,
  }));

  return summarizeProviderTransactions(rows, fiscalProfile, courseCount);
}
