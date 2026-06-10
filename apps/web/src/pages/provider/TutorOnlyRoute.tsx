import { Navigate } from "react-router-dom";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";

/** Redirige les élèves vers l'espace élèves (pas de micro-entreprise / paiements). */
export function TutorOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  if (profile && isStudent(profile.role)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
