import { useCallback, useState } from "react";
import {
  buildBookingRedirectPath,
  setAuthIntent,
  setAuthRedirect,
  type AuthIntent,
} from "./authStorage";
import { useAuthModal } from "./authModalContext";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";

export interface AuthGateContext {
  tutorId: string;
  tutorName: string;
  slotId?: string;
  intent?: AuthIntent;
}

export function useAuthGate() {
  const { openAuthModal } = useAuthModal();
  const [gate, setGate] = useState<AuthGateContext | null>(null);

  const openGate = useCallback((context: AuthGateContext) => {
    trackMarketplaceEvent("auth_gate_open", {
      tutorId: context.tutorId,
    });
    setGate(context);
  }, []);

  const closeGate = useCallback(() => setGate(null), []);

  const proceedToLogin = useCallback(
    (context: AuthGateContext) => {
      const redirect = buildBookingRedirectPath(
        context.tutorId,
        context.slotId,
        "public",
      );
      setAuthRedirect(redirect);
      const intent = context.intent ?? "student";
      setAuthIntent(intent);
      openAuthModal({
        mode: "login",
        role: intent === "teacher" ? "teacher" : "student",
      });
      setGate(null);
    },
    [openAuthModal],
  );

  return {
    gate,
    openGate,
    closeGate,
    proceedToLogin,
  };
}
