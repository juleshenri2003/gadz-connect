import type { UserRole } from "@gadz-connect/types";
import { needsMicroEnterprise } from "@/features/auth/roles";
import { apiFetch } from "@/lib/api";

const PROVIDER_ROLES: UserRole[] = ["teacher", "student_provider"];

interface ProfileMe {
  role: UserRole;
  profile_setup_complete: boolean;
}

export async function resolvePostLoginPath(
  accessToken: string,
): Promise<string> {
  try {
    await apiFetch("/api/admin/me", { token: accessToken });
    sessionStorage.removeItem("gadz_auth_redirect");
    return "/admin";
  } catch {
    const stored = sessionStorage.getItem("gadz_auth_redirect");
    if (stored) {
      sessionStorage.removeItem("gadz_auth_redirect");
      return stored;
    }
    try {
      const res = await apiFetch<{ data: ProfileMe }>("/api/profile/me", {
        token: accessToken,
      });
      const { role, profile_setup_complete } = res.data;

      if (PROVIDER_ROLES.includes(role)) {
        if (!profile_setup_complete) return "/app/setup";
        if (!needsMicroEnterprise(role)) return "/app";
        return "/app";
      }
    } catch {
      // ignore
    }
    return "/app";
  }
}
