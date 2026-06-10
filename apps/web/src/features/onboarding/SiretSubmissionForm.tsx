import { Button, Input, Label } from "@gadz-connect/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
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
}

export function SiretSubmissionForm({ existingSiret }: SiretSubmissionFormProps) {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SiretForm>({
    resolver: zodResolver(siretSchema),
  });

  const submitSiret = useMutation({
    mutationFn: async (siret: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      const res = await apiFetch<{ data: { siret: string } }>(
        "/api/profile/siret",
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ siret }),
        },
      );
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

  if (existingSiret) {
    return (
      <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-indigo-900">
          SIRET transmis
        </h3>
        <p className="text-sm text-indigo-800">
          Numéro déclaré : <strong>{existingSiret}</strong>
        </p>
        <p className="text-xs text-indigo-700/80">
          En attente de validation par l&apos;équipe RH. Vous serez notifié
          lorsque votre compte sera activé.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          J&apos;ai reçu mon SIRET
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Saisissez le numéro à 14 chiffres reçu de l&apos;INSEE après votre
          immatriculation sur le Guichet Unique.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="declared-siret">Numéro SIRET</Label>
          <Input
            id="declared-siret"
            placeholder="12345678901234"
            inputMode="numeric"
            maxLength={17}
            {...register("siret")}
          />
          {errors.siret ? (
            <p className="text-sm text-red-600">{errors.siret.message}</p>
          ) : null}
        </div>
        {errors.root ? (
          <p className="text-sm text-red-600">{errors.root.message}</p>
        ) : null}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || submitSiret.isPending}
        >
          {submitSiret.isPending ? "Envoi…" : "Déclarer mon SIRET"}
        </Button>
      </form>
    </section>
  );
}
