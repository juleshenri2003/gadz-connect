const STORAGE_KEY = "gadz_session";

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: AuthUser;
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | undefined {
  return getStoredSession()?.access_token;
}
