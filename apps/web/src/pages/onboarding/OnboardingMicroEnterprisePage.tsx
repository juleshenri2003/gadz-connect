import { Link } from "react-router-dom";
import { OnboardingMicroEnterpriseForm } from "@/features/onboarding/OnboardingMicroEnterpriseForm";

export function OnboardingMicroEnterprisePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
      <header>
        <Link
          to="/"
          className="text-sm text-ink-400 transition hover:text-ink-900"
        >
          ← Retour à l&apos;accueil
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Module 2</h1>
        <p className="mt-2 text-ink-600">
          Création de votre statut micro-entreprise pour proposer des cours sur
          Gadz&apos;Connect.
        </p>
      </header>
      <OnboardingMicroEnterpriseForm />
    </main>
  );
}
