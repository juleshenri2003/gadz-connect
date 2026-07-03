import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-400">
        Chargement de la session…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={marketplaceRoutes.login()}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
