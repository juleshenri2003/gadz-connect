import { Button, cn } from "@gadz-connect/ui";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

export interface AppNavItem {
  to: string;
  label: string;
  end?: boolean;
  disabled?: boolean;
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
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-100 px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Gadz&apos;Connect
          </p>
          <h1 className="mt-1 text-lg font-bold text-slate-900">{title}</h1>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          {userName || userRole ? (
            <p className="mt-2 text-xs text-slate-500">
              {userName}
              {userName && userRole ? <br /> : null}
              {userRole}
            </p>
          ) : null}
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) =>
            item.disabled ? (
              <span
                key={item.to}
                className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-300"
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
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="border-t border-slate-100 p-4">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto md:hidden">
              {nav.map((item) =>
                item.disabled ? (
                  <span
                    key={item.to}
                    className="whitespace-nowrap rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-300"
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
                        "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
            </div>
            <p className="hidden text-sm text-slate-500 md:block">{headerHint}</p>
            <div className="flex items-center gap-2">
              {headerExtra}
            </div>
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
