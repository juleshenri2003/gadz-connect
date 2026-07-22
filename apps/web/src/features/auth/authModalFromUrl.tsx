import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AUTH_REDIRECT_KEY } from "./authStorage";
import { useAuthModal } from "./authModalContext";
import type { AuthModalMode, AuthModalRole } from "./authModalContext";
import { isUsableAuthRedirect } from "./resolvePostLoginPath";

function parseAuthMode(value: string | null): AuthModalMode | null {
  if (value === "login" || value === "signup") return value;
  return null;
}

function parseAuthRole(intent: string | null): AuthModalRole {
  return intent === "teacher" ? "teacher" : "student";
}

/** Ouvre la modale de connexion depuis ?auth=login|signup (&intent=teacher). */
export function AuthModalFromUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { openAuthModal } = useAuthModal();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const auth = parseAuthMode(searchParams.get("auth"));
    if (!auth) {
      handled.current = null;
      return;
    }

    const intent = searchParams.get("intent");
    const key = `${auth}:${intent ?? ""}`;
    if (handled.current === key) return;
    handled.current = key;

    const from = (
      location.state as { from?: { pathname: string; search?: string } } | null
    )?.from;
    if (from?.pathname) {
      const redirect = `${from.pathname}${from.search ?? ""}`;
      if (isUsableAuthRedirect(redirect)) {
        sessionStorage.setItem(AUTH_REDIRECT_KEY, redirect);
      }
    }

    openAuthModal({ mode: auth, role: parseAuthRole(intent) });

    const next = new URLSearchParams(searchParams);
    next.delete("auth");
    next.delete("intent");
    setSearchParams(next, { replace: true, state: location.state });
  }, [
    searchParams,
    setSearchParams,
    location.state,
    openAuthModal,
  ]);

  return null;
}
