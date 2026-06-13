import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { useRhAccess } from "@/features/admin/useRhAccess";
import { useAuth } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const RH_EMAIL = "jules.henri@ensam.eu";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data: rhAdmin, isLoading, isError, error } = useRhAccess();

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-400">
          Vérification de l&apos;accès RH…
        </div>
      ) : isError ? (
        <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
          <h1 className="text-lg font-semibold text-ink-900">Accès refusé</h1>
          <p className="text-sm text-ink-600">
            {(error as Error).message.includes("autorisée") ||
            (error as Error).message.includes("administrateur")
              ? `La plateforme RH n'accepte que ${RH_EMAIL}.`
              : (error as Error).message}
          </p>
          <p className="text-xs text-ink-400">
            Connecté en tant que : {user?.email ?? "—"}
          </p>
          <Button asChild>
            <Link to="/rh/login">Connexion RH</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Accueil</Link>
          </Button>
        </div>
      ) : rhAdmin ? (
        <>{children}</>
      ) : (
        <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
          <h1 className="text-lg font-semibold text-ink-900">Accès refusé</h1>
          <p className="text-sm text-ink-600">
            Plateforme RH réservée à {RH_EMAIL}.
          </p>
          <Button asChild>
            <Link to="/rh/login">Connexion RH</Link>
          </Button>
        </div>
      )}
    </ProtectedRoute>
  );
}
