import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";
import type { AdminProfileRow } from "@/features/admin/types";
import { TeachersDirectoryGroups } from "./TeachersDirectoryGroups";
import { UserTableRow } from "./UserTableRow";
import { UserMobileCard } from "./UserMobileCard";
import { UsersTableSkeleton } from "./UsersTableSkeleton";
import { getEmptyStateMessage, type UserFiltersState } from "./userFilters";
import type { MembersDirectory } from "./UsersDirectoryTabs";

interface UsersTableProps {
  profiles: AdminProfileRow[];
  filters: UserFiltersState;
  directory?: MembersDirectory;
  showCampus: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  mutatingProfileId: string | null;
  onOpenProfile: (profileId: string) => void;
  onValidate: (profileId: string) => void;
  onSuspend: (profile: AdminProfileRow) => void;
  onReactivate: (profileId: string) => void;
}

export function UsersTable({
  profiles,
  filters,
  directory = "all",
  showCampus,
  isLoading,
  isError,
  errorMessage,
  mutatingProfileId,
  onOpenProfile,
  onValidate,
  onSuspend,
  onReactivate,
}: UsersTableProps) {
  const showRole = directory === "all";
  const showTeacherCols = directory !== "students";
  const listTitle =
    directory === "students"
      ? "Liste des élèves"
      : directory === "teachers"
        ? "Répertoire professeurs"
        : "Liste des utilisateurs";

  if (directory === "teachers") {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="p-0">
            <UsersTableSkeleton />
          </CardContent>
        </Card>
      );
    }
    if (isError) {
      return <p className="text-sm text-danger">{errorMessage}</p>;
    }
    if (profiles.length === 0) {
      return (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-ink-400">
              {getEmptyStateMessage(filters)}
            </p>
          </CardContent>
        </Card>
      );
    }
    return (
      <TeachersDirectoryGroups
        profiles={profiles}
        showCampus={showCampus}
        mutatingProfileId={mutatingProfileId}
        onOpenProfile={onOpenProfile}
        onValidate={onValidate}
        onSuspend={onSuspend}
        onReactivate={onReactivate}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{listTitle}</CardTitle>
        <CardDescription className="hidden lg:block">
          Cliquez sur une ligne pour ouvrir la fiche détail
        </CardDescription>
        <CardDescription className="lg:hidden">
          Touchez une carte pour ouvrir la fiche détail
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <UsersTableSkeleton />
        ) : isError ? (
          <p className="p-4 text-sm text-danger">{errorMessage}</p>
        ) : profiles.length > 0 ? (
          <>
            <ul className="divide-y divide-line lg:hidden">
              {profiles.map((profile) => (
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
                <thead className="border-b bg-paper text-ink-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Utilisateur</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    {showCampus ? (
                      <th className="px-4 py-3 font-medium">Campus</th>
                    ) : null}
                    {showRole ? (
                      <th className="px-4 py-3 font-medium">Rôle</th>
                    ) : null}
                    <th className="px-4 py-3 font-medium">Inscription</th>
                    {showTeacherCols ? (
                      <>
                        <th className="px-4 py-3 font-medium">Parcours</th>
                        <th className="px-4 py-3 font-medium">SIRET</th>
                      </>
                    ) : null}
                    <th className="px-4 py-3 font-medium">Statut</th>
                    {showTeacherCols ? (
                      <>
                        <th className="px-4 py-3 font-medium">Alertes</th>
                        <th className="px-4 py-3 font-medium">Stripe</th>
                      </>
                    ) : null}
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <UserTableRow
                      key={profile.id}
                      profile={profile}
                      showCampus={showCampus}
                      showRole={showRole}
                      showTeacherCols={showTeacherCols}
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
          </>
        ) : (
          <p className="p-4 text-sm text-ink-400">
            {getEmptyStateMessage(filters)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
