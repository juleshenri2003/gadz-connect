import { getUrssafApiConfig, isUrssafApiOperational } from "./config.js";
import { getUrssafClientByProfileId, isUrssafClientActive } from "./enrollment.js";

export interface UrssafBookingEligibility {
  eligible: boolean;
  reason?: string;
}

/** Vérifie si un payeur peut utiliser l'avance immédiate pour une réservation. */
export async function checkUrssafBookingEligibility(input: {
  payerProfileId: string;
  isHomeVisit: boolean;
}): Promise<UrssafBookingEligibility> {
  const config = getUrssafApiConfig();

  if (!isUrssafApiOperational()) {
    return {
      eligible: false,
      reason: "L'avance immédiate n'est pas encore disponible",
    };
  }

  if (!input.isHomeVisit) {
    return {
      eligible: false,
      reason:
        "L'avance immédiate s'applique uniquement aux cours en présentiel au domicile de l'élève",
    };
  }

  const client = await getUrssafClientByProfileId(input.payerProfileId);
  if (!isUrssafClientActive(client)) {
    return {
      eligible: false,
      reason: "Compte URSSAF non actif — paiement classique par carte",
    };
  }

  if (!config.enabled && config.mock) {
    return { eligible: true };
  }

  if (!config.enabled) {
    return { eligible: false, reason: "API URSSAF désactivée" };
  }

  return { eligible: true };
}
