import { Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import { PLATFORM_CONTACTS, REASSURANCE_POINTS } from "./content";

export function OnboardingReassuranceSection() {
  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-emerald-950">
          Rassurez-vous — et rassurez vos parents
        </CardTitle>
        <p className="text-sm text-emerald-900/80">
          Devenir auto-entrepreneur en étudiant est gratuit, simple et n&apos;efface
          pas vos avantages scolaires lorsque vous restez dans les seuils prévus.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="grid gap-3 sm:grid-cols-2">
          {REASSURANCE_POINTS.map((point) => (
            <li
              key={point.title}
              className="rounded-lg border border-emerald-100 bg-white/80 p-3"
            >
              <p className="font-medium text-emerald-950">{point.title}</p>
              <p className="mt-1 text-sm text-slate-600">{point.body}</p>
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-emerald-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">
            Un doute ? Contactez-nous avant de payer quoi que ce soit
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-6">
            <div>
              <p className="font-medium text-slate-800">
                {PLATFORM_CONTACTS.toscan.name}
              </p>
              <p className="text-slate-500">{PLATFORM_CONTACTS.toscan.role}</p>
              <a
                href={PLATFORM_CONTACTS.toscan.phoneHref}
                className="mt-1 inline-block font-semibold text-indigo-700 hover:underline"
              >
                {PLATFORM_CONTACTS.toscan.phone}
              </a>
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {PLATFORM_CONTACTS.rh.name}
              </p>
              <a
                href={PLATFORM_CONTACTS.rh.emailHref}
                className="mt-1 inline-block font-semibold text-indigo-700 hover:underline"
              >
                {PLATFORM_CONTACTS.rh.email}
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
