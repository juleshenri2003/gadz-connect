import {
  calculateFiscalBreakdown,
  getFiscalProfileKey,
  type FiscalCalculateResult,
  type FiscalProfileKey,
} from "@gadz-connect/types";

export interface FiscalProfileDefinition {
  key: FiscalProfileKey;
  statusAcre: boolean;
  versementLiberatoire: boolean;
  label: string;
  shortLabel: string;
  description: string;
  urssafHint: string;
  liberatoireHint: string;
}

export const FISCAL_PROFILES: FiscalProfileDefinition[] = [
  {
    key: "standard",
    statusAcre: false,
    versementLiberatoire: false,
    label: "Profil standard",
    shortLabel: "Standard",
    description:
      "Taux URSSAF plein (21,1 %) sur la base après commission. L'impôt sur le revenu se déclare séparément, hors plateforme.",
    urssafHint: "URSSAF 21,1 % — taux micro-entreprise BNC classique",
    liberatoireHint: "Pas de versement libératoire",
  },
  {
    key: "acre",
    statusAcre: true,
    versementLiberatoire: false,
    label: "Profil ACRE (1ʳᵉ année)",
    shortLabel: "ACRE",
    description:
      "Exonération partielle des cotisations la première année : URSSAF à 10,6 % au lieu de 21,1 %. Réservé si vous avez obtenu l'ACRE auprès de l'URSSAF.",
    urssafHint: "URSSAF 10,6 % — réduction ACRE 12 mois",
    liberatoireHint: "Pas de versement libératoire",
  },
  {
    key: "liberatoire",
    statusAcre: false,
    versementLiberatoire: true,
    label: "Profil versement libératoire",
    shortLabel: "Libératoire",
    description:
      "URSSAF au taux plein, plus 2,2 % de versement libératoire : une partie de l'impôt sur le revenu est réglée en même temps que vos cotisations.",
    urssafHint: "URSSAF 21,1 % — taux plein",
    liberatoireHint: "Versement libératoire +2,2 % sur la base après commission",
  },
  {
    key: "acre_liberatoire",
    statusAcre: true,
    versementLiberatoire: true,
    label: "Profil ACRE + versement libératoire",
    shortLabel: "ACRE + libératoire",
    description:
      "Combine l'URSSAF réduite ACRE (10,6 %) et le versement libératoire (+2,2 %). Le net est plus élevé qu'en standard, mais l'impôt est en partie prélevé à la source.",
    urssafHint: "URSSAF 10,6 % — réduction ACRE 12 mois",
    liberatoireHint: "Versement libératoire +2,2 % sur la base après commission",
  },
];

export function getFiscalProfileDefinition(
  statusAcre: boolean,
  versementLiberatoire: boolean,
): FiscalProfileDefinition {
  const key = getFiscalProfileKey(statusAcre, versementLiberatoire);
  return FISCAL_PROFILES.find((profile) => profile.key === key)!;
}

export function breakdownForProfile(
  amountGross: number,
  statusAcre: boolean,
  versementLiberatoire: boolean,
): FiscalCalculateResult {
  return calculateFiscalBreakdown({
    amountGross,
    statusAcre,
    versementLiberatoire,
  });
}

export function formatUrssafRatePercent(rate: number): string {
  return `${(rate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}
