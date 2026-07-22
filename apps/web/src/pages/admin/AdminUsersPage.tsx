import type { AccountStatus } from "@gadz-connect/types";
import { Button } from "@gadz-connect/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  UsersFilterBar,
  type TeacherQuickFilter,
} from "@/features/admin/users/UsersFilterBar";
import { UsersKpiStrip } from "@/features/admin/users/UsersKpiStrip";
import {
  classifyTeacherReadiness,
  countTeacherReadiness,
} from "@/features/admin/users/teacherDirectoryGroups";
import { UsersTable } from "@/features/admin/users/UsersTable";
import {
  directoryForcedRole,
  directoryPageCopy,
  UsersDirectoryTabs,
  type MembersDirectory,
} from "@/features/admin/users/UsersDirectoryTabs";
import {
  filtersFromSearchParams,
  filtersToQueryParams,
  type UserFiltersState,
  type UserPresetFilter,
} from "@/features/admin/users/userFilters";

const PAGE_SIZE = 50;
const TEACHERS_PAGE_SIZE = 500;

function filtersToApiParams(
  filters: UserFiltersState,
  page: number,
  pageSize: number,
) {
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
    limit: pageSize,
  };
}

interface AdminUsersPageProps {
  directory?: MembersDirectory;
}

export function AdminUsersPage({ directory = "all" }: AdminUsersPageProps) {
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
  const [teacherQuickFilter, setTeacherQuickFilter] =
    useState<TeacherQuickFilter | null>(null);

  const forcedRole = directoryForcedRole(directory);
  const pageCopy = directoryPageCopy(directory);
  const pageSize =
    directory === "teachers" ? TEACHERS_PAGE_SIZE : PAGE_SIZE;

  const filters = useMemo(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    if (!forcedRole) return fromUrl;
    // Répertoires dédiés : pas de filtre statut URL parasite (SIRET etc.)
    if (directory === "students" || directory === "teachers") {
      return {
        ...fromUrl,
        role: forcedRole,
        accountStatus: "all" as const,
        preset: null,
      };
    }
    return { ...fromUrl, role: forcedRole };
  }, [searchParams, forcedRole, directory]);

  const { data: me } = useAdminMe();
  const { data: dashboard } = useAdminDashboard();
  const { data: campuses = [] } = useAdminCampuses();
  const apiParams = useMemo(
    () => filtersToApiParams(filters, page, pageSize),
    [filters, page, pageSize],
  );
  const { data, isLoading, isError, error } = useAdminProfiles(apiParams);
  const updateStatus = useUpdateProfileStatus();

  const profiles = data?.profiles ?? [];
  const teacherCounts = useMemo(() => {
    const readiness = countTeacherReadiness(profiles);
    return {
      ...readiness,
      suspended: profiles.filter((p) => p.account_status === "suspended")
        .length,
    };
  }, [profiles]);
  const displayedProfiles = useMemo(() => {
    if (directory !== "teachers" || !teacherQuickFilter) return profiles;
    if (teacherQuickFilter === "suspended") {
      return profiles.filter((p) => p.account_status === "suspended");
    }
    return profiles.filter(
      (profile) => classifyTeacherReadiness(profile) === teacherQuickFilter,
    );
  }, [directory, profiles, teacherQuickFilter]);
  const meta = data?.meta;
  const showCampusFilter = me?.role === "admin_general";
  const showCampusColumn = showCampusFilter;

  const selectedListProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ?? null;

  const updateFilters = useCallback(
    (next: UserFiltersState) => {
      setPage(1);
      const payload = forcedRole ? { ...next, role: forcedRole } : next;
      setSearchParams(filtersToQueryParams(payload), { replace: true });
    },
    [forcedRole, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setPage(1);
    setTeacherQuickFilter(null);
    if (forcedRole) {
      setSearchParams(
        filtersToQueryParams({
          search: "",
          role: forcedRole,
          accountStatus: "all",
          campusId: "all",
          preset: null,
        }),
        { replace: true },
      );
      return;
    }
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [forcedRole, setSearchParams]);

  // Sync URL role when entering a dedicated directory.
  useEffect(() => {
    if (!forcedRole) return;
    if (searchParams.get("role") === forcedRole) return;
    const next = filtersFromSearchParams(searchParams);
    setSearchParams(
      filtersToQueryParams({ ...next, role: forcedRole }),
      { replace: true },
    );
  }, [forcedRole, searchParams, setSearchParams]);

  useEffect(() => {
    setTeacherQuickFilter(null);
    setPage(1);
  }, [directory]);

  const handlePresetChange = useCallback(
    (preset: UserPresetFilter | null) => {
      updateFilters({ ...filters, preset });
    },
    [filters, updateFilters],
  );

  const handleTeacherQuickFilter = useCallback(
    (next: TeacherQuickFilter | null) => {
      setTeacherQuickFilter(next);
      if (next && next !== "suspended") {
        requestAnimationFrame(() => {
          document
            .getElementById(`teachers-${next}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    },
    [],
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
          <h2 className="text-2xl font-bold text-ink-900">{pageCopy.title}</h2>
          <p className="mt-1 text-sm text-ink-600">{pageCopy.subtitle}</p>
          <p className="mt-1 text-xs text-ink-400">{scopeLabel}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link to="/admin">← Retour au pilotage</Link>
        </Button>
      </div>

      <UsersDirectoryTabs active={directory} />

      {directory === "all" ? (
        <UsersKpiStrip
          total={kpiTotal}
          pendingSiret={kpiPending}
          verificationFailed={kpiVerificationFailed}
          suspended={kpiSuspended}
          activePreset={filters.preset}
          onPresetChange={handlePresetChange}
        />
      ) : null}

      <UsersFilterBar
        filters={filters}
        campuses={campuses}
        showCampusFilter={showCampusFilter}
        directory={directory}
        lockRole={Boolean(forcedRole)}
        teacherQuickFilter={teacherQuickFilter}
        teacherCounts={
          directory === "teachers" ? teacherCounts : undefined
        }
        onTeacherQuickFilterChange={
          directory === "teachers" ? handleTeacherQuickFilter : undefined
        }
        onChange={updateFilters}
        onReset={resetFilters}
        displayedCount={displayedProfiles.length}
        totalCount={meta?.total ?? 0}
      />

      <UsersTable
        profiles={displayedProfiles}
        filters={filters}
        directory={directory}
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

      {directory !== "teachers" && meta && meta.total > meta.pageSize ? (
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
