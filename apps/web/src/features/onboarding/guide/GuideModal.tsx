import { Modal } from "@/components/Modal";
import { Button, cn } from "@gadz-connect/ui";
import type { RegistrationPath } from "@gadz-connect/types";
import { Link } from "react-router-dom";
import { useMyProfile } from "@/features/auth/useMyProfile";
import type { DashboardTask } from "@/features/dashboard/dashboardTypes";
import {
  getGuideDescription,
  getGuideStepContent,
  getGuideTitle,
} from "./guideContent";
import { GuideDestinationHint } from "./GuideDestinationHint";
import { GuideExternalButton } from "./GuideExternalButton";
import { FiscalQuestionnaireRecap } from "@/features/onboarding/FiscalQuestionnaireRecap";
import {
  hasValidSiret,
  isQuestionnaireEditable,
} from "@/features/onboarding/fiscalLabels";
import { SiretSubmissionForm } from "@/features/onboarding/SiretSubmissionForm";
import { GuideManualConfirm } from "./GuideManualConfirm";
import { GuidePartnerStrip } from "./GuidePartnerStrip";
import { useOnboardingGuide } from "./OnboardingGuideContext";

function isTeacherStepBlocked(
  taskId: string,
  accountStatus: string | undefined,
): boolean {
  if (accountStatus === "active") return false;
  return taskId === "stripe" || taskId === "publish_slots";
}

function MiniCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusPill({
  isDone,
  isWaiting,
  isBlocked,
}: {
  isDone: boolean;
  isWaiting: boolean;
  isBlocked: boolean;
}) {
  const label = isDone
    ? "Terminée"
    : isWaiting
      ? "En attente"
      : isBlocked
        ? "Bientôt disponible"
        : "À faire";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        isDone
          ? "bg-success-bg text-success"
          : isWaiting
            ? "bg-warning-bg text-warning"
            : isBlocked
              ? "bg-paper text-ink-600"
              : "bg-brand-100 text-brand-700",
      )}
    >
      {label}
    </span>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepIndicator({
  task,
  index,
  isSelected,
  isCurrent,
  onSelect,
}: {
  task: DashboardTask;
  index: number;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const isDone = task.status === "done";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "border-brand-100 bg-brand-50"
          : "border-transparent hover:border-line hover:bg-paper",
      )}
      aria-current={isSelected ? "step" : undefined}
    >
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isDone
            ? "bg-success-bg text-success"
            : isCurrent
              ? "bg-brand-600 text-white"
              : "bg-paper text-ink-400",
        )}
        aria-hidden
      >
        {isDone ? "✓" : index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm font-medium",
            isDone ? "text-success" : "text-ink-900",
          )}
        >
          {task.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-400">
          {task.description}
        </span>
      </span>
    </button>
  );
}

