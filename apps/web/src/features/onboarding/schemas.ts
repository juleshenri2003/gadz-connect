import { z } from "zod";
import { DEFAULT_MICRO_ENTERPRISE_ACTIVITY } from "@/features/onboarding/fiscalLabels";

const siretRegex = /^\d{14}$/;

export const onboardingStep0Schema = z.object({
  registrationStatus: z.enum(["already_registered", "awaiting_registration"], {
    required_error: "Indiquez votre situation",
  }),
  siret: z.string().optional(),
});

export const onboardingStep1Schema = z.object({
  activity: z
    .enum(["enseignement", "conseil", "prestation_intellectuelle"])
    .default(DEFAULT_MICRO_ENTERPRISE_ACTIVITY),
});

export const onboardingStep2Schema = z.object({
  urssafPeriodicity: z.enum(["monthly", "quarterly"], {
    required_error: "Choisissez une périodicité URSSAF",
  }),
});

export const onboardingStep3Schema = z.object({
  versementLiberatoire: z.boolean(),
  statusAcre: z.boolean().optional(),
});

export const onboardingFullSchema = onboardingStep0Schema
  .merge(onboardingStep1Schema)
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema)
  .superRefine((data, ctx) => {
    if (data.registrationStatus === "already_registered") {
      const normalized = data.siret?.replace(/\s/g, "") ?? "";
      if (!siretRegex.test(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SIRET invalide — 14 chiffres requis",
          path: ["siret"],
        });
      }
    }
  });

export type OnboardingFormValues = z.infer<typeof onboardingFullSchema>;
