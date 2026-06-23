import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildBookingRedirectPath,
  setAuthIntent,
  setAuthRedirect,
  type AuthIntent,
} from "./authStorage";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";

export interface AuthGateContext {
  tutorId: string;
  tutorName: string;
  slotId?: string;
  intent?: AuthIntent;
}

export function useAuthGate() {
  const navigate = useNavigate();
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
      setAuthIntent(context.intent ?? "student");
      navigate(marketplaceRoutes.login(context.intent === "teacher" ? "teacher" : undefined));
    },
    [navigate],
  );

  return {
    gate,
    openGate,
    closeGate,
    proceedToLogin,
  };
}
