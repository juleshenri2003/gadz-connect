/**
 * Vérification SIRET via l'API Sirene INSEE (optionnelle).
 * Sans INSEE_API_KEY : validation format uniquement (succès implicite).
 */

export interface SireneVerifyResult {
  valid: boolean;
  skipped: boolean;
  reason?: string;
}

export async function verifySiretWithSirene(
  siret: string,
): Promise<SireneVerifyResult> {
  const normalized = siret.replace(/\s/g, "");
  if (!/^\d{14}$/.test(normalized)) {
    return { valid: false, skipped: false, reason: "Format SIRET invalide" };
  }

  const apiKey = process.env.INSEE_API_KEY?.trim();
  if (!apiKey) {
    return { valid: true, skipped: true };
  }

  const siren = normalized.slice(0, 9);
  try {
    const res = await fetch(
      `https://api.insee.fr/api-sirene/3.11/siret/${normalized}`,
      {
        headers: {
          Accept: "application/json",
          "X-INSEE-Api-Key-Integration": apiKey,
        },
      },
    );

    if (res.status === 404) {
      return {
        valid: false,
        skipped: false,
        reason: "SIRET introuvable dans le répertoire Sirene",
      };
    }

    if (!res.ok) {
      console.warn("[sirene] API error:", res.status, await res.text());
      return { valid: true, skipped: true };
    }

    const body = (await res.json()) as {
      etablissement?: { siren?: string };
    };
    const returnedSiren = body.etablissement?.siren;
    if (returnedSiren && returnedSiren !== siren) {
      return {
        valid: false,
        skipped: false,
        reason: "SIRET incohérent avec le répertoire Sirene",
      };
    }

    return { valid: true, skipped: false };
  } catch (err) {
    console.warn("[sirene] fetch failed:", (err as Error).message);
    return { valid: true, skipped: true };
  }
}
