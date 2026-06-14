import {
  Bell,
  BookOpen,
  Calendar,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { AppShell } from "@/features/layout/AppShell";
import { AdminCommandPaletteTrigger } from "./AdminCommandPalette";
import { useAdminMe } from "./useAdmin";
import { ROLE_LABELS } from "./format";

const NAV = [
  { to: "/admin", label: "Tableau de bord", end: true, icon: LayoutDashboard },
  { to: "/admin/planning", label: "Emploi du temps", icon: Calendar },
  { to: "/admin/alertes", label: "Alertes campus", icon: Bell },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/admin/budgets", label: "Budgets", icon: Wallet },
  { to: "/admin/cours", label: "Cours", icon: BookOpen },
] as const;

export function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: me } = useAdminMe();

  async function handleLeave() {
    await signOut();
    navigate("/", { replace: true });
  }

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
      nav={NAV}
      spaceVariant="admin"
      footerLabel="Quitter le pilotage"
      onFooterClick={() => void handleLeave()}
      headerExtra={<AdminCommandPaletteTrigger />}
    />
  );
}
