import type { AdminMe } from "@/features/admin/types";
import { formatTodayDate } from "./adminCockpitUtils";

interface AdminCockpitHeaderProps {
  me: AdminMe | undefined;
  scope: "campus" | "global";
}

export function AdminCockpitHeader({ me, scope }: AdminCockpitHeaderProps) {
  const firstName = me?.first_name?.trim();
  const title = firstName ? `Bonjour ${firstName}` : "Tableau de bord";
  const scopeLabel =
    scope === "global"
      ? "Tous les campus Arts et Métiers"
      : "Périmètre limité à votre campus";

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-600">
        Cockpit de pilotage — {scopeLabel}
        {" · "}
        <span className="capitalize">{formatTodayDate()}</span>
      </p>
    </div>
  );
}
