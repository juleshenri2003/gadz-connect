import { Button } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
        Gadz&apos;Connect
      </p>
      <h1 className="text-4xl font-bold tracking-tight">
        Plateforme inter-campus
      </h1>
      <p className="max-w-lg text-slate-600">
        Mise en relation, cours et micro-entreprise pour les campus Arts et
        Métiers.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-slate-500">{user.email}</span>
            <Button asChild>
              <Link to="/onboarding/micro-entreprise">
                Module 2 — Onboarding
              </Link>
            </Button>
            <Button variant="outline" onClick={() => void signOut()}>
              Déconnexion
            </Button>
          </>
        ) : (
          <>
            <Button asChild>
              <Link to="/auth/login">Connexion Magic Link</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/onboarding/micro-entreprise">
                Module 2 — Onboarding
              </Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
