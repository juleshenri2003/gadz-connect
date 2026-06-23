import { Button } from "@gadz-connect/ui";
import { Modal } from "@/components/Modal";
import { useAuthModal } from "@/features/auth/authModalContext";
import type { AuthGateContext } from "./useAuthGate";

interface AuthGateModalProps {
  open: boolean;
  context: AuthGateContext | null;
  onClose: () => void;
  onContinue: (context: AuthGateContext) => void;
}

export function AuthGateModal({
  open,
  context,
  onClose,
  onContinue,
}: AuthGateModalProps) {
  const { openAuthModal } = useAuthModal();
  if (!context) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Connectez-vous pour réserver"
      description={`Réservez votre cours avec ${context.tutorName}.`}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Plus tard
          </Button>
          <Button onClick={() => onContinue(context)}>Continuer</Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-ink-600">
        <p>
          Utilisez votre adresse Arts et Métiers (@ensam.eu ou @etu.ensam.eu).
          La première connexion crée votre compte élève automatiquement (~5 min).
        </p>
        <p className="text-xs text-ink-400">
          Pas encore de compte ? Cliquez sur Continuer — aucune inscription
          séparée n&apos;est nécessaire.
        </p>
        <p>
          <button
            type="button"
            className="font-medium text-brand-700 underline-offset-2 hover:underline"
            onClick={() => {
              onClose();
              openAuthModal({ mode: "signup", role: "teacher" });
            }}
          >
            Vous êtes professeur ? Créer un compte prof
          </button>
        </p>
      </div>
    </Modal>
  );
}
