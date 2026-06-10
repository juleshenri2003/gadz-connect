/** Vide en dev → requêtes relatives /api via proxy Vite (évite les soucis CORS). */
export const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body as { error?: string }).error ?? `Erreur HTTP ${res.status}`;
    throw new Error(message);
  }

  return body as T;
}
