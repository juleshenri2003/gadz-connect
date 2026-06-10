import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import type { UserRole } from "@gadz-connect/types";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const PROVIDER_ROLES: UserRole[] = ["teacher", "student_provider"];

function ProviderGate() {
  const { data: profile, isLoading, isError } = useMyProfile();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Chargement de votre espace…
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-900">
          Profil introuvable
        </h1>
        <p className="text-sm text-slate-600">
          Votre compte n&apos;a pas encore de profil Gadz&apos;Connect.
        </p>
        <Button asChild>
          <Link to="/">Accueil</Link>
        </Button>
      </div>
    );
  }

  if (!PROVIDER_ROLES.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  if (
    !profile.profile_setup_complete &&
    location.pathname !== "/app/setup"
  ) {
    return <Navigate to="/app/setup" replace />;
  }

  return <Outlet />;
}

export function ProviderRoute() {
  return (
    <ProtectedRoute>
      <ProviderGate />
    </ProtectedRoute>
  );
}
