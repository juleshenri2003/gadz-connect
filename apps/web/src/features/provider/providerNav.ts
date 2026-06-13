import {
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  User,
} from "lucide-react";
import type { AppNavItem } from "@/features/layout/AppShell";

export function buildStudentNav(progressLabel?: string): AppNavItem[] {
  const overviewLabel = progressLabel
    ? `Tableau de bord (${progressLabel})`
    : "Tableau de bord";

  return [
    { to: "/app", label: overviewLabel, end: true, icon: LayoutDashboard },
    { to: "/app/planning", label: "Emploi du temps", icon: Calendar },
    { to: "/app/alertes", label: "Alertes campus", icon: Bell },
    { to: "/app/repertoire", label: "Mon répertoire", icon: FolderOpen },
    { to: "/app/cours", label: "Trouver mon tuteur", icon: BookOpen },
    { to: "/app/profil", label: "Mon profil", icon: User },
  ];
}

export function buildTutorNav(progressLabel?: string): AppNavItem[] {
  const overviewLabel = progressLabel
    ? `Tableau de bord (${progressLabel})`
    : "Tableau de bord";

  return [
    { to: "/app", label: overviewLabel, end: true, icon: LayoutDashboard },
    { to: "/app/planning", label: "Emploi du temps", icon: Calendar },
    { to: "/app/alertes", label: "Alertes campus", icon: Bell },
    { to: "/app/cours", label: "Mes cours", icon: BookOpen },
    {
      to: "/app/micro-entreprise",
      label: "Micro-entreprise",
      icon: Building2,
    },
    { to: "/app/paiements", label: "Paiements", icon: CreditCard },
    { to: "/app/profil", label: "Mon profil", icon: User },
  ];
}
