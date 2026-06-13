import { Button } from "@gadz-connect/ui";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { UserRole } from "@gadz-connect/types";
import { useRhAccess } from "@/features/admin/useRhAccess";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile } from "@/features/auth/useMyProfile";

const PROVIDER_ROLES: UserRole[] = ["teacher", "student_provider"];

export function HomePage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: rhAdmin, isSuccess: hasRhAccess, isLoading: rhLoading } =
    useRhAccess();

  if (!loading && user && hasRhAccess && rhAdmin && !rhLoading) {
    return <Navigate to="/admin" replace />;
  }

  if (
    !loading &&
    user &&
    profile &&
    !profileLoading &&
    PROVIDER_ROLES.includes(profile.role)
  ) {
    return <Navigate to="/app" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-ink-400">
          Gadz&apos;Connect
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          Plateforme inter-campus
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-ink-600">
          Mise en relation, cours et micro-entreprise pour les campus Arts et
          Métiers.
        </p>
      </div>

      {user && profileLoading ? (
        <p className="text-sm text-ink-400">Chargement…</p>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        {user ? (
          <Button variant="outline" onClick={() => void handleSignOut()}>
            Déconnexion
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth/login">Connexion</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
