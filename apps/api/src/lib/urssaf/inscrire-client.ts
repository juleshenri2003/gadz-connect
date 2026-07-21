import type { UrssafClientStatus } from "@gadz-connect/types";
import { getUrssafApiConfig } from "./config.js";
import { urssafApiRequest } from "./client.js";
import { mockInscrireClient } from "./mock.js";

export interface InscrireClientInput {
  profileId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  fiscalAddress: string;
  iban: string;
  nir?: string;
}

export interface InscrireClientResult {
  urssafClientId: string;
  transmissionId: string;
  status: UrssafClientStatus;
}

type ApiInscrireResponse = {
  idClient?: string;
  idTransmission?: string;
  statut?: string;
};

export async function inscrireClient(
  input: InscrireClientInput,
): Promise<InscrireClientResult> {
  const config = getUrssafApiConfig();

  if (config.mock) {
    return mockInscrireClient({ profileId: input.profileId });
  }

  const response = await urssafApiRequest<ApiInscrireResponse>({
    method: "POST",
    path: "/v1/clients",
    body: {
      prenom: input.firstName,
      nom: input.lastName,
      dateNaissance: input.birthDate,
      lieuNaissance: input.birthPlace,
      adresse: input.fiscalAddress,
      iban: input.iban.replace(/\s/g, ""),
      ...(input.nir ? { nir: input.nir.replace(/\s/g, "") } : {}),
    },
    audit: {
      profileId: input.profileId,
      methodLabel: "inscrire_client",
    },
  });

  if (!response.ok || !response.data?.idClient) {
    throw new Error(
      response.error ?? "Échec inscription client URSSAF",
    );
  }

  return {
    urssafClientId: response.data.idClient,
    transmissionId: response.data.idTransmission ?? "",
    status: "rattachement_en_attente",
  };
}
