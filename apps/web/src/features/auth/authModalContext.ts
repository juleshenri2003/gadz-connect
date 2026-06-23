import { createContext, useContext } from "react";

export type AuthModalMode = "signup" | "login";
export type AuthModalRole = "student" | "teacher";

export interface AuthModalView {
  mode: AuthModalMode;
  role: AuthModalRole;
}

export interface AuthModalOptions {
  mode?: AuthModalMode;
  role?: AuthModalRole;
}

export interface AuthModalContextValue {
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
}

export const AuthModalContext = createContext<AuthModalContextValue | null>(
  null,
);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}
