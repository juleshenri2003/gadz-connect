import type { RegistrationPath } from "@gadz-connect/types";
import { Button, cn } from "@gadz-connect/ui";
import type { AdminProfileRow } from "@/features/admin/types";
import {
  formatUserName,
  getStripeStatus,
  REGISTRATION_PATH_SHORT,
  ROLE_LABELS,
  STRIPE_STATUS_LABELS,
} from "./adminUserLabels";
import { UserStatusBadge } from "./UserStatusBadge";

interface UserMobileCardProps {
  profile: AdminProfileRow;
  showCampus: boolean;
  isMutating: boolean;
  onOpen: () => void;
  onValidate: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}

export function UserMobileCard({
  profile,
  showCampus,
  isMutating,
  onOpen,
  onValidate,
  onSuspend,
  onReactivate,
}: UserMobileCardProps) {
  const canValidateSiret =
    profile.account_status === "pending_siret" && Boolean(profile.siret);
  const registrationPath = profile.registration_path as RegistrationPath | null;

  const stripeStatus = getStripeStatus(profile);

  return (
    <li>
      <button
        type="button"
        className="flex w-full flex-col gap-2 p-4 text-left active:bg-paper"
        onClick={onOpen}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-ink-900">
              {formatUserName(profile.first_name, profile.last_name)}
            </p>
            <p className="truncate text-sm text-ink-600">
              {profile.email ?? "—"}
            </p>
          </div>
          <UserStatusBadge status={profile.account_status} />
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-ink-600">
          <span>{ROLE_LABELS[profile.role]}</span>
          {showCampus && profile.campus?.name ? (
            <>
              <span aria-hidden>·</span>
              <span>{profile.campus.name}</span>
            </>
          ) : null}
          {profile.role === "teacher" ? (
            <>
              <span aria-hidden>·</span>
              <span>{STRIPE_STATUS_LABELS[stripeStatus]}</span>
            </>
          ) : null}
        </div>

        {profile.role === "teacher" && registrationPath ? (
          <p className="text-xs text-ink-400">
            {REGISTRATION_PATH_SHORT[registrationPath]}
          </p>
        ) : null}

        {profile.siret_verification_failed ? (
          <span className="inline-flex w-fit rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">
            SIRET en échec
          </span>
        ) : null}
      </button>

      {profile.account_status === "pending_siret" ||
      profile.account_status === "active" ||
      profile.account_status === "suspended" ? (
        <div
          className="flex gap-2 border-t border-line/60 px-4 py-3"
          onClick={(event) => event.stopPropagation()}
        >
          {profile.account_status === "pending_siret" ? (
            <Button
              type="button"
              size="sm"
              className="min-h-11 flex-1"
              disabled={isMutating || !canValidateSiret}
              onClick={onValidate}
            >
              Activer
            </Button>
          ) : profile.account_status === "active" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 flex-1"
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
              className={cn("min-h-11 flex-1")}
              disabled={isMutating}
              onClick={onReactivate}
            >
              Réactiver
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}
