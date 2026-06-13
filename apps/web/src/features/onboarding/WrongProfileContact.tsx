import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { RH_CONTACT_EMAIL } from "@/features/admin/rhContact";

interface WrongProfileContactModalProps {
  open: boolean;
  onClose: () => void;
}

export function WrongProfileContactModal({
  open,
  onClose,
}: WrongProfileContactModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wrong-profile-title"
    >
      <div className="w-full max-w-md rounded-md bg-surface p-6 shadow-raised">
        <h2
          id="wrong-profile-title"
          className="text-lg font-semibold text-ink-900"
        >
          Ce n&apos;est pas mon profil
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Si vous avez choisi le mauvais type de compte (élève / professeur),
          contactez l&apos;équipe campus pour corriger votre profil.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <a href={`mailto:${RH_CONTACT_EMAIL}?subject=Changement%20de%20profil%20Gadz'Connect`}>
              Contacter le support
            </a>
          </Button>
          <Button variant="outline" type="button" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

interface WrongProfileLinkProps {
  className?: string;
  useModal?: boolean;
}

export function WrongProfileLink({
  className,
  useModal = false,
}: WrongProfileLinkProps) {
  const [open, setOpen] = useState(false);

  if (useModal) {
    return (
      <>
        <p className={className}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm text-brand-600 underline-offset-2 hover:underline"
          >
            Ce n&apos;est pas mon profil ?
          </button>
        </p>
        <WrongProfileContactModal open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return (
    <p className={className}>
      <Link
        to="mailto:"
        onClick={(e) => {
          e.preventDefault();
          window.location.href = `mailto:${RH_CONTACT_EMAIL}?subject=Changement%20de%20profil%20Gadz'Connect`;
        }}
        className="text-sm text-brand-600 underline-offset-2 hover:underline"
      >
        Ce n&apos;est pas mon profil ?
      </Link>
    </p>
  );
}
