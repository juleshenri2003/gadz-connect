import type { AccountStatus } from "@gadz-connect/types";
import { Button, cn } from "@gadz-connect/ui";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/format";
import type { MembersDirectory } from "./UsersDirectoryTabs";
import type { TeacherReadinessClass } from "./teacherDirectoryGroups";
import type { UserFiltersState } from "./userFilters";
import { getActiveFilterLabel } from "./userFilters";

export type TeacherQuickFilter = TeacherReadinessClass | "suspended";

interface UsersFilterBarProps {
  filters: UserFiltersState;
  campuses: Array<{ id: string; name: string }>;
  showCampusFilter: boolean;
  directory?: MembersDirectory;
  /** Masquer le sélecteur de rôle (répertoire dédié). */
  lockRole?: boolean;
  teacherQuickFilter?: TeacherQuickFilter | null;
  teacherCounts?: {
    ready: number;
    missing_siret: number;
    missing_stripe: number;
    suspended: number;
  };
  onTeacherQuickFilterChange?: (next: TeacherQuickFilter | null) => void;
  onChange: (filters: UserFiltersState) => void;
  onReset: () => void;
  displayedCount: number;
  totalCount: number;
}

const TEACHER_CHIPS: Array<{
  id: TeacherQuickFilter;
  label: string;
  activeClass: string;
}> = [
  {
    id: "ready",
    label: "Complets",
    activeClass: "bg-success-bg text-success ring-success",
  },
  {
    id: "missing_siret",
    label: "Sans SIRET",
    activeClass: "bg-warning-bg text-warning ring-warning",
  },
  {
    id: "missing_stripe",
    label: "Sans Stripe",
    activeClass: "bg-paper text-ink-800 ring-ink-400",
  },
  {
    id: "suspended",
    label: "Suspendus",
    activeClass: "bg-danger-bg text-danger ring-danger",
  },
];

export function UsersFilterBar({
  filters,
  campuses,
  showCampusFilter,
  directory = "all",
  lockRole = false,
  teacherQuickFilter = null,
  teacherCounts,
  onTeacherQuickFilterChange,
  onChange,
  onReset,
  displayedCount,
  totalCount,
}: UsersFilterBarProps) {
  const isTeachers = directory === "teachers";
  const isStudents = directory === "students";
  const activeLabel = getActiveFilterLabel(filters);
  const searchPlaceholder = isStudents
    ? "Nom, prénom…"
    : isTeachers
      ? "Nom, prénom, e-mail…"
      : "Nom, e-mail, SIRET, ID…";

  const hasActive =
    Boolean(activeLabel) ||
    (isTeachers && teacherQuickFilter !== null) ||
    Boolean(filters.search.trim());

  return (
    <div className="space-y-3 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-xs font-medium text-ink-600">
            {isStudents ? "Rechercher un élève" : "Recherche"}
          </span>
          <input
            type="search"
            value={filters.search}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value })
            }
          />
        </label>

        {!lockRole && !isStudents && !isTeachers ? (
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
              <option value="student_provider">
                {ROLE_LABELS.student_provider}
              </option>
              <option value="teacher">{ROLE_LABELS.teacher}</option>
              <option value="admin">Admins</option>
            </select>
          </label>
        ) : null}

        {!isStudents && !isTeachers ? (
          <label className="space-y-1">
            <span className="text-xs font-medium text-ink-600">
              Statut compte
            </span>
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
        ) : null}

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

      {isTeachers && onTeacherQuickFilterChange ? (
        <div className="flex flex-wrap gap-2">
          {TEACHER_CHIPS.map((chip) => {
            const count = teacherCounts
              ? chip.id === "suspended"
                ? teacherCounts.suspended
                : teacherCounts[chip.id]
              : undefined;
            const active = teacherQuickFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() =>
                  onTeacherQuickFilterChange(active ? null : chip.id)
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition ring-offset-1",
                  active
                    ? `ring-2 ${chip.activeClass}`
                    : "border border-line bg-paper text-ink-700 hover:bg-surface",
                )}
              >
                {chip.label}
                {count !== undefined ? (
                  <span className="ml-1.5 tabular-nums opacity-80">
                    ({count})
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-ink-600">
          <span className="font-medium tabular-nums text-ink-900">
            {displayedCount}
          </span>{" "}
          {isStudents
            ? `élève${displayedCount > 1 ? "s" : ""}`
            : isTeachers
              ? `professeur${displayedCount > 1 ? "s" : ""}`
              : `utilisateur${displayedCount > 1 ? "s" : ""}`}{" "}
          affiché
          {displayedCount > 1 ? "s" : ""}
          {totalCount > 0 ? (
            <>
              {" "}
              sur{" "}
              <span className="font-medium tabular-nums">{totalCount}</span>
            </>
          ) : null}
        </p>
        {hasActive ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeLabel && !isTeachers && !isStudents ? (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">
                {activeLabel}
              </span>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              Réinitialiser
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
