import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ProviderRoute } from "@/components/ProviderRoute";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { ProviderLayout } from "@/features/provider/ProviderLayout";
import { PublicLayout } from "@/features/layout/PublicLayout";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";
import { ConnexionRedirect } from "@/pages/auth/ConnexionRedirect";
import { StripeReturnPage } from "@/pages/stripe/StripeReturnPage";
import { RhLoginPage } from "@/pages/rh/RhLoginPage";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { AdminMembersRedirect } from "@/pages/admin/AdminMembersRedirect";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminBudgetsPage } from "@/pages/admin/AdminBudgetsPage";
import { AdminCoursesPage } from "@/pages/admin/AdminCoursesPage";
import { AdminSchedulePage } from "@/pages/admin/AdminSchedulePage";
import { ProfileSetupPage } from "@/pages/provider/ProfileSetupPage";
import { StudentOnboardingPage } from "@/pages/provider/StudentOnboardingPage";
import { ProviderOverviewPage } from "@/pages/provider/ProviderOverviewPage";
import { ProviderCoursesPage } from "@/pages/provider/ProviderCoursesPage";
import { ProviderOnboardingPage } from "@/pages/provider/ProviderOnboardingPage";
import { ProviderPaymentsPage } from "@/pages/provider/ProviderPaymentsPage";
import { ProviderProfilePage } from "@/pages/provider/ProviderProfilePage";
import { StudentInvoicesPage } from "@/pages/provider/StudentInvoicesPage";
import { TutorDetailPage } from "@/pages/provider/TutorDetailPage";
import { NotificationsPage } from "@/pages/shared/NotificationsPage";
import { SchedulePage } from "@/pages/provider/SchedulePage";
import {
  StudentRepositoryFolderPage,
  StudentRepositoryPage,
} from "@/pages/provider/StudentRepositoryPage";
import { TutorOnlyRoute } from "@/pages/provider/TutorOnlyRoute";
import { CourseEvaluationsPage } from "@/pages/provider/CourseEvaluationsPage";
import {
  PublicMarketplacePage,
} from "@/pages/public/PublicMarketplacePage";
import { PublicTutorDetailPage } from "@/pages/public/PublicTutorDetailPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicMarketplacePage />} />
        <Route path="/tuteurs/:id" element={<PublicTutorDetailPage />} />
        {/* Vision SEO : alias campus */}
        <Route
          path="/campus/:campusSlug/tuteurs"
          element={<PublicMarketplacePage />}
        />
      </Route>

      <Route path="/connexion" element={<ConnexionRedirect />} />
      <Route path="/auth/login" element={<ConnexionRedirect />} />
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
        <Route path="onboarding" element={<StudentOnboardingPage />} />
        <Route index element={<ProviderOverviewPage />} />
        <Route path="planning" element={<SchedulePage />} />
        <Route path="alertes" element={<NotificationsPage />} />
        <Route path="cours" element={<ProviderCoursesPage />} />
        <Route path="cours/:id" element={<TutorDetailPage />} />
        <Route path="repertoire" element={<StudentRepositoryPage />} />
        <Route path="repertoire/:folderId" element={<StudentRepositoryFolderPage />} />
        <Route path="suivi-cours" element={<CourseEvaluationsPage />} />
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
        <Route path="factures" element={<StudentInvoicesPage />} />
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
        <Route path="alertes" element={<NotificationsPage />} />
        <Route path="utilisateurs" element={<AdminUsersPage />} />
        <Route path="membres" element={<AdminMembersRedirect />} />
        <Route path="budgets" element={<AdminBudgetsPage />} />
        <Route path="cours" element={<AdminCoursesPage />} />
      </Route>
      <Route path="/rh/login" element={<RhLoginPage />} />
      <Route path="/rh" element={<Navigate to="/rh/login" replace />} />
    </Routes>
  );
}
