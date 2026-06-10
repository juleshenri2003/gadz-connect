import { Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import { CFE_GUIDE } from "./content";

export function OnboardingCfeSection() {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">{CFE_GUIDE.title}</CardTitle>
        <p className="text-sm text-slate-600">{CFE_GUIDE.intro}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
          {CFE_GUIDE.exempt}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-900">
            Comment remplir le formulaire 1447-C-K
          </p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {CFE_GUIDE.fillSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          ⚠️ {CFE_GUIDE.reminder}
        </p>
      </CardContent>
    </Card>
  );
}
