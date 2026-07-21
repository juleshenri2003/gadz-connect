import { useState } from "react";
import { Button, Input, Label } from "@gadz-connect/ui";
import {
  useUrssafEnroll,
  useUrssafStatus,
  urssafStatusLabel,
} from "./useUrssaf";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "actif"
      ? "bg-success/10 text-success"
      : status === "refuse" || status === "expire"
        ? "bg-danger/10 text-danger"
        : "bg-amber-100 text-amber-800";

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

export function UrssafEnrollmentSection() {
  const { data: status, isLoading } = useUrssafStatus();
  const enroll = useUrssafEnroll();
  const [open, setOpen] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [fiscalAddress, setFiscalAddress] = useState("");
  const [iban, setIban] = useState("");
  const [nir, setNir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-sm text-ink-400">Chargement avance immédiate…</p>;
  }

  if (!status?.operational) {
    return (
      <section className="rounded-md border border-line bg-surface p-5">
        <h3 className="font-semibold text-ink-900">Avance immédiate (50 %)</h3>
        <p className="mt-1 text-sm text-ink-600">
          L&apos;avance immédiate URSSAF sera disponible prochainement sur
          cette plateforme.
        </p>
      </section>
    );
  }

  const isActive = status.status === "actif";
  const canEnroll =
    !status.enrolled || status.status === "refuse" || status.status === "expire";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const result = await enroll.mutateAsync({
        birthDate,
        birthPlace,
        fiscalAddress,
        iban,
        nir: nir.trim() || undefined,
      });
      setSuccess(result.message);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
    }
  }

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">
            Avance immédiate (50 %)
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            Pour les cours <strong>en présentiel au domicile</strong>, vous ne
            payez que 50 % grâce au crédit d&apos;impôt. L&apos;URSSAF prélève
            votre part par SEPA après chaque cours.
          </p>
        </div>
        <StatusBadge status={urssafStatusLabel(status.status)} />
      </div>

      {isActive ? (
        <p className="mt-4 text-sm text-success">
          Votre compte est prêt. Cochez « cours au domicile » lors de la
          réservation pour bénéficier du paiement à 50 %.
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 text-sm text-success">{success}</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {canEnroll && !open ? (
        <Button
          type="button"
          className="mt-4"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          Activer l&apos;avance immédiate
        </Button>
      ) : null}

      {open ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <p className="text-sm text-ink-600">
            Ces informations sont transmises à l&apos;URSSAF pour le
            rattachement et le mandat SEPA. Validez ensuite dans votre espace
            URSSAF.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="urssaf-birth-date">Date de naissance</Label>
              <Input
                id="urssaf-birth-date"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="urssaf-birth-place">Lieu de naissance</Label>
              <Input
                id="urssaf-birth-place"
                required
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="urssaf-address">Adresse fiscale</Label>
            <Input
              id="urssaf-address"
              required
              value={fiscalAddress}
              onChange={(e) => setFiscalAddress(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="urssaf-iban">IBAN</Label>
            <Input
              id="urssaf-iban"
              required
              placeholder="FR76…"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="urssaf-nir">N° de sécurité sociale (optionnel)</Label>
            <Input
              id="urssaf-nir"
              value={nir}
              onChange={(e) => setNir(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={enroll.isPending}>
              {enroll.isPending ? "Envoi…" : "Envoyer l'inscription"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
