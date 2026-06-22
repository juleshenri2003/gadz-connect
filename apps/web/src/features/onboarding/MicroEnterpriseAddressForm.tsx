import { Button, Label } from "@gadz-connect/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { saveMicroEnterpriseAddress } from "@/features/onboarding/api";

const addressSchema = z.object({
  microEnterpriseAddress: z
    .string()
    .trim()
    .min(10, "Adresse trop courte (minimum 10 caractères)")
    .max(500, "Adresse trop longue"),
});

type AddressForm = z.infer<typeof addressSchema>;

interface MicroEnterpriseAddressFormProps {
  id?: string;
  existingAddress?: string | null;
  /** Affiche uniquement l'adresse enregistrée (lecture seule). */
  readOnly?: boolean;
}

export function MicroEnterpriseAddressForm({
  id,
  existingAddress,
  readOnly = false,
}: MicroEnterpriseAddressFormProps) {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const trimmedExisting = existingAddress?.trim() ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      microEnterpriseAddress: trimmedExisting,
    },
  });

  const saveAddress = useMutation({
    mutationFn: async (microEnterpriseAddress: string) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      return saveMicroEnterpriseAddress(microEnterpriseAddress, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      void queryClient.invalidateQueries({ queryKey: ["provider-progress"] });
    },
  });

  async function onSubmit({ microEnterpriseAddress }: AddressForm) {
    try {
      await saveAddress.mutateAsync(microEnterpriseAddress);
    } catch (err) {
      setError("root", { message: (err as Error).message });
    }
  }

  if (readOnly && trimmedExisting) {
    return (
      <section
        id={id}
        className="rounded-md border border-line bg-paper/80 p-4 space-y-2 scroll-mt-24"
        role="status"
      >
        <h3 className="text-sm font-semibold text-ink-900">
          Adresse de l&apos;auto-entreprise
        </h3>
        <p className="text-sm text-ink-600">{trimmedExisting}</p>
      </section>
    );
  }

  return (
    <section
      id={id}
      className="rounded-md border border-line bg-surface p-4 space-y-4 scroll-mt-24"
    >
      <div>
        <h3 className="text-sm font-semibold text-ink-900">
          Adresse de l&apos;auto-entreprise
        </h3>
        <p className="mt-1 text-xs text-ink-600">
          Adresse déclarée sur le Guichet Unique — elle figure sur vos factures
          URSSAF et les documents de facturation Gadz&apos;Connect.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="micro-enterprise-address">Adresse postale</Label>
          <textarea
            id="micro-enterprise-address"
            rows={3}
            className="flex w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-900 shadow-sm placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            placeholder="12 rue de l'Industrie, 75015 Paris"
            {...register("microEnterpriseAddress")}
          />
          {errors.microEnterpriseAddress ? (
            <p className="text-sm text-danger">
              {errors.microEnterpriseAddress.message}
            </p>
          ) : null}
        </div>
        {errors.root ? (
          <p className="text-sm text-danger">{errors.root.message}</p>
        ) : null}
        {saveAddress.isSuccess && !errors.root ? (
          <p className="text-sm text-success">Adresse enregistrée.</p>
        ) : null}
        <Button
          type="submit"
          variant={trimmedExisting ? "outline" : "default"}
          disabled={isSubmitting || saveAddress.isPending}
        >
          {saveAddress.isPending
            ? "Enregistrement…"
            : trimmedExisting
              ? "Mettre à jour l'adresse"
              : "Enregistrer l'adresse"}
        </Button>
      </form>
    </section>
  );
}
