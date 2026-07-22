import {
  Bell,
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { applyNavBadges } from "@/features/dashboard/navBadgeCounts";
import { useAdminPilotageTasks } from "@/features/dashboard/useAdminPilotageTasks";
import { AppShell } from "@/features/layout/AppShell";
import { AdminCommandPaletteTrigger } from "./AdminCommandPalette";
import { useAdminMe } from "./useAdmin";
import { ROLE_LABELS } from "./format";

const NAV = [
  { to: "/admin", label: "Tableau de bord", shortLabel: "Accueil", end: true, icon: LayoutDashboard },
  { to: "/admin/planning", label: "Emploi du temps", shortLabel: "Planning", icon: Calendar },
  { to: "/admin/alertes", label: "Alertes", shortLabel: "Alertes", icon: Bell },
  { to: "/admin/utilisateurs/eleves", label: "Élèves", shortLabel: "Élèves", icon: GraduationCap },
  { to: "/admin/utilisateurs/profs", label: "Professeurs", shortLabel: "Profs", icon: Users },
  { to: "/admin/budgets", label: "Argent", shortLabel: "Argent", icon: Wallet },
  { to: "/admin/cours", label: "Cours", shortLabel: "Cours", icon: BookOpen },
] as const;

export function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: me } = useAdminMe();
  const { badgeCounts } = useAdminPilotageTasks();

  async function handleLeave() {
    await signOut();
    navigate("/", { replace: true });
  }

  const nav = applyNavBadges(NAV, badgeCounts);

  const userName =
    me?.first_name || me?.last_name
      ? `${me.first_name} ${me.last_name}`.trim()
      : me
        ? "Administrateur"
        : undefined;

  return (
    <AppShell
      title="Pilotage RH"
      subtitle="Administration inter-campus"
      userName={userName}
      userRole={me ? ROLE_LABELS[me.role] : undefined}
      nav={nav}
      spaceVariant="admin"
      footerLabel="Quitter le pilotage"
      onFooterClick={() => void handleLeave()}
      headerExtra={<AdminCommandPaletteTrigger />}
    />
  );
}
