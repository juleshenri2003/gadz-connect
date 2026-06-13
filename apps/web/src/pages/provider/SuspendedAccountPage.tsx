import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { RH_CONTACT_EMAIL } from "@/features/admin/rhContact";

export function SuspendedAccountPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-danger-bg p-4">
        <span className="text-2xl" aria-hidden>
          ⏸
        </span>
      </div>
      <h1 className="text-xl font-semibold text-ink-900">Compte suspendu</h1>
      <p className="text-sm text-ink-600">
        Votre accès à Gadz&apos;Connect a été suspendu par l&apos;équipe campus.
        Contactez le support pour comprendre la situation et réactiver votre
        compte.
      </p>
      <Button asChild variant="outline">
        <a href={`mailto:${RH_CONTACT_EMAIL}`}>Contacter l&apos;équipe campus</a>
      </Button>
      <Button variant="ghost" asChild>
        <Link to="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
