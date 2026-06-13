import { OnboardingCfeSection } from "./guide/OnboardingCfeSection";
import { OnboardingInpiStepGuide } from "./guide/OnboardingInpiStepGuide";
import { OnboardingReassuranceSection } from "./guide/OnboardingReassuranceSection";
import { OnboardingScamAlert } from "./guide/OnboardingScamAlert";

interface OnboardingAccompanimentGuideProps {
  /** Affiche le guide INPI complet et la section CFE */
  showInpiGuide?: boolean;
  /** Replie la section réassurance par défaut (ex. INPI déjà confirmé) */
  reassuranceCollapsed?: boolean;
}

export function OnboardingAccompanimentGuide({
  showInpiGuide = true,
  reassuranceCollapsed = false,
}: OnboardingAccompanimentGuideProps) {
  return (
    <div className="space-y-6">
      <OnboardingReassuranceSection defaultCollapsed={reassuranceCollapsed} />
      <OnboardingScamAlert />
      {showInpiGuide ? (
        <>
          <OnboardingInpiStepGuide />
          <OnboardingCfeSection />
        </>
      ) : null}
    </div>
  );
}
