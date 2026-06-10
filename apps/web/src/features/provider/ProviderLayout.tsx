import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { ROLE_LABELS } from "@/features/admin/format";
import { AppShell, type AppNavItem } from "@/features/layout/AppShell";

function buildStudentNav(): AppNavItem[] {
  return [
    { to: "/app", label: "Vue d'ensemble", end: true },
    { to: "/app/planning", label: "Emploi du temps" },
    { to: "/app/cours", label: "Tutorat" },
    { to: "/app/profil", label: "Mon profil" },
  ];
}

function buildTutorNav(): AppNavItem[] {
  return [
    { to: "/app", label: "Vue d'ensemble", end: true },
    { to: "/app/planning", label: "Emploi du temps" },
    { to: "/app/cours", label: "Mes cours" },
    { to: "/app/micro-entreprise", label: "Micro-entreprise" },
    { to: "/app/paiements", label: "Paiements" },
    { to: "/app/profil", label: "Mon profil" },
  ];
}

export function ProviderLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useMyProfile();

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  const role = profile?.role;
  const student = role ? isStudent(role) : true;
  const nav = student ? buildStudentNav() : buildTutorNav();

  const userName =
    profile?.first_name || profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : undefined;

  return (
    <AppShell
      title={student ? "Espace élèves" : "Espace prestataire"}
      subtitle={
        student
          ? "Arts et Métiers — tutorat"
          : "Professeur / intervenant"
      }
      userName={userName}
      userRole={role ? ROLE_LABELS[role] : undefined}
      nav={nav}
      headerHint={
        student
          ? "Réservez des cours de tutorat sur votre campus"
          : "Votre espace professionnel — données en temps réel"
      }
      footerLabel="Déconnexion"
      onFooterClick={() => void handleSignOut()}
    />
  );
}
