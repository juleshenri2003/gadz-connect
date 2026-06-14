import { Card, cn } from "@gadz-connect/ui";
import { useEffect, useState, type ReactNode } from "react";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { GuideManualConfirm } from "@/features/onboarding/guide/GuideManualConfirm";
import { GuideExternalButton } from "@/features/onboarding/guide/GuideExternalButton";
import {
  CFE_GUIDE,
  INPI_GUIDE_META,
  INPI_STEPS,
  INPI_URL,
  PLATFORM_CONTACTS,
  REASSURANCE_POINTS,
  SCAM_WARNINGS,
} from "@/features/onboarding/guide/content";
import { OnboardingInpiStepGuide } from "@/features/onboarding/guide/OnboardingInpiStepGuide";
import { GuideRichList, GuideRichText } from "@/features/onboarding/guide/GuideRichText";
import { formatFrenchDate } from "./microEnterprisePageUtils";

export const INPI_GUIDE_SECTION_ID = "inpi-guide";

const FIRST_STEP_ID =
  INPI_STEPS.find((step) => step.id === "connect")?.id ?? INPI_STEPS[0]?.id ?? "";

interface MicroEnterpriseInpiGuidePanelProps {
  profile?: MyProfile;
  className?: string;
}

function CollapsibleBlock({
  title,
  summary,
  defaultOpen = false,
  variant = "neutral",
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  variant?: "neutral" | "warning";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-surface",
        variant === "warning" ? "border-danger/20" : "border-line",
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-paper"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink-900">{title}</span>
          {summary && !open ? (
            <span className="mt-0.5 block text-xs text-ink-400">{summary}</span>
          ) : null}
        </span>
        <span
          className={cn(
            "mt-0.5 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open ? (
        <div className="border-t border-line px-4 py-4 text-sm">{children}</div>
      ) : null}
    </div>
  );
}

function InpiGuideProgressHead({ currentIndex }: { currentIndex: number }) {
  const currentStep = INPI_STEPS[currentIndex];

  return (
    <div className="space-y-4">
      <GuideExternalButton
        href={INPI_URL}
        label="Ouvrir procedures.inpi.fr"
        brand="inpi"
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-ink-900">
            Étape {currentIndex + 1} sur {INPI_STEPS.length}
          </span>
          <span className="text-ink-400">{currentStep?.title}</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-surface/80 ring-1 ring-brand-100"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={INPI_STEPS.length}
          aria-label="Progression du guide INPI"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / INPI_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function MicroEnterpriseInpiGuidePanel({
  profile,
  className,
}: MicroEnterpriseInpiGuidePanelProps) {
  const inpiConfirmed = Boolean(profile?.inpi_declaration_sent_at);
  const inpiDate = formatFrenchDate(profile?.inpi_declaration_sent_at);
  const [openStepId, setOpenStepId] = useState<string>(FIRST_STEP_ID);

  const openIndex = INPI_STEPS.findIndex((step) => step.id === openStepId);
  const currentIndex = openIndex >= 0 ? openIndex : 0;

  useEffect(() => {
    if (window.location.hash !== `#${INPI_GUIDE_SECTION_ID}`) return;
    requestAnimationFrame(() => {
      document
        .getElementById(INPI_GUIDE_SECTION_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <Card
      id={INPI_GUIDE_SECTION_ID}
      className={cn(
        "scroll-mt-24 overflow-hidden border-brand-100 shadow-surface",
        className,
      )}
    >
      <div className="border-b border-brand-100 bg-paper px-5 py-5 sm:px-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink-900">
            Guichet Unique INPI
          </h3>
          {inpiConfirmed && inpiDate ? (
            <p className="text-sm text-success">
              Demande confirmée le {inpiDate}
            </p>
          ) : (
            <p className="text-sm text-ink-600">
              Suivez les étapes ci-dessous pour créer votre micro-entreprise.
            </p>
          )}
          <p className="text-xs text-ink-400">{INPI_GUIDE_META.disclaimer}</p>
        </div>
        <div className="mt-4">
          <InpiGuideProgressHead currentIndex={currentIndex} />
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <OnboardingInpiStepGuide
          hideProgressHeader
          openId={openStepId}
          onOpenIdChange={setOpenStepId}
        />

        {!inpiConfirmed ? (
          <div className="rounded-md border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-sm font-semibold text-brand-700">Dossier envoyé ?</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-700/80">
              Cochez pour débloquer la déclaration de SIRET (réception sous 1 à 4
              semaines).
            </p>
            <div className="mt-3">
              <GuideManualConfirm confirmed={inpiConfirmed} />
            </div>
          </div>
        ) : (
          <GuideManualConfirm confirmed={inpiConfirmed} />
        )}
      </div>

      <div className="space-y-3 border-t border-line bg-paper/60 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          Informations complémentaires
        </p>
        <CollapsibleBlock
          title="Alerte arnaques — tout est gratuit"
          summary="Ne payez jamais pour créer votre statut."
          variant="warning"
        >
          <ul className="list-disc space-y-1.5 pl-5 text-danger">
            {SCAM_WARNINGS.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <p className="mt-3 font-semibold text-danger">
            Dans le doute, contactez le responsable au{" "}
            <a
              href={PLATFORM_CONTACTS.responsable.phoneHref}
              className="underline underline-offset-2"
            >
              {PLATFORM_CONTACTS.responsable.phone}
            </a>{" "}
            avant tout paiement.
          </p>
        </CollapsibleBlock>
        <CollapsibleBlock
          title="Rassurez-vous — et rassurez vos parents"
          summary="Gratuit, sans impact sur la bourse dans les seuils prévus."
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {REASSURANCE_POINTS.map((point) => (
              <li
                key={point.title}
                className="rounded-lg border border-success/20 bg-success-bg/40 p-3"
              >
                <p className="font-semibold text-success">{point.title}</p>
                <p className="mt-1 leading-relaxed text-ink-600">{point.body}</p>
              </li>
            ))}
          </ul>
        </CollapsibleBlock>
        <CollapsibleBlock
          title="Après l'immatriculation : le courrier CFE"
          summary="Le seul courrier papier légitime à connaître."
        >
          <div className="space-y-3 leading-relaxed text-ink-600">
            <GuideRichText as="p" text={CFE_GUIDE.intro} />
            <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-950">
              <GuideRichText text={CFE_GUIDE.exempt} />
            </p>
            <GuideRichList items={CFE_GUIDE.fillSteps} ordered />
            <p className="rounded-lg border border-warning/20 bg-warning-bg p-3 text-warning">
              <GuideRichText text={CFE_GUIDE.reminder} />
            </p>
          </div>
        </CollapsibleBlock>
      </div>
    </Card>
  );
}
