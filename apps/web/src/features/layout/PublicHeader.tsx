import { Button, cn } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { useRhAccess } from "@/features/admin/useRhAccess";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import { AppLogo } from "./AppLogo";

export function VisitorBanner() {
  const { user } = useAuth();
  if (user) return null;

  return (
    <div
      className="border-b border-brand-100 bg-brand-50/80 px-4 py-2 text-center text-sm text-ink-700"
      role="status"
    >
      Mode visiteur —{" "}
      <Link
        to={marketplaceRoutes.login()}
        className="font-medium text-brand-700 underline-offset-2 hover:underline"
      >
        connectez-vous
      </Link>{" "}
      pour réserver un cours
    </div>
  );
}

interface PublicHeaderProps {
  campusSelector?: React.ReactNode;
}

export function PublicHeader({ campusSelector }: PublicHeaderProps) {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: rhAdmin, isSuccess: hasRhAccess } = useRhAccess();

  const workspacePath =
    user && hasRhAccess && rhAdmin
      ? "/admin"
      : user && profile
        ? "/app"
        : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-sm">
      <VisitorBanner />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0">
          <AppLogo className="h-8" />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          {campusSelector ? (
            <div className="min-w-0 flex-1 sm:flex-none sm:max-w-[14rem]">
              {campusSelector}
            </div>
          ) : null}

          <nav
            className="flex shrink-0 items-center gap-1 sm:gap-2"
            aria-label="Compte"
          >
            {workspacePath ? (
              <Button size="sm" asChild>
                <Link to={workspacePath}>Mon espace</Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden text-ink-600 sm:inline-flex"
                  asChild
                >
                  <Link to={marketplaceRoutes.login("teacher")}>
                    Espace prof
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={marketplaceRoutes.login()}>Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to={marketplaceRoutes.login()}>S&apos;inscrire</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface-alt px-4 py-6 text-center text-xs text-ink-500 sm:px-6">
      <p>Gadz&apos;Connect — tutorat inter-campus Arts et Métiers</p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link
          to={marketplaceRoutes.login("teacher")}
          className={cn("hover:text-ink-900")}
        >
          Proposer vos cours
        </Link>
        <Link to="/rh/login" className="hover:text-ink-900">
          Espace RH
        </Link>
      </p>
    </footer>
  );
}
