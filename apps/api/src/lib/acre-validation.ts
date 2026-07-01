import { z } from "zod";

/**
 * Date ISO (AAAA-MM-JJ) plausible pour un début d'ACRE :
 * entre il y a 3 ans et dans 7 jours (petite tolérance de saisie).
 */
export const acreStartDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (format AAAA-MM-JJ attendu)")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return false;
    const now = Date.now();
    const threeYearsAgo = now - 3 * 365 * 24 * 60 * 60 * 1000;
    const inSevenDays = now + 7 * 24 * 60 * 60 * 1000;
    return date.getTime() >= threeYearsAgo && date.getTime() <= inSevenDays;
  }, "La date de début d'ACRE doit être récente (max. 3 ans, pas dans le futur)");

/** Mise à jour ciblée du statut ACRE (autorisée même après SIRET). */
export const acreUpdateSchema = z
  .object({
    statusAcre: z.boolean(),
    acreStartDate: acreStartDateSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.statusAcre && !data.acreStartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Renseignez la date de début de votre ACRE",
        path: ["acreStartDate"],
      });
    }
  });

export type AcreUpdateInput = z.infer<typeof acreUpdateSchema>;
