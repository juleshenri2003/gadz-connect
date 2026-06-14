import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import { PLATFORM_CONTACTS, REASSURANCE_POINTS } from "./content";

interface OnboardingReassuranceSectionProps {
  defaultCollapsed?: boolean;
}

export function OnboardingReassuranceSection({
  defaultCollapsed = false,
}: OnboardingReassuranceSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <Card className="border-success/20 bg-success-bg/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-success">
              Rassurez-vous — et rassurez vos parents
            </CardTitle>
            <p className="mt-1 text-sm text-success/80">
              Devenir auto-entrepreneur en étudiant est gratuit, simple et
              n&apos;efface pas vos avantages scolaires lorsque vous restez dans
              les seuils prévus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 rounded-lg border border-success/20 bg-surface/80 px-3 py-1.5 text-xs font-medium text-success hover:bg-surface"
            aria-expanded={!collapsed}
          >
            {collapsed ? "Afficher" : "Replier"}
          </button>
        </div>
      </CardHeader>
      {!collapsed ? (
        <CardContent className="space-y-4">
          <ul className="grid gap-3 sm:grid-cols-2">
            {REASSURANCE_POINTS.map((point) => (
              <li
                key={point.title}
                className="rounded-lg border border-success/20 bg-surface/80 p-3"
              >
                <p className="font-medium text-success">{point.title}</p>
                <p className="mt-1 text-sm text-ink-600">{point.body}</p>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-success/20 bg-surface p-4">
            <p className="text-sm font-semibold text-ink-900">
              Un doute ? Contactez-nous avant de payer quoi que ce soit
            </p>
            <div className="mt-3 text-sm">
              <p className="font-medium text-ink-900">
                {PLATFORM_CONTACTS.responsable.name}
              </p>
              <p className="text-ink-400">{PLATFORM_CONTACTS.responsable.role}</p>
              <a
                href={PLATFORM_CONTACTS.responsable.phoneHref}
                className="mt-1 inline-block font-semibold text-brand-700 hover:underline"
              >
                {PLATFORM_CONTACTS.responsable.phone}
              </a>
              <span className="mx-2 text-ink-400">·</span>
              <a
                href={PLATFORM_CONTACTS.responsable.emailHref}
                className="font-semibold text-brand-700 hover:underline"
              >
                {PLATFORM_CONTACTS.responsable.email}
              </a>
            </div>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
