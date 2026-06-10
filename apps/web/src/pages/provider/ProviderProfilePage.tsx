import { Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/format";
import { isStudent } from "@/features/auth/roles";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile } from "@/features/auth/useMyProfile";

export function ProviderProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, isError } = useMyProfile();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement du profil…</p>;
  }

  if (isError || !profile) {
    return (
      <p className="text-sm text-red-600">Impossible de charger votre profil</p>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const student = isStudent(profile.role);

  const fields = student
    ? [
        ["E-mail", user?.email],
        ["Rôle", ROLE_LABELS[profile.role]],
        ["Campus", profile.campus?.name],
        ["Statut", "Compte élève actif"],
      ]
    : [
        ["E-mail", user?.email],
        ["Rôle", ROLE_LABELS[profile.role]],
        ["Campus", profile.campus?.name],
        ["Statut", STATUS_LABELS[profile.account_status]],
        ["SIRET", profile.siret ?? "Non renseigné"],
        ["Activité", profile.micro_enterprise_activity ?? "—"],
        ["Périodicité URSSAF", profile.urssaf_periodicity ?? "—"],
        [
          "Versement libératoire",
          profile.versement_liberatoire ? "Oui" : "Non",
        ],
      ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mon profil</h2>
        <p className="mt-1 text-sm text-slate-600">
          {student
            ? "Votre compte élève — pas de micro-entreprise requise"
            : "Informations de votre compte prestataire"}
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">{fullName || user?.email}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {value ?? "—"}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
