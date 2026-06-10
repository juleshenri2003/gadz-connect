import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/format";
import {
  useAdminProfiles,
  useUpdateProfileStatus,
} from "@/features/admin/useAdmin";

function ProfileRow({
  profile,
  onValidate,
  onSuspend,
  onReactivate,
  validating,
}: {
  profile: NonNullable<ReturnType<typeof useAdminProfiles>["data"]>[number];
  onValidate: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  validating: boolean;
}) {
  const canValidateSiret =
    profile.account_status === "pending_siret" && Boolean(profile.siret);

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <span className="font-medium">
          {profile.first_name || profile.last_name
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : "—"}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">
        {profile.id.slice(0, 8)}…
      </td>
      <td className="px-4 py-3">{profile.campus?.name ?? "—"}</td>
      <td className="px-4 py-3">{ROLE_LABELS[profile.role]}</td>
      <td className="px-4 py-3">
        {profile.siret ? (
          <span className="font-mono text-xs">{profile.siret}</span>
        ) : profile.account_status === "pending_siret" ? (
          <span className="text-xs text-amber-700">Non soumis</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={
            profile.account_status === "pending_siret"
              ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
              : profile.account_status === "active"
                ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900"
                : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
          }
        >
          {STATUS_LABELS[profile.account_status]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {profile.stripe_connect_account_id
          ? profile.stripe_connect_onboarding_complete
            ? "Actif"
            : "En cours"
          : "—"}
      </td>
      <td className="px-4 py-3">
        {profile.account_status === "pending_siret" ? (
          <div className="space-y-1">
            <Button
              type="button"
              size="sm"
              disabled={validating || !canValidateSiret}
              onClick={onValidate}
            >
              Valider SIRET
            </Button>
            {!profile.siret ? (
              <p className="max-w-[10rem] text-[10px] text-slate-500">
                Le professeur doit d&apos;abord saisir son SIRET
              </p>
            ) : null}
          </div>
        ) : profile.account_status === "active" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={validating}
            onClick={onSuspend}
          >
            Suspendre
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={validating}
            onClick={onReactivate}
          >
            Réactiver
          </Button>
        )}
      </td>
    </tr>
  );
}

export function AdminMembersPage() {
  const { data: profiles, isLoading, isError, error } = useAdminProfiles();
  const updateStatus = useUpdateProfileStatus();

  const pendingProfiles =
    profiles?.filter((p) => p.account_status === "pending_siret") ?? [];
  const otherProfiles =
    profiles?.filter((p) => p.account_status !== "pending_siret") ?? [];

  const tableHeader = (
    <thead className="border-b bg-slate-50 text-slate-600">
      <tr>
        <th className="px-4 py-3 font-medium">Membre</th>
        <th className="px-4 py-3 font-medium">ID</th>
        <th className="px-4 py-3 font-medium">Campus</th>
        <th className="px-4 py-3 font-medium">Rôle</th>
        <th className="px-4 py-3 font-medium">SIRET</th>
        <th className="px-4 py-3 font-medium">Statut</th>
        <th className="px-4 py-3 font-medium">Stripe</th>
        <th className="px-4 py-3 font-medium">Actions</th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Supervision des membres
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Validation manuelle du SIRET déclaré par les professeurs
        </p>
      </div>

      {pendingProfiles.length > 0 ? (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">
              En attente SIRET ({pendingProfiles.length})
            </CardTitle>
            <CardDescription>
              Professeurs ayant complété l&apos;onboarding — validez après
              déclaration du numéro SIRET
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                {tableHeader}
                <tbody>
                  {pendingProfiles.map((profile) => (
                    <ProfileRow
                      key={profile.id}
                      profile={profile}
                      validating={updateStatus.isPending}
                      onValidate={() =>
                        void updateStatus.mutateAsync({
                          profileId: profile.id,
                          account_status: "active",
                        })
                      }
                      onSuspend={() => {}}
                      onReactivate={() => {}}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tous les membres ({profiles?.length ?? 0})
          </CardTitle>
          <CardDescription>
            Campus, rôle, SIRET, statut compte et état Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-slate-500">Chargement…</p>
          ) : isError ? (
            <p className="p-4 text-sm text-red-600">{(error as Error).message}</p>
          ) : profiles && profiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                {tableHeader}
                <tbody>
                  {otherProfiles.map((profile) => (
                    <ProfileRow
                      key={profile.id}
                      profile={profile}
                      validating={updateStatus.isPending}
                      onValidate={() => {}}
                      onSuspend={() =>
                        void updateStatus.mutateAsync({
                          profileId: profile.id,
                          account_status: "suspended",
                        })
                      }
                      onReactivate={() =>
                        void updateStatus.mutateAsync({
                          profileId: profile.id,
                          account_status: "active",
                        })
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-sm text-slate-500">
              Aucun profil. Les inscriptions apparaîtront ici automatiquement.
            </p>
          )}
          {updateStatus.error ? (
            <p className="px-4 pb-4 text-sm text-red-600">
              {updateStatus.error.message}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
