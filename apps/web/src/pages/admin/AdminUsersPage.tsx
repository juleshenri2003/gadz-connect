import type { AccountStatus } from "@gadz-connect/types";
import { Button } from "@gadz-connect/ui";
import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import type { AdminProfileRow } from "@/features/admin/types";
import {
  useAdminCampuses,
  useAdminDashboard,
  useAdminMe,
  useAdminProfiles,
  useUpdateProfileStatus,
} from "@/features/admin/useAdmin";
import { UserDetailDrawer } from "@/features/admin/users/UserDetailDrawer";
import { UsersFilterBar } from "@/features/admin/users/UsersFilterBar";
import { UsersKpiStrip } from "@/features/admin/users/UsersKpiStrip";
import { UsersTable } from "@/features/admin/users/UsersTable";
import {
  filtersFromSearchParams,
  filtersToQueryParams,
  type UserFiltersState,
  type UserPresetFilter,
} from "@/features/admin/users/userFilters";

const PAGE_SIZE = 50;

function filtersToApiParams(filters: UserFiltersState, page: number) {
  return {
    search: filters.search.trim() || undefined,
    role: filters.role !== "all" ? filters.role : undefined,
    account_status:
      filters.accountStatus !== "all"
        ? (filters.accountStatus as AccountStatus)
        : undefined,
    campus_id: filters.campusId !== "all" ? filters.campusId : undefined,
    filter: filters.preset ?? undefined,
    page,
    limit: PAGE_SIZE,
  };
}

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [mutatingProfileId, setMutatingProfileId] = useState<string | null>(
    null,
  );
  const [suspendTarget, setSuspendTarget] = useState<AdminProfileRow | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );

  const { data: me } = useAdminMe();
  const { data: dashboard } = useAdminDashboard();
  const { data: campuses = [] } = useAdminCampuses();
  const apiParams = useMemo(
    () => filtersToApiParams(filters, page),
    [filters, page],
  );
  const { data, isLoading, isError, error } = useAdminProfiles(apiParams);
  const updateStatus = useUpdateProfileStatus();

  const profiles = data?.profiles ?? [];
  const meta = data?.meta;
  const showCampusFilter = me?.role === "admin_general";
  const showCampusColumn = showCampusFilter;

  const selectedListProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ?? null;

  const updateFilters = useCallback(
    (next: UserFiltersState) => {
      setPage(1);
      setSearchParams(filtersToQueryParams(next), { replace: true });
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const handlePresetChange = useCallback(
    (preset: UserPresetFilter | null) => {
      updateFilters({ ...filters, preset });
    },
    [filters, updateFilters],
  );

  async function runStatusUpdate(
    profileId: string,
    account_status: AccountStatus,
    successMessage: string,
  ) {
    setMutatingProfileId(profileId);
    try {
      await updateStatus.mutateAsync({ profileId, account_status });
      setToast({ message: successMessage, variant: "success" });
      setSelectedProfileId(profileId);
    } catch (mutationError) {
      setToast({
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Action impossible",
        variant: "error",
      });
    } finally {
      setMutatingProfileId(null);
    }
  }

  const scopeLabel =
    dashboard?.scope === "global"
      ? "Tous les campus Arts et Métiers"
      : "Périmètre limité à votre campus";

  const kpiTotal = dashboard?.profiles.total ?? 0;
  const kpiPending = dashboard?.profiles.byStatus.pending_siret ?? 0;
  const kpiVerificationFailed = dashboard?.onboarding.verificationFailed ?? 0;
  const kpiSuspended = dashboard?.profiles.byStatus.suspended ?? 0;

  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.pageSize))
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Utilisateurs</h2>
          <p className="mt-1 text-sm text-ink-600">
            Supervision des comptes — dossiers SIRET, doublons, suspensions
          </p>
          <p className="mt-1 text-xs text-ink-400">{scopeLabel}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link to="/admin">← Retour au pilotage</Link>
        </Button>
      </div>

      <UsersKpiStrip
        total={kpiTotal}
        pendingSiret={kpiPending}
        verificationFailed={kpiVerificationFailed}
        suspended={kpiSuspended}
        activePreset={filters.preset}
        onPresetChange={handlePresetChange}
      />

      <UsersFilterBar
        filters={filters}
        campuses={campuses}
        showCampusFilter={showCampusFilter}
        onChange={updateFilters}
        onReset={resetFilters}
        displayedCount={profiles.length}
        totalCount={meta?.total ?? 0}
      />

      <UsersTable
        profiles={profiles}
        filters={filters}
        showCampus={showCampusColumn}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error)?.message}
        mutatingProfileId={mutatingProfileId}
        onOpenProfile={setSelectedProfileId}
        onValidate={(profileId) =>
          void runStatusUpdate(
            profileId,
            "active",
            "Compte activé — vérification auto-entrepreneur, Stripe et notification envoyés.",
          )
        }
        onSuspend={setSuspendTarget}
        onReactivate={(profileId) =>
          void runStatusUpdate(profileId, "active", "Compte réactivé.")
        }
      />

      {meta && meta.total > meta.pageSize ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-ink-600">
            Page {meta.page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}

      {updateStatus.error && !toast ? (
        <p className="text-sm text-danger">{updateStatus.error.message}</p>
      ) : null}

      <UserDetailDrawer
        profileId={selectedProfileId}
        listProfile={selectedListProfile}
        onClose={() => setSelectedProfileId(null)}
        mutatingProfileId={mutatingProfileId}
        onValidate={(profileId) =>
          void runStatusUpdate(
            profileId,
            "active",
            "Compte activé — vérification auto-entrepreneur, Stripe et notification envoyés.",
          )
        }
        onSuspend={setSuspendTarget}
        onReactivate={(profileId) =>
          void runStatusUpdate(profileId, "active", "Compte réactivé.")
        }
      />

      <Modal
        open={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        title="Suspendre le compte"
        description={
          suspendTarget
            ? `Suspendre ${suspendTarget.first_name} ${suspendTarget.last_name} ? L'utilisateur ne pourra plus se connecter.`
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSuspendTarget(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90"
              disabled={Boolean(mutatingProfileId)}
              onClick={() => {
                if (!suspendTarget) return;
                const target = suspendTarget;
                setSuspendTarget(null);
                void runStatusUpdate(
                  target.id,
                  "suspended",
                  "Compte suspendu.",
                );
              }}
            >
              Suspendre
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-600">
          Cette action est réversible depuis la liste ou la fiche détail.
        </p>
      </Modal>

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
