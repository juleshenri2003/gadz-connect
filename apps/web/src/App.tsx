import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ProviderRoute } from "@/components/ProviderRoute";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { ProviderLayout } from "@/features/provider/ProviderLayout";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { HomePage } from "@/pages/HomePage";
import { StripeReturnPage } from "@/pages/stripe/StripeReturnPage";
import { RhLoginPage } from "@/pages/rh/RhLoginPage";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { AdminMembersPage } from "@/pages/admin/AdminMembersPage";
import { AdminBudgetsPage } from "@/pages/admin/AdminBudgetsPage";
import { AdminCoursesPage } from "@/pages/admin/AdminCoursesPage";
import { AdminSchedulePage } from "@/pages/admin/AdminSchedulePage";
import { ProfileSetupPage } from "@/pages/provider/ProfileSetupPage";
import { ProviderOverviewPage } from "@/pages/provider/ProviderOverviewPage";
import { ProviderCoursesPage } from "@/pages/provider/ProviderCoursesPage";
import { ProviderOnboardingPage } from "@/pages/provider/ProviderOnboardingPage";
import { ProviderPaymentsPage } from "@/pages/provider/ProviderPaymentsPage";
import { ProviderProfilePage } from "@/pages/provider/ProviderProfilePage";
import { TutorDetailPage } from "@/pages/provider/TutorDetailPage";
import { SchedulePage } from "@/pages/provider/SchedulePage";
import { TutorOnlyRoute } from "@/pages/provider/TutorOnlyRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/onboarding/micro-entreprise"
        element={<Navigate to="/app/micro-entreprise" replace />}
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
      <Route path="/app" element={<ProviderRoute />}>
        <Route element={<ProviderLayout />}>
        <Route path="setup" element={<ProfileSetupPage />} />
        <Route index element={<ProviderOverviewPage />} />
        <Route path="planning" element={<SchedulePage />} />
        <Route path="cours" element={<ProviderCoursesPage />} />
        <Route path="cours/:id" element={<TutorDetailPage />} />
        <Route
          path="micro-entreprise"
          element={
            <TutorOnlyRoute>
              <ProviderOnboardingPage />
            </TutorOnlyRoute>
          }
        />
        <Route
          path="paiements"
          element={
            <TutorOnlyRoute>
              <ProviderPaymentsPage />
            </TutorOnlyRoute>
          }
        />
        <Route path="profil" element={<ProviderProfilePage />} />
        </Route>
      </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="planning" element={<AdminSchedulePage />} />
        <Route path="membres" element={<AdminMembersPage />} />
        <Route path="budgets" element={<AdminBudgetsPage />} />
        <Route path="cours" element={<AdminCoursesPage />} />
      </Route>
      <Route path="/rh/login" element={<RhLoginPage />} />
      <Route path="/rh" element={<Navigate to="/rh/login" replace />} />
    </Routes>
  );
}
