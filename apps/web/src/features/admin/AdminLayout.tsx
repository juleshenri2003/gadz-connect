import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { AppShell } from "@/features/layout/AppShell";
import { useAdminMe } from "./useAdmin";
import { ROLE_LABELS } from "./format";

const NAV = [
  { to: "/admin", label: "Vue d'ensemble", end: true },
  { to: "/admin/planning", label: "Emploi du temps", end: false },
  { to: "/admin/membres", label: "Membres", end: false },
  { to: "/admin/budgets", label: "Budgets", end: false },
  { to: "/admin/cours", label: "Cours", end: false },
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
      headerHint="Console d'administration — données Supabase en temps réel"
      footerLabel="Quitter le pilotage"
      onFooterClick={() => void handleLeave()}
    />
  );
}
