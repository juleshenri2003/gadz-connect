import { cn, Label } from "@gadz-connect/ui";
import type { UseFormRegister } from "react-hook-form";
import { formatEuro } from "@/features/admin/format";
import {
  breakdownForProfile,
  FISCAL_PROFILES,
  formatUrssafRatePercent,
  getFiscalProfileDefinition,
} from "@/features/onboarding/fiscalProfile";
import type { OnboardingFormValues } from "@/features/onboarding/schemas";

const DEFAULT_EXAMPLE_AMOUNT = 40;

interface FiscalProfileStepProps {
  register: UseFormRegister<OnboardingFormValues>;
  statusAcre: boolean;
  versementLiberatoire: boolean;
  exampleAmount?: number | null;
}

function BreakdownLines({
  amountGross,
  statusAcre,
  versementLiberatoire,
  emphasizeNet = false,
}: {
  amountGross: number;
  statusAcre: boolean;
  versementLiberatoire: boolean;
  emphasizeNet?: boolean;
}) {
  const breakdown = breakdownForProfile(
    amountGross,
    statusAcre,
    versementLiberatoire,
  );

  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-ink-600">Montant payé par l&apos;élève</dt>
        <dd className="font-medium tabular-nums">{formatEuro(breakdown.amountGross)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-ink-600">Commission Gadz&apos;Connect</dt>
        <dd className="tabular-nums text-ink-600">
          − {formatEuro(breakdown.commissionSasu)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-ink-600">
          URSSAF ({formatUrssafRatePercent(breakdown.urssafRate)})
        </dt>
        <dd className="tabular-nums text-ink-600">
          − {formatEuro(breakdown.taxesUrssaf)}
        </dd>
      </div>
      {breakdown.taxesLiberatoire > 0 ? (
        <div className="flex justify-between gap-3">
          <dt className="text-ink-600">
            Versement libératoire ({formatUrssafRatePercent(breakdown.liberatoireRate)})
          </dt>
          <dd className="tabular-nums text-ink-600">
            − {formatEuro(breakdown.taxesLiberatoire)}
          </dd>
        </div>
      ) : null}
      <div
        className={cn(
          "flex justify-between gap-3 border-t border-line pt-2",
          emphasizeNet && "font-semibold text-ink-900",
        )}
      >
        <dt>Net estimé pour vous</dt>
        <dd className="tabular-nums text-brand-700">
          {formatEuro(breakdown.netPayout)}
        </dd>
      </div>
    </dl>
  );
}

export function FiscalProfileStep({
  register,
  statusAcre,
  versementLiberatoire,
  exampleAmount,
}: FiscalProfileStepProps) {
  const amount = exampleAmount && exampleAmount > 0 ? exampleAmount : DEFAULT_EXAMPLE_AMOUNT;
  const selected = getFiscalProfileDefinition(statusAcre, versementLiberatoire);

  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">Votre profil fiscal</legend>

      <div className="rounded-lg border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-ink-600">
        <p>
          Gadz&apos;Connect distingue <strong>4 profils fiscaux</strong> selon
          votre situation URSSAF. Vos choix déterminent le <strong>net affiché</strong>{" "}
          sur chaque cours — l&apos;élève paie votre tarif, les retenues sont
          calculées automatiquement.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-ink-900">Vos options</p>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-line p-4">
          <div className="space-y-1">
            <Label htmlFor="statusAcre" className="text-sm font-medium">
              Je bénéficie de l&apos;ACRE (1ʳᵉ année)
            </Label>
            <p className="text-xs leading-relaxed text-ink-400">
              Aide à la Création d&apos;Entreprise : cotisations URSSAF réduites
              à 10,6 % au lieu de 21,1 %. Cochez uniquement si l&apos;URSSAF vous
              l&apos;a accordée.
            </p>
          </div>
          <input
            id="statusAcre"
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0"
            {...register("statusAcre")}
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-line p-4">
          <div className="space-y-1">
            <Label htmlFor="versementLiberatoire" className="text-sm font-medium">
              J&apos;ai opté pour le versement libératoire
            </Label>
            <p className="text-xs leading-relaxed text-ink-400">
              Prélèvement supplémentaire de 2,2 % pour payer l&apos;impôt sur le
              revenu en même temps que l&apos;URSSAF. Sinon, l&apos;impôt se règle
              séparément via votre déclaration.
            </p>
          </div>
          <input
            id="versementLiberatoire"
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0"
            {...register("versementLiberatoire")}
          />
        </div>
      </div>

      <div className="rounded-lg border-2 border-brand-600 bg-surface p-4 shadow-surface">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          Votre profil sélectionné
        </p>
        <p className="mt-1 text-base font-semibold text-ink-900">{selected.label}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {selected.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-paper px-2.5 py-1 text-ink-600">
            {selected.urssafHint}
          </span>
          <span className="rounded-full bg-paper px-2.5 py-1 text-ink-600">
            {selected.liberatoireHint}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-paper/60 p-4">
        <p className="text-sm font-medium text-ink-900">
          Simulation sur un cours à {formatEuro(amount)}
        </p>
        <p className="mt-1 text-xs text-ink-400">
          Exemple indicatif pour 1 h au tarif affiché — commission fixe 3 € puis
          cotisations sur le reste.
        </p>
        <div className="mt-3">
          <BreakdownLines
            amountGross={amount}
            statusAcre={statusAcre}
            versementLiberatoire={versementLiberatoire}
            emphasizeNet
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink-900">
          Les 4 profils — comparaison sur {formatEuro(amount)}
        </p>
        <p className="text-xs text-ink-400">
          Un seul profil s&apos;applique à vous ; ce tableau aide à comprendre
          l&apos;impact de chaque option.
        </p>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Profil</th>
                <th className="px-3 py-2.5 font-semibold">ACRE</th>
                <th className="px-3 py-2.5 font-semibold">Libératoire</th>
                <th className="px-3 py-2.5 font-semibold">URSSAF</th>
                <th className="px-3 py-2.5 font-semibold text-right">Net / cours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FISCAL_PROFILES.map((profile) => {
                const breakdown = breakdownForProfile(
                  amount,
                  profile.statusAcre,
                  profile.versementLiberatoire,
                );
                const isSelected = profile.key === selected.key;

                return (
                  <tr
                    key={profile.key}
                    className={cn(
                      isSelected && "bg-brand-50/70 font-medium",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      {profile.shortLabel}
                      {isSelected ? (
                        <span className="ml-2 text-xs font-normal text-brand-700">
                          (vous)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">{profile.statusAcre ? "Oui" : "Non"}</td>
                    <td className="px-3 py-2.5">
                      {profile.versementLiberatoire ? "Oui" : "Non"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {formatUrssafRatePercent(breakdown.urssafRate)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-brand-700">
                      {formatEuro(breakdown.netPayout)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </fieldset>
  );
}
