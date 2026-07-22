import { cn } from "@gadz-connect/ui";
import { Link } from "react-router-dom";

export type MembersDirectory = "all" | "students" | "teachers";

const TABS: Array<{
  id: MembersDirectory;
  label: string;
  to: string;
  description: string;
}> = [
  {
    id: "all",
    label: "Tous les membres",
    to: "/admin/utilisateurs",
    description: "Élèves, professeurs et admins",
  },
  {
    id: "students",
    label: "Répertoire élèves",
    to: "/admin/utilisateurs/eleves",
    description: "Comptes élèves du campus",
  },
  {
    id: "teachers",
    label: "Répertoire professeurs",
    to: "/admin/utilisateurs/profs",
    description: "Enseignants et micro-entreprises",
  },
];

interface UsersDirectoryTabsProps {
  active: MembersDirectory;
}

export function UsersDirectoryTabs({ active }: UsersDirectoryTabsProps) {
  return (
    <nav
      className="flex flex-wrap gap-1 rounded-lg border border-line bg-paper p-1"
      aria-label="Répertoires membres"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          to={tab.to}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition",
            active === tab.id
              ? "bg-surface text-ink-900 shadow-surface"
              : "text-ink-600 hover:text-ink-900",
          )}
          aria-current={active === tab.id ? "page" : undefined}
          title={tab.description}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function directoryPageCopy(directory: MembersDirectory): {
  title: string;
  subtitle: string;
} {
  switch (directory) {
    case "students":
      return {
        title: "Répertoire élèves",
        subtitle: "Recherche par nom et prénom",
      };
    case "teachers":
      return {
        title: "Répertoire professeurs",
        subtitle:
          "Filtres : complets, sans SIRET, sans Stripe, suspendus — sous-classes par parcours",
      };
    default:
      return {
        title: "Utilisateurs",
        subtitle:
          "Supervision des comptes — dossiers SIRET, doublons, suspensions",
      };
  }
}

export function directoryForcedRole(
  directory: MembersDirectory,
): "student_provider" | "teacher" | null {
  if (directory === "students") return "student_provider";
  if (directory === "teachers") return "teacher";
  return null;
}
