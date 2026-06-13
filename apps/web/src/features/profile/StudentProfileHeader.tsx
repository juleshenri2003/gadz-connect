import type { MyProfile } from "@/features/auth/useMyProfile";
import { campusDisplayName } from "@/features/campus/campusLabels";
import { AccountStatusBadge } from "@/features/profile/TeacherProfileAccountCard";

interface StudentProfileHeaderProps {
  profile: MyProfile;
}

export function StudentProfileHeader({ profile }: StudentProfileHeaderProps) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const campusName = profile.campus?.name
    ? campusDisplayName(profile.campus.name)
    : null;

  return (
    <header>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">
            {fullName || "Mon profil"}
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            {campusName ? `Campus ${campusName}` : "Votre espace élève Gadz'Connect"}
            {" · "}
            Compte élève — pas de micro-entreprise requise
          </p>
        </div>
        {profile.account_status === "active" ? (
          <AccountStatusBadge status={profile.account_status} />
        ) : null}
      </div>
    </header>
  );
}
