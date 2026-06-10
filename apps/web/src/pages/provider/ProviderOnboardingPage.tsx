import { OnboardingMicroEnterpriseForm } from "@/features/onboarding/OnboardingMicroEnterpriseForm";

export function ProviderOnboardingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Micro-entreprise</h2>
        <p className="mt-1 text-sm text-slate-600">
          Créez ou déclarez votre statut micro-entreprise pour proposer des
          cours sur Gadz&apos;Connect.
        </p>
      </div>
      <div className="max-w-3xl">
        <OnboardingMicroEnterpriseForm />
      </div>
    </div>
  );
}
