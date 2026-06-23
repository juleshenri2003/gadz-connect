import type { FiscalCalculateInput, FiscalCalculateResult } from "@gadz-connect/types";
import { calculateCommissionSasu } from "@gadz-connect/types";

export { COMMISSION_SASU_EUR, calculateCommissionSasu } from "@gadz-connect/types";

/** Taux URSSAF micro-entreprise BNC — taux plein */
export const URSSAF_RATE_FULL = 0.211;

/** Taux URSSAF avec ACRE (1ère année) */
export const URSSAF_RATE_ACRE = 0.106;

/** Versement libératoire de l'impôt sur le revenu */
export const LIBERATOIRE_RATE = 0.022;

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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
