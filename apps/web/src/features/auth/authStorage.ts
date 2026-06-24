export const AUTH_REDIRECT_KEY = "gadz_auth_redirect";
export const AUTH_INTENT_KEY = "gadz_auth_intent";

export type AuthIntent = "student" | "teacher";

export function setAuthRedirect(path: string): void {
  sessionStorage.setItem(AUTH_REDIRECT_KEY, path);
}

export function setAuthIntent(intent: AuthIntent): void {
  sessionStorage.setItem(AUTH_INTENT_KEY, intent);
}

export function peekAuthIntent(): AuthIntent | null {
  const value = sessionStorage.getItem(AUTH_INTENT_KEY);
  if (value === "student" || value === "teacher") return value;
  return null;
}

export function consumeAuthIntent(): AuthIntent | null {
  const value = sessionStorage.getItem(AUTH_INTENT_KEY);
  sessionStorage.removeItem(AUTH_INTENT_KEY);
  if (value === "student" || value === "teacher") return value;
  return null;
}

export function buildBookingRedirectPath(
  tutorId: string,
  slotId?: string,
  mode: "public" | "app" = "public",
): string {
  const base = mode === "app" ? `/app/cours/${tutorId}` : `/tuteurs/${tutorId}`;
  if (!slotId) return base;
  return `${base}?slot=${slotId}`;
}
