import type { RegistrationPath } from "@gadz-connect/types";
import { Button } from "@gadz-connect/ui";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { getActivityLabel } from "@/features/onboarding/fiscalLabels";
import { RH_CONTACT_EMAIL } from "@/features/admin/rhContact";
import type { AdminProfileRow } from "@/features/admin/types";
import { useAdminProfileDetail } from "@/features/admin/useAdmin";
import {
  formatUserDate,
  formatUserDateTime,
  formatUserName,
  getStripeStatus,
  maskStripeAccountId,
  REGISTRATION_PATH_SHORT,
  ROLE_LABELS,
  STRIPE_STATUS_LABELS,
} from "./adminUserLabels";
import { AdminStudentLearningProfileSection } from "@/features/evaluations/TutorStudentLearningCard";

interface UserDetailDrawerProps {
  profileId: string | null;
  listProfile: AdminProfileRow | null;
  onClose: () => void;
  mutatingProfileId: string | null;
  onValidate: (profileId: string) => void;
  onSuspend: (profile: AdminProfileRow) => void;
  onReactivate: (profileId: string) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="text-sm text-ink-900">{value}</dd>
    </div>
  );
}

export function UserDetailDrawer({
  profileId,
  listProfile,
  onClose,
  mutatingProfileId,
  onValidate,
  onSuspend,
  onReactivate,
}: UserDetailDrawerProps) {
  const titleId = useId();
  const { data: detail, isLoading } = useAdminProfileDetail(profileId);
  const profile = detail ?? listProfile;
  const open = Boolean(profileId && profile);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !profile) return null;

  const canValidateSiret =
    profile.account_status === "pending_siret" && Boolean(profile.siret);
  const isMutating = mutatingProfileId === profile.id;
  const registrationPath = profile.registration_path as RegistrationPath | null;
  const stripeStatus = getStripeStatus(profile);

  async function copyId() {
    await navigator.clipboard.writeText(profile!.id);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/40"
        aria-label="Fermer le panneau"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-line bg-surface shadow-raised"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-ink-900">
              {formatUserName(profile.first_name, profile.last_name)}
            </h2>
            <p className="mt-0.5 truncate text-sm text-ink-600">
              {profile.email ?? "E-mail non disponible"}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading && !detail ? (
            <p className="text-sm text-ink-400">Chargement du dossier…</p>
          ) : null}

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Identité</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <DetailRow label="Rôle" value={ROLE_LABELS[profile.role]} />
                <DetailRow
                  label="Campus"
                  value={profile.campus?.name ?? "—"}
                />
                <DetailRow
                  label="Inscription"
                  value={formatUserDate(profile.created_at)}
                />
                <DetailRow
                  label="Dernière connexion"
                  value={formatUserDateTime(profile.last_sign_in_at)}
                />
                <div className="sm:col-span-2">
                  <DetailRow label="Identifiant" value={profile.id} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 px-0 text-brand-700"
                    onClick={() => void copyId()}
                  >
                    Copier l&apos;ID
                  </Button>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink-900">Compte</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <UserStatusBadge status={profile.account_status} />
                {profile.siret_is_duplicate ? (
                  <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">
                    SIRET en doublon
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.account_status === "pending_siret" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isMutating || !canValidateSiret}
                    onClick={() => onValidate(profile.id)}
                  >
                    Activer manuellement
                  </Button>
                ) : profile.account_status === "active" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isMutating}
                    onClick={() => onSuspend(profile)}
                  >
                    Suspendre
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isMutating}
                    onClick={() => onReactivate(profile.id)}
                  >
                    Réactiver
                  </Button>
                )}
                {profile.email ? (
                  <Button type="button" size="sm" variant="ghost" asChild>
                    <a href={`mailto:${profile.email}?cc=${RH_CONTACT_EMAIL}`}>
                      Contacter
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            {profile.role === "teacher" ? (
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  Onboarding fiscal
                </h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailRow
                    label="Parcours"
                    value={
                      registrationPath
                        ? REGISTRATION_PATH_SHORT[registrationPath]
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Activité"
                    value={getActivityLabel(profile.micro_enterprise_activity)}
                  />
                  <DetailRow
                    label="SIRET"
                    value={profile.siret ?? "Non soumis"}
                  />
                  <DetailRow
                    label="Vérification SIRET"
                    value={
                      profile.siret_verification_failed
                        ? "Échec — contrôle manuel requis"
                        : "OK"
                    }
                  />
                  {detail ? (
                    <>
                      <DetailRow
                        label="Déclaration INPI"
                        value={
                          detail.inpi_declaration_sent_at
                            ? formatUserDateTime(detail.inpi_declaration_sent_at)
                            : "Non envoyée"
                        }
                      />
                      <DetailRow
                        label="Profil marketplace"
                        value={
                          detail.profile_setup_complete ? "Complet" : "Incomplet"
                        }
                      />
                    </>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {profile.role === "teacher" ? (
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  Stripe Connect
                </h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailRow
                    label="Statut"
                    value={STRIPE_STATUS_LABELS[stripeStatus]}
                  />
                  <DetailRow
                    label="Compte"
                    value={maskStripeAccountId(profile.stripe_connect_account_id)}
                  />
                </dl>
              </div>
            ) : null}

            {profile.role === "student_provider" ? (
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  Profil pédagogique
                </h3>
                <div className="mt-3">
                  <AdminStudentLearningProfileSection studentId={profile.id} />
                </div>
              </div>
            ) : null}

            {detail ? (
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Activité</h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailRow
                    label="Cours enseignés"
                    value={String(detail.coursesAsProvider)}
                  />
                  <DetailRow
                    label="Cours suivis"
                    value={String(detail.coursesAsClient)}
                  />
                </dl>
              </div>
            ) : null}
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
