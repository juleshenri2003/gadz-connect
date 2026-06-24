import { Button } from "@gadz-connect/ui";
import { Link, useNavigate } from "react-router-dom";
import { RH_CONTACT_EMAIL } from "@/features/admin/rhContact";
import { isStudent } from "@/features/auth/roles";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  MarketplaceVisibilityPill,
  TeacherMarketplaceVisibility,
} from "@/features/dashboard/teacher-cockpit/TeacherMarketplaceVisibility";
import { useStudentDashboardProgress } from "@/features/dashboard/useStudentDashboardProgress";
import { coursesTabHref } from "@/features/marketplace/teacherCoursesTab";
import { useMyTutorProfile } from "@/features/marketplace/useTutors";
import { WrongProfileLink } from "@/features/onboarding/WrongProfileContact";
import { ProfilePageSkeleton } from "@/features/profile/ProfilePageSkeleton";
import {
  AccountStatusBadge,
  TeacherProfileAccountCard,
} from "@/features/profile/TeacherProfileAccountCard";
import { StudentProfileAccountCard } from "@/features/profile/StudentProfileAccountCard";
import { StudentProfileHeader } from "@/features/profile/StudentProfileHeader";
import { StudentProfileJourneyCard } from "@/features/profile/StudentProfileJourneyCard";
import { TeacherProfilePhotoSection } from "@/features/profile/TeacherProfilePhotoSection";
import { TeacherProfileCvSection } from "@/features/profile/TeacherProfileCvSection";
import { TeacherProfileStudentPreview } from "@/features/profile/TeacherProfileStudentPreview";
import { TeacherPublicProfileForm } from "@/features/profile/TeacherPublicProfileForm";

function SuspendedAccountBanner() {
  return (
    <div
      className="rounded-md border border-danger/20 bg-danger-bg px-4 py-4 text-sm text-danger"
      role="alert"
    >
      <p className="font-medium">Compte suspendu</p>
      <p className="mt-2">
        Votre accès prestataire est suspendu. Contactez l&apos;équipe campus pour
        plus d&apos;informations.
      </p>
      <Button className="mt-3" size="sm" variant="outline" asChild>
        <a href={`mailto:${RH_CONTACT_EMAIL}?subject=Compte%20suspendu%20Gadz'Connect`}>
          Contacter le support
        </a>
      </Button>
    </div>
  );
}

function SiretStatusAlert({
  accountStatus,
  siretVerificationFailed,
}: {
  accountStatus: string;
  siretVerificationFailed: boolean;
}) {
  if (!siretVerificationFailed && accountStatus !== "pending_siret") return null;

  const message = siretVerificationFailed
    ? "Votre SIRET n'a pas pu être vérifié. Corrigez-le depuis la page Micro-entreprise."
    : "Votre compte est en attente de validation SIRET. Complétez ou vérifiez votre déclaration.";

  return (
    <div
      className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
      role="status"
    >
      <p>{message}</p>
      <Button className="mt-3" size="sm" variant="outline" asChild>
        <Link to="/app/micro-entreprise">Aller à Micro-entreprise →</Link>
      </Button>
    </div>
  );
}

function StudentProfileView({
  email,
  profile,
}: {
  email: string | undefined;
  profile: NonNullable<ReturnType<typeof useMyProfile>["data"]>;
}) {
  const { progress } = useStudentDashboardProgress();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StudentProfileHeader profile={profile} />

      <StudentProfileAccountCard profile={profile} email={email} />

      {progress ? <StudentProfileJourneyCard progress={progress} /> : null}

      <WrongProfileLink className="text-center text-ink-400" useModal />
    </div>
  );
}

function ProfileLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <p className="text-sm text-danger">Impossible de charger votre profil</p>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}

export function ProviderProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading, isError, refetch } = useMyProfile();

  const studentRole = profile ? isStudent(profile.role) : false;
  const { data: tutorProfile } = useMyTutorProfile({
    enabled: Boolean(profile) && !studentRole,
  });

  if (isLoading) {
    return <ProfilePageSkeleton variant="teacher" />;
  }

  if (isError || !profile) {
    return <ProfileLoadError onRetry={() => void refetch()} />;
  }

  const student = isStudent(profile.role);
  const marketplace = profile.marketplace ?? tutorProfile?.marketplace;

  if (student) {
    return <StudentProfileView email={user?.email} profile={profile} />;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Mon profil</h2>
            <p className="mt-1 text-sm text-ink-600">
              Votre hub personnel — compte, profil public et CV
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AccountStatusBadge status={profile.account_status} />
            <MarketplaceVisibilityPill marketplace={marketplace} />
          </div>
        </div>
        <WrongProfileLink />
      </header>

      {profile.account_status === "suspended" ? <SuspendedAccountBanner /> : null}

      <SiretStatusAlert
        accountStatus={profile.account_status}
        siretVerificationFailed={profile.siret_verification_failed}
      />

      <TeacherMarketplaceVisibility
        marketplace={marketplace}
        onFixRate={() => {
          document
            .getElementById("teacher-public-profile")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onFixSlots={() => navigate(coursesTabHref("slots"))}
      />

      <TeacherProfileAccountCard profile={profile} email={user?.email} />

      <TeacherPublicProfileForm profile={profile} variant="standalone" />

      <TeacherProfilePhotoSection profile={profile} />

      <TeacherProfileCvSection profile={profile} />

      <TeacherProfileStudentPreview
        profile={profile}
        bio={tutorProfile?.bio}
        subjects={tutorProfile?.subjects ?? profile.subjects}
        hourlyRate={tutorProfile?.hourly_rate ?? profile.hourly_rate}
      />
    </div>
  );
}
