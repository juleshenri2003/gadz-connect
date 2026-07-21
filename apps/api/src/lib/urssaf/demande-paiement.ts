import type { UrssafPaymentStatus } from "@gadz-connect/types";
import { getUrssafApiConfig } from "./config.js";
import { urssafApiRequest } from "./client.js";
import { mockDemandePaiement } from "./mock.js";

export interface DemandePaiementInput {
  profileId: string;
  courseId: string;
  transactionId: string;
  urssafClientId: string;
  amountEur: number;
  serviceDate: string;
  description: string;
}

export interface DemandePaiementResult {
  paymentRequestId: string;
  transmissionId: string;
  status: UrssafPaymentStatus;
}

type ApiDemandeResponse = {
  idDemande?: string;
  idTransmission?: string;
  statut?: string;
};

export async function transmettreDemandePaiement(
  input: DemandePaiementInput,
): Promise<DemandePaiementResult> {
  const config = getUrssafApiConfig();

  if (config.mock) {
    return mockDemandePaiement({ amount: input.amountEur });
  }

  const response = await urssafApiRequest<ApiDemandeResponse>({
    method: "POST",
    path: "/v1/demandes-paiement",
    body: {
      idClient: input.urssafClientId,
      montant: input.amountEur,
      datePrestation: input.serviceDate,
      libelle: input.description,
      reference: input.courseId,
    },
    audit: {
      profileId: input.profileId,
      courseId: input.courseId,
      transactionId: input.transactionId,
      methodLabel: "demande_paiement",
    },
  });

  if (!response.ok || !response.data?.idDemande) {
    throw new Error(
      response.error ?? "Échec transmission demande de paiement URSSAF",
    );
  }

  return {
    paymentRequestId: response.data.idDemande,
    transmissionId: response.data.idTransmission ?? "",
    status: "recue",
  };
}
