import type { AccountStatus } from "@gadz-connect/types";
import { Button } from "@gadz-connect/ui";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/format";
import type { UserFiltersState } from "./userFilters";
import { getActiveFilterLabel } from "./userFilters";

interface UsersFilterBarProps {
  filters: UserFiltersState;
  campuses: Array<{ id: string; name: string }>;
  showCampusFilter: boolean;
  onChange: (filters: UserFiltersState) => void;
  onReset: () => void;
  displayedCount: number;
  totalCount: number;
}

export function UsersFilterBar({
  filters,
  campuses,
  showCampusFilter,
  onChange,
  onReset,
  displayedCount,
  totalCount,
}: UsersFilterBarProps) {
  const activeLabel = getActiveFilterLabel(filters);

  return (
    <div className="space-y-3 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-xs font-medium text-ink-600">Recherche</span>
          <input
            type="search"
            value={filters.search}
            placeholder="Nom, e-mail, SIRET, ID…"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value })
            }
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-600">Rôle</span>
          <select
            value={filters.role}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-40"
            onChange={(event) =>
              onChange({
                ...filters,
                role: event.target.value as UserFiltersState["role"],
              })
            }
          >
            <option value="all">Tous</option>
            <option value="student_provider">{ROLE_LABELS.student_provider}</option>
            <option value="teacher">{ROLE_LABELS.teacher}</option>
            <option value="admin">Admins</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-600">Statut compte</span>
          <select
            value={filters.accountStatus}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-44"
            onChange={(event) =>
              onChange({
                ...filters,
                accountStatus: event.target.value as AccountStatus | "all",
              })
            }
          >
            <option value="all">Tous</option>
            {(Object.keys(STATUS_LABELS) as AccountStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        {showCampusFilter ? (
          <label className="space-y-1">
            <span className="text-xs font-medium text-ink-600">Campus</span>
            <select
              value={filters.campusId}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm lg:w-44"
              onChange={(event) =>
                onChange({ ...filters, campusId: event.target.value })
              }
            >
              <option value="all">Tous les campus</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-ink-600">
          <span className="font-medium tabular-nums text-ink-900">
            {displayedCount}
          </span>{" "}
          utilisateur{displayedCount > 1 ? "s" : ""} affiché
          {displayedCount > 1 ? "s" : ""} sur{" "}
          <span className="font-medium tabular-nums">{totalCount}</span>
        </p>
        {activeLabel ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">
              {activeLabel}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              Réinitialiser
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
