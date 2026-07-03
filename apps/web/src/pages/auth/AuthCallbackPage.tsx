import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { resolvePostLoginPath } from "@/features/auth/resolvePostLoginPath";
import { apiFetch } from "@/lib/api";
import type { StoredSession } from "@/lib/session";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const code = new URLSearchParams(window.location.search).get("code");

      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      let body: Record<string, string>;
      if (code) {
        body = { code };
      } else if (accessToken && refreshToken) {
        body = { access_token: accessToken, refresh_token: refreshToken };
      } else {
        setError("Lien de connexion invalide ou expiré.");
        return;
      }

      try {
        const res = await apiFetch<{ data: { session: StoredSession } }>(
          "/api/auth/session",
          { method: "POST", body: JSON.stringify(body) },
        );

        setSession(res.data.session);
        const redirect = await resolvePostLoginPath(
          res.data.session.access_token,
        );
        navigate(redirect, { replace: true });
      } catch (err) {
        setError((err as Error).message);
      }
    }

    void handleCallback();
  }, [navigate, setSession]);

  if (error) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <p className="text-danger">{error}</p>
        <a href="/?auth=login" className="mt-4 inline-block text-sm underline">
          Réessayer la connexion
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-ink-400">
      Connexion en cours…
    </main>
  );
}
