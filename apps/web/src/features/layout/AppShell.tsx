import { Avatar, AvatarFallback, Button, cn } from "@gadz-connect/ui";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

export type AppSpaceVariant = "student" | "teacher" | "admin";

export interface AppNavItem {
  to: string;
  label: string;
  end?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
}

export interface AppShellProps {
  title: string;
  subtitle: string;
  userName?: string;
  userRole?: string;
  nav: readonly AppNavItem[];
  headerHint: string;
  footerLabel: string;
  footerTo?: string;
  onFooterClick?: () => void;
  headerExtra?: ReactNode;
  spaceVariant?: AppSpaceVariant;
  pageTitle?: string;
}

const SPACE_STYLES: Record<
  AppSpaceVariant,
  { stripe: string; badge: string; badgeText: string }
> = {
  student: {
    stripe: "bg-brand-600",
    badge: "bg-brand-50",
    badgeText: "text-brand-700",
  },
  teacher: {
    stripe: "bg-accent-600",
    badge: "bg-accent-50",
    badgeText: "text-accent-600",
  },
  admin: {
    stripe: "bg-brand-700",
    badge: "bg-brand-50",
    badgeText: "text-brand-700",
  },
};

const SPACE_LABELS: Record<AppSpaceVariant, string> = {
  student: "Élève",
  teacher: "Enseignant",
  admin: "Administration",
};

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return `${a}${b}`.toUpperCase() || "?";
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function AppShell({
  title,
  subtitle,
  userName,
  userRole,
  nav,
  headerHint,
  footerLabel,
  footerTo = "/",
  onFooterClick,
  headerExtra,
  spaceVariant,
  pageTitle,
}: AppShellProps) {
  const space = spaceVariant ? SPACE_STYLES[spaceVariant] : null;

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex-col border-r border-line bg-surface md:flex">
        {space ? (
          <div className={cn("h-0.5 w-full shrink-0", space.stripe)} />
        ) : null}

        <div className="shrink-0 border-b border-line px-5 py-5">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-700 font-display text-sm font-bold text-white"
              aria-hidden
            >
              G
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Gadz&apos;Connect
              </p>
              {space ? (
                <span
                  className={cn(
                    "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    space.badge,
                    space.badgeText,
                  )}
                >
                  {SPACE_LABELS[spaceVariant!]}
                </span>
              ) : null}
            </div>
          </div>
          <h1 className="mt-3 font-display text-lg font-semibold text-ink-900">
            {title}
          </h1>
          <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <span
                  key={item.to}
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-ink-400/50"
                  aria-disabled
                >
                  {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  {item.label}
                </span>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-paper hover:text-ink-900",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-600"
                        aria-hidden
                      />
                    ) : null}
                    {Icon ? (
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-brand-700" : "text-ink-400",
                        )}
                      />
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-line p-4">
          {userName || userRole ? (
            <div className="mb-3 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {initials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                {userName ? (
                  <p className="truncate text-sm font-medium text-ink-900">
                    {userName}
                  </p>
                ) : null}
                {userRole ? (
                  <p className="truncate text-xs text-ink-400">{userRole}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          {onFooterClick ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onFooterClick}
            >
              {footerLabel}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to={footerTo}>{footerLabel}</Link>
            </Button>
          )}
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col md:pl-64">
        <header className="border-b border-line bg-surface px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto md:hidden">
              {nav.map((item) =>
                item.disabled ? (
                  <span
                    key={item.to}
                    className="whitespace-nowrap rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-400/50"
                    aria-disabled
                  >
                    {item.label}
                  </span>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-brand-600 text-white"
                          : "bg-paper text-ink-600",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
            </div>

            <div className="hidden min-w-0 md:block">
              {pageTitle ? (
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  {pageTitle}
                </h2>
              ) : null}
              <p className="text-sm text-ink-400">{headerHint}</p>
            </div>

            <div className="flex items-center gap-2">{headerExtra}</div>

            {onFooterClick ? (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={onFooterClick}
              >
                {footerLabel}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="md:hidden" asChild>
                <Link to={footerTo}>{footerLabel}</Link>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