function StepDetail({
  task,
  isStudentRole,
  registrationPath,
  onClose,
}: {
  task: DashboardTask;
  isStudentRole: boolean;
  registrationPath?: RegistrationPath;
  onClose: () => void;
}) {
  const { data: profile } = useMyProfile();
  const content = getGuideStepContent(task, isStudentRole, registrationPath);
  const isDone = task.status === "done";
  const isWaiting = Boolean(task.readOnly);
  const isBlocked =
    !isStudentRole &&
    !isDone &&
    isTeacherStepBlocked(task.id, profile?.account_status);

  const isInpiManual = task.manualAction === "inpi_sent";
  const isQuestionnaireStep = task.id === "questionnaire";
  const isSiretStep = task.id === "siret";
  const hasSiret = hasValidSiret(profile?.siret);
  const questionnaireDone = Boolean(profile?.micro_enterprise_activity);
  const questionnaireEditable = Boolean(
    profile && isQuestionnaireEditable(profile),
  );
  const showQuestionnaireRecap =
    isQuestionnaireStep && isDone && questionnaireDone && Boolean(profile);
  const inpiConfirmed = Boolean(profile?.inpi_declaration_sent_at);
  const isPendingSiret = profile?.account_status === "pending_siret";
  // L'auto-déclaration n'a de sens que tant que le SIRET réel n'est pas saisi.
  const showInpiConfirm = isInpiManual && !hasSiret;
  const showSiretForm =
    isSiretStep && !isDone && !isWaiting && !isBlocked && isPendingSiret;

  const showCta =
    Boolean(task.href) &&
    !isWaiting &&
    !isDone &&
    !isBlocked &&
    !(isInpiManual && showInpiConfirm) &&
    !showSiretForm &&
    !(isSiretStep && !isDone && !isWaiting && !isBlocked);
  const showRevisit =
    isDone &&
    !isWaiting &&
    !showInpiConfirm &&
    Boolean(task.href) &&
    !isQuestionnaireStep;
  const showDoneAuto = isDone && !showInpiConfirm && !showQuestionnaireRecap;
  const showExternalInActions =
    Boolean(content.externalUrl) && !(isInpiManual && showInpiConfirm);

  return (
    <div className="rounded-md border border-line bg-surface p-4 shadow-surface sm:p-5">
      <div className="space-y-4">
        <div>
          <StatusPill isDone={isDone} isWaiting={isWaiting} isBlocked={isBlocked} />
          <h3 className="mt-2 text-xl font-bold text-ink-900">{task.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {content.why}
          </p>
          {content.estimatedDuration ? (
            <p className="mt-1 text-xs text-ink-400">
              Durée estimée : {content.estimatedDuration}
            </p>
          ) : null}
          {content.prerequisites?.length ? (
            <ul className="mt-2 list-inside list-disc text-xs text-ink-400">
              {content.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
        </div>

        {content.partners?.length && !(isInpiManual && showInpiConfirm) ? (
          <GuidePartnerStrip partners={content.partners} />
        ) : null}

        {content.destination &&
        !isDone &&
        !(isInpiManual && showInpiConfirm) &&
        !showSiretForm ? (
          <GuideDestinationHint
            icon={content.destination.icon}
            label={content.destination.label}
          />
        ) : null}

        {content.waitingMessage ? (
          <div
            className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
            role="status"
          >
            {content.waitingMessage}
          </div>
        ) : null}

        {isBlocked && content.blockedMessage ? (
          <div
            className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
            role="status"
          >
            {content.blockedMessage}
          </div>
        ) : null}

        {showInpiConfirm ? (
          questionnaireDone ? (
            <div className="space-y-3">
              {content.externalUrl ? (
                <GuideExternalButton
                  href={content.externalUrl}
                  label={content.externalLabel ?? "Ouvrir le Guichet Unique INPI"}
                  brand={content.externalBrand}
                />
              ) : null}
              <GuideManualConfirm confirmed={inpiConfirmed} />
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink-600">
              Complétez d&apos;abord le questionnaire fiscal pour pouvoir valider
              cette étape.
            </div>
          )
        ) : null}

        {isSiretStep && !isDone && !isWaiting && !isBlocked ? (
          showSiretForm ? (
            <SiretSubmissionForm
              existingSiret={profile?.siret}
              accountStatus={profile?.account_status}
              siretVerificationFailed={profile?.siret_verification_failed}
              hideHeader
            />
          ) : !isPendingSiret ? (
            <div className="rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink-600">
              Complétez d&apos;abord le questionnaire fiscal pour pouvoir déclarer
              votre SIRET.
            </div>
          ) : null
        ) : null}

        {showQuestionnaireRecap && profile ? (
          <div className="space-y-3">
            <div
              className="flex items-center gap-2 rounded-lg border border-success/20 bg-success-bg px-4 py-3 text-sm text-success"
              role="status"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
                <MiniCheck className="h-3.5 w-3.5" />
              </span>
              <span>Réponses enregistrées.</span>
            </div>
            <FiscalQuestionnaireRecap profile={profile} compact />
            {questionnaireEditable ? (
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/app/micro-entreprise?step=questionnaire&edit=1"
                  onClick={onClose}
                >
                  Modifier mes réponses
                </Link>
              </Button>
            ) : hasSiret ? (
              <p className="text-xs leading-relaxed text-ink-400">
                SIRET déjà transmis — contactez l&apos;équipe RH pour toute
                correction.
              </p>
            ) : null}
          </div>
        ) : null}

        {showDoneAuto ? (
          <div
            className="flex items-center gap-2 rounded-lg border border-success/20 bg-success-bg px-4 py-3 text-sm text-success"
            role="status"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <MiniCheck className="h-3.5 w-3.5" />
            </span>
            <span>Étape validée automatiquement d&apos;après vos informations.</span>
          </div>
        ) : null}

        {showCta ||
        (isBlocked && content.blockedHref) ||
        showExternalInActions ||
        showRevisit ? (
          <div className="flex flex-wrap gap-3 pt-1">
            {showCta && task.href ? (
              <Button asChild>
                <Link to={task.href} onClick={onClose}>
                  {content.ctaLabel ?? "Continuer"}
                </Link>
              </Button>
            ) : null}

            {isBlocked && content.blockedHref ? (
              <Button variant="outline" asChild>
                <Link to={content.blockedHref} onClick={onClose}>
                  {content.blockedHrefLabel ?? "Voir la page"}
                </Link>
              </Button>
            ) : null}

            {showExternalInActions && content.externalUrl ? (
              <GuideExternalButton
                href={content.externalUrl}
                label={content.externalLabel ?? "Ouvrir le lien externe"}
                brand={content.externalBrand}
              />
            ) : null}

            {showRevisit && task.href ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to={task.href} onClick={onClose}>
                  Revoir la page
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        {task.id === "find_tutor" && !isDone && isStudentRole ? (
          <p className="text-xs leading-relaxed text-ink-400">
            Sur la page Tuteurs, cliquez sur un professeur puis sélectionnez un
            créneau libre pour confirmer la réservation.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function GuideModal() {
  const {
    open,
    closeGuide,
    progress,
    registrationPath,
    isStudentRole,
    isLoading,
    selectedIndex,
    setSelectedIndex,
    currentTaskIndex,
  } = useOnboardingGuide();

  if (!open) return null;

  const title = getGuideTitle(isStudentRole);
  const description = getGuideDescription(isStudentRole, registrationPath ?? undefined);

  if (isLoading || !progress) {
    return (
      <Modal open={open} onClose={closeGuide} title={title} description={description}>
        <p className="text-sm text-ink-400">Chargement de votre parcours…</p>
      </Modal>
    );
  }

  if (progress.isComplete) {
    return (
      <Modal open={open} onClose={closeGuide} title={title} description={description}>
        <div className="space-y-5 py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircleIcon className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-ink-900">Tout est prêt</h3>
            <p className="mt-2 text-sm text-ink-600">
              {isStudentRole
                ? "Vous avez complété toutes les étapes. Bon tutorat !"
                : "Votre compte prestataire est opérationnel. Vous pouvez proposer vos cours."}
            </p>
          </div>
          <Button onClick={closeGuide}>Fermer le guide</Button>
        </div>
      </Modal>
    );
  }

  const selectedTask = progress.tasks[selectedIndex];
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < progress.tasks.length - 1;

  return (
    <Modal
      open={open}
      onClose={closeGuide}
      title={title}
      description={description}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-brand-700">
            {progress.completedCount}/{progress.totalCount} — {progress.percent}%
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoPrev}
              onClick={() => setSelectedIndex(selectedIndex - 1)}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoNext}
              onClick={() => setSelectedIndex(selectedIndex + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      }
    >
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression du guide"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,11rem)_1fr]">
        <nav aria-label="Étapes du guide" className="space-y-1">
          {progress.tasks.map((task, index) => (
            <StepIndicator
              key={task.id}
              task={task}
              index={index}
              isSelected={index === selectedIndex}
              isCurrent={index === currentTaskIndex}
              onSelect={() => setSelectedIndex(index)}
            />
          ))}
        </nav>

        {selectedTask ? (
          <StepDetail
            task={selectedTask}
            isStudentRole={isStudentRole}
            registrationPath={registrationPath ?? undefined}
            onClose={closeGuide}
          />
        ) : null}
      </div>
    </Modal>
  );
}
