import { Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import type { ReactNode } from "react";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/format";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { campusDisplayName } from "@/features/campus/campusLabels";
import { ProviderProfileIdentityForm } from "@/features/profile/ProviderProfileIdentityForm";

interface FieldRowProps {
  label: string;
  value: ReactNode;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink-900">{value ?? "—"}</dd>
    </div>
  );
}

function formatMemberSince(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

interface StudentProfileAccountCardProps {
  profile: MyProfile;
  email: string | undefined;
}

export function StudentProfileAccountCard({
  profile,
  email,
}: StudentProfileAccountCardProps) {
  const campusName = profile.campus?.name
    ? campusDisplayName(profile.campus.name)
    : null;
  const memberSince = formatMemberSince(profile.created_at);

  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle className="text-lg">Identité et compte</CardTitle>
        <p className="text-sm text-ink-400">
          Modifiez votre nom ou campus si besoin.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <ProviderProfileIdentityForm
          profile={profile}
          email={email}
          variant="student"
        />

        <section className="border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-ink-900">Votre compte</h3>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            <FieldRow label="E-mail" value={email ?? "—"} />
            <FieldRow label="Rôle" value={ROLE_LABELS[profile.role]} />
            <FieldRow label="Campus" value={campusName} />
            <FieldRow
              label="Statut"
              value={STATUS_LABELS[profile.account_status]}
            />
            {memberSince ? (
              <FieldRow label="Membre depuis" value={memberSince} />
            ) : null}
          </dl>
        </section>
      </CardContent>
    </Card>
  );
}
