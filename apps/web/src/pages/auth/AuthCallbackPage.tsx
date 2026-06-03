import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (data.session) {
        const redirect =
          sessionStorage.getItem("gadz_auth_redirect")
          ?? "/onboarding/micro-entreprise";
        sessionStorage.removeItem("gadz_auth_redirect");
        navigate(redirect, { replace: true });
        return;
      }

      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setError) {
          setError(setError.message);
          return;
        }
        const redirect =
          sessionStorage.getItem("gadz_auth_redirect")
          ?? "/onboarding/micro-entreprise";
        sessionStorage.removeItem("gadz_auth_redirect");
        navigate(redirect, { replace: true });
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        const redirect =
          sessionStorage.getItem("gadz_auth_redirect")
          ?? "/onboarding/micro-entreprise";
        sessionStorage.removeItem("gadz_auth_redirect");
        navigate(redirect, { replace: true });
        return;
      }

      setError("Lien de connexion invalide ou expiré.");
    }

    void handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <p className="text-red-600">{error}</p>
        <a href="/auth/login" className="mt-4 inline-block text-sm underline">
          Réessayer la connexion
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
      Connexion en cours…
    </main>
  );
}
