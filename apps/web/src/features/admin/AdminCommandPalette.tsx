import { Button, cn } from "@gadz-connect/ui";
import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebarCollapsed } from "@/features/layout/sidebarCollapse";

const ADMIN_COMMANDS = [
  { label: "Tableau de bord", to: "/admin" },
  { label: "Emploi du temps", to: "/admin/planning" },
  { label: "Alertes", to: "/admin/alertes" },
  { label: "Répertoire élèves", to: "/admin/utilisateurs/eleves" },
  { label: "Répertoire professeurs", to: "/admin/utilisateurs/profs" },
  { label: "Tous les utilisateurs", to: "/admin/utilisateurs" },
  { label: "Argent", to: "/admin/budgets" },
  { label: "Facturation", to: "/admin/budgets?tab=facturation" },
  { label: "Clôture & URSSAF", to: "/admin/budgets?tab=cloture" },
  { label: "Cours", to: "/admin/cours" },
] as const;

export function AdminCommandPaletteTrigger() {
  const collapsed = useSidebarCollapsed();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const filtered = ADMIN_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()),
  );

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size={collapsed ? "icon" : "sm"}
        className={cn(
          "hidden text-ink-400 md:flex",
          collapsed ? "size-10 shrink-0" : "gap-2",
        )}
        onClick={() => setOpen(true)}
        aria-label="Rechercher (⌘K)"
      >
        <Search className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
        {!collapsed ? (
          <>
            <span>Rechercher</span>
            <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] font-medium text-ink-400">
              ⌘K
            </kbd>
          </>
        ) : null}
      </Button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ink-900/40"
        aria-hidden
        onClick={close}
      />
      <div
        className="fixed left-1/2 top-[20%] z-50 w-full max-w-md -translate-x-1/2 rounded-lg border border-line bg-surface p-2 shadow-raised"
        role="dialog"
        aria-label="Palette de commandes"
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Aller à…"
            className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            autoFocus
          />
        </div>
        <ul className="max-h-64 overflow-y-auto py-1">
          {filtered.map((cmd) => (
            <li key={cmd.to}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-sm px-3 py-2 text-left text-sm text-ink-900 hover:bg-paper",
                )}
                onClick={() => {
                  navigate(cmd.to);
                  close();
                }}
              >
                {cmd.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-400">Aucun résultat</li>
          ) : null}
        </ul>
      </div>
    </>
  );
}
