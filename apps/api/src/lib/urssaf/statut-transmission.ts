import type { UrssafClientStatus } from "@gadz-connect/types";
import { getUrssafApiConfig } from "./config.js";
import { urssafApiRequest } from "./client.js";
import { mockStatutTransmission } from "./mock.js";

export interface StatutTransmissionResult {
  status: UrssafClientStatus;
  urssafClientId?: string;
}

type ApiStatutResponse = {
  statut?: string;
  idClient?: string;
};

function mapApiStatus(raw: string | undefined): UrssafClientStatus {
  switch (raw?.toLowerCase()) {
    case "actif":
    case "active":
      return "actif";
    case "refuse":
    case "refused":
      return "refuse";
    case "expire":
    case "expired":
      return "expire";
    case "rattachement_en_attente":
    case "en_attente":
    case "pending":
      return "rattachement_en_attente";
    default:
      return "inscription_envoyee";
  }
}

export async function statutTransmission(
  transmissionId: string,
  profileId?: string,
): Promise<StatutTransmissionResult> {
  const config = getUrssafApiConfig();

  if (config.mock) {
    return mockStatutTransmission(transmissionId);
  }

  const response = await urssafApiRequest<ApiStatutResponse>({
    method: "GET",
    path: `/v1/transmissions/${encodeURIComponent(transmissionId)}`,
    audit: {
      profileId,
      methodLabel: "statut_transmission",
    },
  });

  if (!response.ok) {
    throw new Error(
      response.error ?? "Échec consultation statut transmission URSSAF",
    );
  }

  return {
    status: mapApiStatus(response.data?.statut),
    urssafClientId: response.data?.idClient,
  };
}
