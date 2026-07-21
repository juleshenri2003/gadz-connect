import type { UrssafPaymentStatus } from "@gadz-connect/types";
import { getUrssafApiConfig } from "./config.js";
import { urssafApiRequest } from "./client.js";
import { mockConsulterDemande } from "./mock.js";

export interface ConsulterDemandeResult {
  status: UrssafPaymentStatus;
  paidAt?: string;
}

type ApiConsultResponse = {
  statut?: string;
  dateVirement?: string;
};

function mapPaymentStatus(raw: string | undefined): UrssafPaymentStatus {
  switch (raw?.toLowerCase()) {
    case "recue":
    case "received":
      return "recue";
    case "en_attente_validation":
    case "en_attente":
    case "pending_validation":
      return "en_attente_validation";
    case "validee":
    case "validated":
      return "validee";
    case "virement_effectue":
    case "transferred":
      return "virement_effectue";
    case "paye":
    case "paid":
      return "paye";
    case "rejetee":
    case "rejected":
      return "rejetee";
    default:
      return "recue";
  }
}

export async function consulterDemandePaiement(
  paymentRequestId: string,
  audit?: {
    profileId?: string;
    courseId?: string;
    transactionId?: string;
  },
): Promise<ConsulterDemandeResult> {
  const config = getUrssafApiConfig();

  if (config.mock) {
    return mockConsulterDemande(paymentRequestId);
  }

  const response = await urssafApiRequest<ApiConsultResponse>({
    method: "GET",
    path: `/v1/demandes-paiement/${encodeURIComponent(paymentRequestId)}`,
    audit: {
      profileId: audit?.profileId,
      courseId: audit?.courseId,
      transactionId: audit?.transactionId,
      methodLabel: "consulter_demande",
    },
  });

  if (!response.ok) {
    throw new Error(
      response.error ?? "Échec consultation demande de paiement URSSAF",
    );
  }

  return {
    status: mapPaymentStatus(response.data?.statut),
    paidAt: response.data?.dateVirement,
  };
}
