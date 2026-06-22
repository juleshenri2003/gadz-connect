import { Button } from "@gadz-connect/ui";
import { useState } from "react";
import {
  ACTIVITY_PATH_COPY,
  ID_CONFORMITY_MENTION,
  INPI_STEPS,
} from "./content";
import { CopyablePath, CopyableText } from "./CopyableText";
import { GuideAccordion } from "./GuideAccordion";
import { GuideRichList, GuideRichText } from "./GuideRichText";

interface OnboardingInpiStepGuideProps {
  /** Masque la barre de progression (affichée par le parent) */
  hideProgressHeader?: boolean;
  openId?: string;
  onOpenIdChange?: (id: string) => void;
  /** Contenu additionnel sous certaines étapes (ex. formulaire adresse à l'étape identité). */
  renderAfterStep?: (stepId: string) => React.ReactNode;
}

export function OnboardingInpiStepGuide({
  hideProgressHeader = false,
  openId: controlledOpenId,
  onOpenIdChange,
  renderAfterStep,
}: OnboardingInpiStepGuideProps = {}) {
  const firstStepId =
    INPI_STEPS.find((step) => step.id === "connect")?.id ?? INPI_STEPS[0]?.id ?? "";
  const [internalOpenId, setInternalOpenId] = useState<string>(firstStepId);
  const openId = controlledOpenId ?? internalOpenId;

  function setOpenId(id: string) {
    if (onOpenIdChange) onOpenIdChange(id);
    else setInternalOpenId(id);
  }

  const openIndex = INPI_STEPS.findIndex((step) => step.id === openId);
  const currentIndex = openIndex >= 0 ? openIndex : 0;
  const currentStep = INPI_STEPS[currentIndex];

  function goToStep(index: number) {
    const step = INPI_STEPS[index];
    if (!step) return;
    setOpenId(step.id);
    requestAnimationFrame(() => {
      document
        .getElementById(`inpi-step-${step.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const items = INPI_STEPS.map((step, index) => ({
    id: step.id,
    title: step.title,
    summary: step.summary,
    badge: "critical" in step && step.critical ? "Obligatoire" : undefined,
    defaultOpen: step.id === firstStepId,
    children: (
      <div className="space-y-4">
        <GuideRichList items={step.details} />

        {"alert" in step && step.alert ? (
          <div
            className={`rounded-lg border p-3 text-sm leading-relaxed ${
              "critical" in step && step.critical
                ? "border-danger/30 bg-danger-bg text-danger"
                : "border-warning/30 bg-warning-bg text-warning"
            }`}
            role="note"
          >
            <GuideRichText text={step.alert} />
          </div>
        ) : null}

        {"tip" in step && step.tip ? (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm leading-relaxed text-brand-700">
            <GuideRichText text={step.tip} />
          </p>
        ) : null}

        {"copyLabels" in step && step.copyLabels ? (
          <CopyablePath labels={step.copyLabels} fullText={ACTIVITY_PATH_COPY} />
        ) : null}

        {"copyText" in step && step.copyText && !("copyLabels" in step) ? (
          <CopyableText text={step.copyText} label={ID_CONFORMITY_MENTION} />
        ) : null}

        {"link" in step && step.link ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={step.link} target="_blank" rel="noopener noreferrer">
              {step.linkLabel ?? "Ouvrir le lien officiel"} →
            </a>
          </Button>
        ) : null}

        {renderAfterStep?.(step.id)}

        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={index === 0}
            onClick={() => goToStep(index - 1)}
          >
            Étape précédente
          </Button>
          {index < INPI_STEPS.length - 1 ? (
            <Button type="button" size="sm" onClick={() => goToStep(index + 1)}>
              Étape suivante
            </Button>
          ) : null}
        </div>
      </div>
    ),
  }));

  return (
    <section className="space-y-4" aria-label="Étapes du guide INPI">
      {!hideProgressHeader ? (
        <>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-line"
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

          <p className="text-sm text-ink-600">
            <span className="font-semibold text-ink-900">
              {currentIndex + 1}/{INPI_STEPS.length}
            </span>
            {" — "}
            {currentStep?.title}
          </p>
        </>
      ) : null}

      <GuideAccordion
        items={items}
        openId={openId}
        onOpenIdChange={setOpenId}
        anchorPrefix="inpi-step"
      />
    </section>
  );
}
