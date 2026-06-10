import { Button } from "@gadz-connect/ui";
import {
  ACTIVITY_PATH_COPY,
  ID_CONFORMITY_MENTION,
  INPI_STEPS,
  INPI_URL,
} from "./content";
import { CopyablePath, CopyableText } from "./CopyableText";
import { GuideAccordion } from "./GuideAccordion";

function StepDetailList({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {lines.map((line) => (
        <li key={line}>
          {line.split(/\*\*(.*?)\*\*/g).map((part, i) =>
            i % 2 === 1 ? (
              <strong key={`${line}-${i}`}>{part}</strong>
            ) : (
              <span key={`${line}-${i}`}>{part}</span>
            ),
          )}
        </li>
      ))}
    </ul>
  );
}

export function OnboardingInpiStepGuide() {
  const items = INPI_STEPS.map((step) => ({
    id: step.id,
    title: step.title,
    summary: step.summary,
    badge: "critical" in step && step.critical ? "Obligatoire" : undefined,
    defaultOpen: step.id === "access",
    children: (
      <div className="space-y-4">
        <StepDetailList lines={step.details} />

        {"alert" in step && step.alert ? (
          <div
            className={`rounded-lg border p-3 text-sm ${
              "critical" in step && step.critical
                ? "border-red-300 bg-red-50 font-medium text-red-950"
                : "border-amber-300 bg-amber-50 text-amber-950"
            }`}
            role="note"
          >
            {step.alert}
          </div>
        ) : null}

        {"tip" in step && step.tip ? (
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
            💡 {step.tip}
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
      </div>
    ),
  }));

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Guide INPI pas à pas
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Suivez chaque étape sur le Guichet Unique. Cliquez pour déplier le
          détail — rien n&apos;est laissé au hasard.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" asChild>
          <a href={INPI_URL} target="_blank" rel="noopener noreferrer">
            Ouvrir le Guichet Unique INPI →
          </a>
        </Button>
      </div>

      <GuideAccordion items={items} />
    </section>
  );
}
