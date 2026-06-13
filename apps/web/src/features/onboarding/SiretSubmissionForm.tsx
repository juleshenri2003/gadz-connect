import type { AccountStatus } from "@gadz-connect/types";
import { Button, Input, Label } from "@gadz-connect/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatSiretDisplay } from "@/features/onboarding/microEnterprisePageUtils";
import { apiFetch } from "@/lib/api";

const siretSchema = z.object({
  siret: z
    .string()
    .min(1, "SIRET requis")
    .transform((s) => s.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{14}$/, "SIRET invalide — 14 chiffres requis")),
});

type SiretForm = z.infer<typeof siretSchema>;

interface SiretSubmissionFormProps {
  existingSiret?: string | null;
  accountStatus?: AccountStatus;
  siretVerificationFailed?: boolean;
  /** Masque le titre interne (ex. étape déjà titrée dans le guide modal). */
  hideHeader?: boolean;
}

export function SiretSubmissionForm({
  existingSiret,
  accountStatus,
  siretVerificationFailed = false,
  hideHeader = false,
}: SiretSubmissionFormProps) {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const canCorrect = Boolean(existingSiret && siretVerificationFailed);
  const showReadOnly =
    Boolean(existingSiret) && !canCorrect && accountStatus !== "active";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SiretForm>({
    resolver: zodResolver(siretSchema),
    defaultValues: canCorrect
      ? { siret: existingSiret?.replace(/\s/g, "") ?? "" }
      : undefined,
  });

  const submitSiret = useMutation({
    mutationFn: async (siret: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{
        data: { siret: string; account_status: AccountStatus };
      }>("/api/profile/siret", {
        method: "PATCH",
        token,
        body: JSON.stringify({ siret }),
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    },
  });

  async function onSubmit({ siret }: SiretForm) {
    try {
      await submitSiret.mutateAsync(siret);
    } catch (err) {
      setError("root", { message: (err as Error).message });
    }
  }

  if (accountStatus === "active" && existingSiret) {
    const displaySiret = formatSiretDisplay(existingSiret) ?? existingSiret;
    return (
      <section
        className="rounded-md border border-success/20 bg-success-bg p-4 space-y-2"
        role="status"
      >
        <h3 className="text-sm font-semibold text-success">
          Compte activé
        </h3>
        <p className="text-sm text-success">
          SIRET enregistré : <strong>{displaySiret}</strong>
        </p>
      </section>
    );
  }

  if (showReadOnly) {
    const displaySiret = formatSiretDisplay(existingSiret) ?? existingSiret;
    return (
      <section className="rounded-md border border-brand-100 bg-brand-50/50 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-brand-700">
          SIRET transmis
        </h3>
        <p className="text-sm text-brand-700">
          Numéro déclaré : <strong>{displaySiret}</strong>
        </p>
        <p className="text-xs text-brand-700/80">
          Vérification en cours — vous serez notifié dès que votre compte sera
          activé.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-line bg-surface p-4 space-y-4">
      {!hideHeader ? (
        <div>
          <h3 className="text-sm font-semibold text-ink-900">
            {canCorrect ? "Corriger mon SIRET" : "J'ai reçu mon SIRET"}
          </h3>
          <p className="mt-1 text-xs text-ink-600">
            {canCorrect
              ? "Le numéro précédent n'a pas été reconnu dans le répertoire Sirene. Saisissez le bon numéro à 14 chiffres."
              : "Saisissez le numéro à 14 chiffres reçu de l'INSEE après votre immatriculation sur le Guichet Unique."}
          </p>
        </div>
      ) : null}
      {canCorrect && existingSiret ? (
        <p className="rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-xs text-danger">
          Numéro refusé :{" "}
          <strong>{formatSiretDisplay(existingSiret) ?? existingSiret}</strong>
        </p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="declared-siret">Numéro SIRET</Label>
          <Input
            id="declared-siret"
            placeholder="123 456 789 01234"
            inputMode="numeric"
            maxLength={17}
            {...register("siret")}
          />
          {errors.siret ? (
            <p className="text-sm text-danger">{errors.siret.message}</p>
          ) : null}
        </div>
        {errors.root ? (
          <p className="text-sm text-danger">{errors.root.message}</p>
        ) : null}
        <Button
          type="submit"
          disabled={isSubmitting || submitSiret.isPending}
        >
          {submitSiret.isPending
            ? "Envoi…"
            : canCorrect
              ? "Corriger mon SIRET"
              : "Déclarer mon SIRET"}
        </Button>
      </form>
    </section>
  );
}
