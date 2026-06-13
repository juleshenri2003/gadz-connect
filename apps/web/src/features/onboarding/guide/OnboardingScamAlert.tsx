import { PLATFORM_CONTACTS, SCAM_WARNINGS } from "./content";

export function OnboardingScamAlert() {
  return (
    <div
      role="alert"
      className="rounded-md border-2 border-danger bg-danger-bg p-5 shadow-surface"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger text-lg font-bold text-white"
          aria-hidden
        >
          !
        </span>
        <div className="min-w-0 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-danger">
              Alerte arnaques — tout est gratuit
            </h3>
            <p className="mt-1 text-sm text-danger">
              Vous ne serez <strong>jamais</strong> amené à payer quoi que ce soit
              pour créer ou conserver votre statut. Les cotisations URSSAF ne
              commencent que lorsque vous encaissez de l&apos;argent en donnant des
              cours.
            </p>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-danger">
            {SCAM_WARNINGS.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <p className="text-sm font-semibold text-danger">
            Dans le doute, contactez le responsable au{" "}
            <a
              href={PLATFORM_CONTACTS.responsable.phoneHref}
              className="underline underline-offset-2"
            >
              {PLATFORM_CONTACTS.responsable.phone}
            </a>{" "}
            avant tout paiement.
          </p>
        </div>
      </div>
    </div>
  );
}
