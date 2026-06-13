import type { RegistrationPath } from "@gadz-connect/types";
import { Button, cn } from "@gadz-connect/ui";
import type { AdminProfileRow } from "@/features/admin/types";
import {
  formatUserDate,
  formatUserName,
  getStripeStatus,
  REGISTRATION_PATH_SHORT,
  ROLE_LABELS,
  STRIPE_STATUS_LABELS,
} from "./adminUserLabels";
import { UserStatusBadge } from "./UserStatusBadge";

interface UserTableRowProps {
  profile: AdminProfileRow;
  showCampus: boolean;
  isMutating: boolean;
  onOpen: () => void;
  onValidate: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}

function StripeBadge({ profile }: { profile: AdminProfileRow }) {
  const status = getStripeStatus(profile);
  const styles = {
    none: "bg-paper text-ink-600",
    pending: "bg-warning-bg text-warning",
    active: "bg-success-bg text-success",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {STRIPE_STATUS_LABELS[status]}
    </span>
  );
}

export function UserTableRow({
  profile,
  showCampus,
  isMutating,
  onOpen,
  onValidate,
  onSuspend,
  onReactivate,
}: UserTableRowProps) {
  const canValidateSiret =
    profile.account_status === "pending_siret" && Boolean(profile.siret);
  const registrationPath = profile.registration_path as RegistrationPath | null;

  return (
    <tr
      className="cursor-pointer border-b last:border-0 hover:bg-paper/80"
      onClick={onOpen}
    >
      <td className="px-4 py-3">
        <span className="font-medium">
          {formatUserName(profile.first_name, profile.last_name)}
        </span>
      </td>
      <td className="max-w-[12rem] truncate px-4 py-3 text-sm text-ink-600">
        {profile.email ?? "—"}
      </td>
      {showCampus ? (
        <td className="px-4 py-3">{profile.campus?.name ?? "—"}</td>
      ) : null}
      <td className="px-4 py-3 text-sm">{ROLE_LABELS[profile.role]}</td>
      <td className="px-4 py-3 text-sm tabular-nums">
        {formatUserDate(profile.created_at)}
      </td>
      <td className="px-4 py-3 text-xs text-ink-600">
        {profile.role === "teacher" && registrationPath
          ? REGISTRATION_PATH_SHORT[registrationPath]
          : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {profile.siret ? (
            <span className="font-mono text-xs">{profile.siret}</span>
          ) : profile.account_status === "pending_siret" ? (
            <span className="text-xs text-warning">Non soumis</span>
          ) : (
            <span className="text-xs text-ink-400">—</span>
          )}
          {profile.siret_is_duplicate ? (
            <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-[10px] font-medium text-danger">
              Doublon
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <UserStatusBadge status={profile.account_status} />
      </td>
      <td className="px-4 py-3">
        {profile.siret_verification_failed ? (
          <span
            className="inline-flex rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger"
            title="Vérification SIRET en échec"
          >
            SIRET
          </span>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {profile.role === "teacher" ? (
          <StripeBadge profile={profile} />
        ) : (
          <span className="text-xs text-ink-400">—</span>
        )}
      </td>
      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
        {profile.account_status === "pending_siret" ? (
          <div className="space-y-1">
            <Button
              type="button"
              size="sm"
              disabled={isMutating || !canValidateSiret}
              title={
                !profile.siret
                  ? "Le professeur doit d'abord saisir son SIRET"
                  : "Activation manuelle (cas exceptionnel)"
              }
              onClick={onValidate}
            >
              Activer
            </Button>
          </div>
        ) : profile.account_status === "active" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isMutating}
            onClick={onSuspend}
          >
            Suspendre
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isMutating}
            onClick={onReactivate}
          >
            Réactiver
          </Button>
        )}
      </td>
    </tr>
  );
}
