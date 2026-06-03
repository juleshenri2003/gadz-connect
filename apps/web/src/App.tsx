import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { HomePage } from "@/pages/HomePage";
import { OnboardingMicroEnterprisePage } from "@/pages/onboarding/OnboardingMicroEnterprisePage";
import { StripeReturnPage } from "@/pages/stripe/StripeReturnPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/onboarding/micro-entreprise"
        element={
          <ProtectedRoute>
            <OnboardingMicroEnterprisePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stripe/return"
        element={
          <ProtectedRoute>
            <StripeReturnPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stripe/refresh"
        element={
          <ProtectedRoute>
            <StripeReturnPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
