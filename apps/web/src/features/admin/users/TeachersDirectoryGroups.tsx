import { cn } from "@gadz-connect/ui";
import type { AdminProfileRow } from "@/features/admin/types";
import { UserMobileCard } from "./UserMobileCard";
import { UserTableRow } from "./UserTableRow";
import {
  groupTeachersByReadiness,
  classifyTeacherReadiness,
  type TeacherReadinessClass,
} from "./teacherDirectoryGroups";

interface TeachersDirectoryGroupsProps {
  profiles: AdminProfileRow[];
  showCampus: boolean;
  mutatingProfileId: string | null;
  onOpenProfile: (profileId: string) => void;
  onValidate: (profileId: string) => void;
  onSuspend: (profile: AdminProfileRow) => void;
  onReactivate: (profileId: string) => void;
}

const CLASS_STYLES: Record<
  TeacherReadinessClass,
  { accent: string; badge: string; header: string }
> = {
  ready: {
    accent: "border-l-success",
    badge: "bg-success-bg text-success",
    header: "bg-success-bg/40",
  },
  missing_siret: {
    accent: "border-l-warning",
    badge: "bg-warning-bg text-warning",
    header: "bg-warning-bg/40",
  },
  missing_stripe: {
    accent: "border-l-danger",
    badge: "bg-danger-bg text-danger",
    header: "bg-danger-bg/30",
  },
};

export function TeachersDirectoryGroups({
  profiles,
  showCampus,
  mutatingProfileId,
  onOpenProfile,
  onValidate,
  onSuspend,
  onReactivate,
}: TeachersDirectoryGroupsProps) {
  const groups = groupTeachersByReadiness(profiles);
  const presentClasses = new Set(
    profiles.map((profile) => classifyTeacherReadiness(profile)),
  );
  const visibleGroups =
    presentClasses.size === 1
      ? groups.filter((group) => presentClasses.has(group.id))
      : groups;

  return (
    <div className="space-y-6">
      {visibleGroups.map((group) => {
        const styles = CLASS_STYLES[group.id];
        const isEmpty = group.profiles.length === 0;

        return (
          <section
            key={group.id}
            id={`teachers-${group.id}`}
            className={cn(
              "overflow-hidden rounded-md border border-line border-l-4 bg-surface",
              styles.accent,
            )}
          >
            <header
              className={cn(
                "flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3",
                styles.header,
              )}
            >
              <div>
                <h3 className="text-base font-semibold text-ink-900">
                  {group.label}
                </h3>
                <p className="mt-0.5 text-xs text-ink-600">{group.hint}</p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                  styles.badge,
                )}
              >
                {group.profiles.length}
              </span>
            </header>

            {isEmpty ? (
              <p className="px-4 py-6 text-sm text-ink-400">
                Aucun professeur dans cette classe.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {group.subclasses.map((subclass) => (
                  <div key={subclass.key}>
                    <div className="flex items-center justify-between gap-2 bg-paper px-4 py-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                        {subclass.label}
                      </h4>
                      <span className="text-xs tabular-nums text-ink-400">
                        {subclass.profiles.length}
                      </span>
                    </div>

                    <ul className="divide-y divide-line lg:hidden">
                      {subclass.profiles.map((profile) => (
                        <UserMobileCard
                          key={profile.id}
                          profile={profile}
                          showCampus={showCampus}
                          isMutating={mutatingProfileId === profile.id}
                          onOpen={() => onOpenProfile(profile.id)}
                          onValidate={() => onValidate(profile.id)}
                          onSuspend={() => onSuspend(profile)}
                          onReactivate={() => onReactivate(profile.id)}
                        />
                      ))}
                    </ul>

                    <div className="hidden overflow-x-auto lg:block">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b bg-paper/60 text-ink-600">
                          <tr>
                            <th className="px-4 py-2 font-medium">
                              Utilisateur
                            </th>
                            <th className="px-4 py-2 font-medium">E-mail</th>
                            {showCampus ? (
                              <th className="px-4 py-2 font-medium">Campus</th>
                            ) : null}
                            <th className="px-4 py-2 font-medium">
                              Inscription
                            </th>
                            <th className="px-4 py-2 font-medium">Parcours</th>
                            <th className="px-4 py-2 font-medium">SIRET</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 font-medium">Alertes</th>
                            <th className="px-4 py-2 font-medium">Stripe</th>
                            <th className="px-4 py-2 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subclass.profiles.map((profile) => (
                            <UserTableRow
                              key={profile.id}
                              profile={profile}
                              showCampus={showCampus}
                              showRole={false}
                              showTeacherCols
                              isMutating={mutatingProfileId === profile.id}
                              onOpen={() => onOpenProfile(profile.id)}
                              onValidate={() => onValidate(profile.id)}
                              onSuspend={() => onSuspend(profile)}
                              onReactivate={() => onReactivate(profile.id)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
