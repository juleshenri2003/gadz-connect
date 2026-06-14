import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
  type AuthUser,
  type StoredSession,
} from "@/lib/session";

interface AuthContextValue {
  user: AuthUser | null;
  session: StoredSession | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  emailLogin: (
    email: string,
    password: string,
    campusId?: string,
  ) => Promise<{
    error: string | null;
    accessToken?: string;
    profileSetupComplete?: boolean;
  }>;
  /** @deprecated Utiliser emailLogin */
  devLogin: (
    email: string,
    password: string,
    campusId?: string,
  ) => Promise<{
    error: string | null;
    accessToken?: string;
    profileSetupComplete?: boolean;
  }>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | undefined;
  setSession: (session: StoredSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((next: StoredSession) => {
    setStoredSession(next);
    setSessionState(next);
  }, []);

  useEffect(() => {
    async function restore() {
      const stored = getStoredSession();
      if (!stored?.access_token) {
        setLoading(false);
        return;
      }

      try {
        await apiFetch<{ data: { user: AuthUser } }>("/api/auth/me", {
          token: stored.access_token,
        });
        setSessionState(stored);
      } catch {
        clearStoredSession();
        setSessionState(null);
      } finally {
        setLoading(false);
      }
    }

    void restore();
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    try {
      await apiFetch<{ data: { sent: boolean } }>("/api/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email, redirectTo }),
      });
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }, []);

  const emailLogin = useCallback(
    async (email: string, password: string, campusId?: string) => {
      try {
        const res = await apiFetch<{
          data: { session: StoredSession; profileSetupComplete: boolean };
        }>("/api/auth/email-login", {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            ...(campusId ? { campusId } : {}),
          }),
        });
        setSession(res.data.session);
        return {
          error: null,
          accessToken: res.data.session.access_token,
          profileSetupComplete: res.data.profileSetupComplete,
        };
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
    [setSession],
  );

  const devLogin = emailLogin;

  const signOut = useCallback(async () => {
    const token = getStoredSession()?.access_token;
    try {
      if (token) {
        await apiFetch("/api/auth/logout", { method: "POST", token });
      }
    } catch {
      /* session stateless côté serveur */
    }
    clearStoredSession();
    setSessionState(null);
  }, []);

  const getAccessToken = useCallback(
    () => session?.access_token,
    [session?.access_token],
  );

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signInWithMagicLink,
      emailLogin,
      devLogin,
      signOut,
      getAccessToken,
      setSession,
    }),
    [
      session,
      loading,
      signInWithMagicLink,
      emailLogin,
      devLogin,
      signOut,
      getAccessToken,
      setSession,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return ctx;
}
