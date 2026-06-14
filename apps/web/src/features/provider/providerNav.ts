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
  return [
    {
      to: "/app",
      label: "Tableau de bord",
      shortLabel: "Accueil",
      badge: progressLabel,
      end: true,
      icon: LayoutDashboard,
    },
    { to: "/app/planning", label: "Emploi du temps", shortLabel: "Planning", icon: Calendar },
    { to: "/app/alertes", label: "Alertes", shortLabel: "Alertes", icon: Bell },
    { to: "/app/repertoire", label: "Mon répertoire", shortLabel: "Répertoire", icon: FolderOpen },
    { to: "/app/cours", label: "Trouver mon tuteur", shortLabel: "Tuteurs", icon: BookOpen },
    { to: "/app/profil", label: "Mon profil", shortLabel: "Profil", icon: User },
  ];
}

export function buildTutorNav(progressLabel?: string): AppNavItem[] {
  return [
    {
      to: "/app",
      label: "Tableau de bord",
      shortLabel: "Accueil",
      badge: progressLabel,
      end: true,
      icon: LayoutDashboard,
    },
    { to: "/app/planning", label: "Emploi du temps", shortLabel: "Planning", icon: Calendar },
    { to: "/app/alertes", label: "Alertes", shortLabel: "Alertes", icon: Bell },
    { to: "/app/cours", label: "Mes cours", shortLabel: "Cours", icon: BookOpen },
    {
      to: "/app/micro-entreprise",
      label: "Micro-entreprise",
      shortLabel: "Micro-ME",
      icon: Building2,
    },
    { to: "/app/paiements", label: "Paiements", shortLabel: "Paiements", icon: CreditCard },
    { to: "/app/profil", label: "Mon profil", shortLabel: "Profil", icon: User },
  ];
}
