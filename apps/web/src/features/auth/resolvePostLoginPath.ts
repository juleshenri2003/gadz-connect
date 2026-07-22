import type { UserRole } from "@gadz-connect/types";
import { apiFetch } from "@/lib/api";
import {
  AUTH_INTENT_KEY,
  AUTH_REDIRECT_KEY,
} from "./authStorage";

const PROVIDER_ROLES: UserRole[] = ["teacher", "student_provider"];

interface ProfileMe {
  role: UserRole;
  profile_setup_complete: boolean;
  student_onboarding_complete?: boolean;
}

function clearAuthSessionKeys(): void {
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  sessionStorage.removeItem(AUTH_INTENT_KEY);
}

/** Convertit une URL publique en route app connectée. */
export function normalizeAuthRedirect(stored: string): string {
  try {
    const url = new URL(stored, "http://local");
    const match = url.pathname.match(/^\/tuteurs\/([^/]+)$/);
    if (match) {
      url.pathname = `/app/cours/${match[1]}`;
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // fallback regex
    const match = stored.match(/^\/tuteurs\/([^/?]+)(\?.*)?$/);
    if (match) {
      return `/app/cours/${match[1]}${match[2] ?? ""}`;
    }
  }
  return stored;
}

/**
 * Redirects post-login sûrs pour élève/prof.
 * Ignore `/`, `/admin`, `/rh`, `/auth` — évite les rebonds accueil / RH.
 */
export function isUsableAuthRedirect(stored: string): boolean {
  const normalized = normalizeAuthRedirect(stored.trim());
  if (!normalized.startsWith("/")) return false;

  let pathname = normalized;
  try {
    pathname = new URL(normalized, "http://local").pathname;
  } catch {
    const q = normalized.indexOf("?");
    pathname = q >= 0 ? normalized.slice(0, q) : normalized;
  }

  if (pathname === "/" || pathname === "") return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/rh")) return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/connexion")) return false;

  return pathname.startsWith("/app");
}

export async function resolvePostLoginPath(
  accessToken: string,
): Promise<string> {
  try {
    await apiFetch("/api/admin/me", { token: accessToken });
    clearAuthSessionKeys();
    return "/admin";
  } catch {
    try {
      const res = await apiFetch<{ data: ProfileMe }>("/api/profile/me", {
        token: accessToken,
      });
      const profile = res.data;

      if (
        PROVIDER_ROLES.includes(profile.role) &&
        !profile.profile_setup_complete
      ) {
        clearAuthSessionKeys();
        return "/app/setup";
      }

      if (
        profile.role === "student_provider" &&
        profile.profile_setup_complete &&
        profile.student_onboarding_complete === false
      ) {
        clearAuthSessionKeys();
        return "/app/onboarding";
      }
    } catch {
      // ignore
    }

    const stored = sessionStorage.getItem(AUTH_REDIRECT_KEY);
    clearAuthSessionKeys();

    if (stored && isUsableAuthRedirect(stored)) {
      return normalizeAuthRedirect(stored);
    }

    return "/app";
  }
}
