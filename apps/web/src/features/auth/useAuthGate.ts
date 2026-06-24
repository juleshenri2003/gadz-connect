import { useCallback } from "react";
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

  const openGate = useCallback(
    (context: AuthGateContext) => {
      trackMarketplaceEvent("auth_gate_open", {
        tutorId: context.tutorId,
      });

      const redirect = buildBookingRedirectPath(
        context.tutorId,
        context.slotId,
        "public",
      );
      setAuthRedirect(redirect);

      const intent = context.intent ?? "student";
      setAuthIntent(intent);

      openAuthModal({
        mode: "signup",
        role: intent === "teacher" ? "teacher" : "student",
      });
    },
    [openAuthModal],
  );

  return { openGate };
}
