import { z } from "zod";

export const onboardingStep1Schema = z.object({
  activity: z.enum(["enseignement", "conseil", "prestation_intellectuelle"], {
    required_error: "Sélectionnez une activité",
  }),
});

export const onboardingStep2Schema = z.object({
  urssafPeriodicity: z.enum(["monthly", "quarterly"], {
    required_error: "Choisissez une périodicité URSSAF",
  }),
});

export const onboardingStep3Schema = z.object({
  versementLiberatoire: z.boolean(),
});

export const onboardingFullSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema);

export type OnboardingFormValues = z.infer<typeof onboardingFullSchema>;
