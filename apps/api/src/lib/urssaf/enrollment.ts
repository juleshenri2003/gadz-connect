import type { UrssafClient, UrssafClientStatus } from "@gadz-connect/types";
import { supabaseAdmin } from "../supabase.js";
import { encryptSensitiveValue } from "./encryption.js";
import { inscrireClient } from "./inscrire-client.js";
import { isUrssafApiOperational } from "./config.js";

export async function getUrssafClientByProfileId(
  profileId: string,
): Promise<UrssafClient | null> {
  const { data, error } = await supabaseAdmin
    .from("urssaf_clients")
    .select(
      "id, profile_id, birth_date, birth_place, fiscal_address, urssaf_client_id, status, last_polled_at, activated_at, created_at, updated_at",
    )
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    profile_id: data.profile_id as string,
    birth_date: data.birth_date as string,
    birth_place: data.birth_place as string,
    fiscal_address: data.fiscal_address as string,
    urssaf_client_id: (data.urssaf_client_id as string | null) ?? null,
    status: data.status as UrssafClientStatus,
    last_polled_at: (data.last_polled_at as string | null) ?? null,
    activated_at: (data.activated_at as string | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

export function isUrssafClientActive(
  client: UrssafClient | null,
): client is UrssafClient & { status: "actif" } {
  return client?.status === "actif";
}

export async function enrollUrssafClient(input: {
  profileId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  fiscalAddress: string;
  iban: string;
  nir?: string;
}): Promise<UrssafClient> {
  if (!isUrssafApiOperational()) {
    throw new Error(
      "L'avance immédiate URSSAF n'est pas encore activée sur cette plateforme",
    );
  }

  const existing = await getUrssafClientByProfileId(input.profileId);
  if (existing && existing.status !== "refuse" && existing.status !== "expire") {
    return existing;
  }

  const ibanEncrypted = encryptSensitiveValue(
    input.iban.replace(/\s/g, "").toUpperCase(),
  );
  const nirEncrypted = input.nir
    ? encryptSensitiveValue(input.nir.replace(/\s/g, ""))
    : null;

  const apiResult = await inscrireClient({
    profileId: input.profileId,
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    birthPlace: input.birthPlace,
    fiscalAddress: input.fiscalAddress,
    iban: input.iban,
    nir: input.nir,
  });

  const row = {
    profile_id: input.profileId,
    birth_date: input.birthDate,
    birth_place: input.birthPlace,
    fiscal_address: input.fiscalAddress,
    iban_encrypted: ibanEncrypted,
    nir_encrypted: nirEncrypted,
    urssaf_client_id: apiResult.urssafClientId,
    urssaf_transmission_id: apiResult.transmissionId,
    status: apiResult.status,
    last_polled_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("urssaf_clients")
      .update(row)
      .eq("id", existing.id)
      .select(
        "id, profile_id, birth_date, birth_place, fiscal_address, urssaf_client_id, status, last_polled_at, activated_at, created_at, updated_at",
      )
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Erreur mise à jour inscription URSSAF");
    }
    return mapUrssafClientRow(data);
  }

  const { data, error } = await supabaseAdmin
    .from("urssaf_clients")
    .insert(row)
    .select(
      "id, profile_id, birth_date, birth_place, fiscal_address, urssaf_client_id, status, last_polled_at, activated_at, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Erreur inscription URSSAF");
  }

  return mapUrssafClientRow(data);
}

function mapUrssafClientRow(data: Record<string, unknown>): UrssafClient {
  return {
    id: data.id as string,
    profile_id: data.profile_id as string,
    birth_date: data.birth_date as string,
    birth_place: data.birth_place as string,
    fiscal_address: data.fiscal_address as string,
    urssaf_client_id: (data.urssaf_client_id as string | null) ?? null,
    status: data.status as UrssafClientStatus,
    last_polled_at: (data.last_polled_at as string | null) ?? null,
    activated_at: (data.activated_at as string | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
