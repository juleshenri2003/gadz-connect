import { Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import { CFE_GUIDE } from "./content";
import { GuideRichList, GuideRichText } from "./GuideRichText";

export function OnboardingCfeSection() {
  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle className="text-base">{CFE_GUIDE.title}</CardTitle>
        <GuideRichText as="p" className="text-sm text-ink-600" text={CFE_GUIDE.intro} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
          <GuideRichText text={CFE_GUIDE.exempt} />
        </div>

        <div>
          <p className="text-sm font-medium text-ink-900">
            Comment remplir le formulaire 1447-C-K
          </p>
          <GuideRichList
            items={CFE_GUIDE.fillSteps}
            ordered
            className="mt-2 text-sm"
          />
        </div>

        <p className="rounded-lg border border-warning/20 bg-warning-bg p-3 text-sm text-warning">
          <GuideRichText text={CFE_GUIDE.reminder} />
        </p>
      </CardContent>
    </Card>
  );
}
