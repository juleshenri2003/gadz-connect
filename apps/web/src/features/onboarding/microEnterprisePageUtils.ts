import type { RegistrationPath } from "@gadz-connect/types";
import type { MyProfile } from "@/features/auth/useMyProfile";
import { STATUS_LABELS } from "@/features/admin/format";
import { hasValidSiret } from "@/features/onboarding/fiscalLabels";
import {
  inferRegistrationPath,
  REGISTRATION_PATH_LABELS,
} from "@/features/onboarding/registrationPath";

export type MicroStep = "questionnaire" | "guide" | "siret";

export type MicroStatusVariant = "success" | "warning" | "info" | "neutral" | "danger";

export interface MicroPageHeaderContent {
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeVariant: MicroStatusVariant;
  nextAction: string | null;
}

export function formatSiretDisplay(siret: string | null | undefined): string | null {
  const normalized = (siret ?? "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(normalized)) return siret ?? null;
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
}

export function formatFrenchDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const BADGE_VARIANT_CLASSES: Record<MicroStatusVariant, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  info: "bg-brand-100 text-brand-700",
  neutral: "bg-paper text-ink-600",
  danger: "bg-danger-bg text-danger",
};

export function microStatusBadgeClass(variant: MicroStatusVariant): string {
  return BADGE_VARIANT_CLASSES[variant];
}

export function buildMicroEnterpriseContextSubtitle(profile: MyProfile): string {
  const path = inferRegistrationPath(profile);
  const pathLabel = REGISTRATION_PATH_LABELS[path];
  const campus = profile.campus?.name ? `Campus ${profile.campus.name} — ` : "";
  return `${campus}${pathLabel}`;
}

export function isMicroEnterpriseRecapView(
  profile: MyProfile | undefined,
  stepParam: MicroStep | null,
  isEditMode: boolean,
): boolean {
  if (!profile) return false;
  const questionnaireDone = Boolean(profile.micro_enterprise_activity);
  if (!questionnaireDone || profile.account_status === "active") return false;
  if (!stepParam) return true;
  if (stepParam === "guide") return true;
  return stepParam === "questionnaire" && !isEditMode;
}

export function getRecapNextActionMessage(profile: MyProfile): string {
  const registrationPath = inferRegistrationPath(profile);
  const inpiSent = Boolean(profile.inpi_declaration_sent_at);
  const hasSiret = hasValidSiret(profile.siret);
  const siretDeclared = Boolean(profile.siret);
  return getNextActionAfterQuestionnaire(
    profile,
    registrationPath,
    inpiSent,
    hasSiret,
    siretDeclared,
  );
}

export function getMicroEnterprisePageHeader(
  profile: MyProfile | undefined,
  stepParam: MicroStep | null,
  isEditMode: boolean,
): MicroPageHeaderContent {
  if (!profile) {
    return {
      title: "Micro-entreprise",
      subtitle:
        "Créez ou déclarez votre statut micro-entreprise pour proposer des cours sur Gadz'Connect.",
      badgeLabel: "Chargement…",
      badgeVariant: "neutral",
      nextAction: null,
    };
  }

  const _registrationPath = inferRegistrationPath(profile);
  const questionnaireDone = Boolean(profile.micro_enterprise_activity);
  const isActive = profile.account_status === "active";
  const _hasSiret = hasValidSiret(profile.siret);
  const siretDeclared = Boolean(profile.siret);
  const inpiSent = Boolean(profile.inpi_declaration_sent_at);

  if (profile.siret_verification_failed) {
    return {
      title: "Micro-entreprise",
      subtitle: "Un problème a été détecté avec votre SIRET — contactez le support.",
      badgeLabel: "SIRET à vérifier",
      badgeVariant: "danger",
      nextAction: "Contactez l'équipe campus pour corriger votre numéro SIRET.",
    };
  }

  if (isActive && questionnaireDone) {
    return {
      title: "Compte micro-entreprise validé",
      subtitle: "Votre SIRET est enregistré — vous pouvez proposer des cours et configurer vos paiements.",
      badgeLabel: STATUS_LABELS.active,
      badgeVariant: "success",
      nextAction: null,
    };
  }

  if (stepParam === "guide") {
    return {
      title: "Micro-entreprise",
      subtitle: buildMicroEnterpriseContextSubtitle(profile),
      badgeLabel: inpiSent ? "INPI confirmé" : "INPI en cours",
      badgeVariant: inpiSent ? "success" : "info",
      nextAction: null,
    };
  }

  if (stepParam === "siret") {
    const siretFailed = profile.siret_verification_failed;
    return {
      title: "Déclarer votre SIRET",
      subtitle: "Saisissez le numéro à 14 chiffres reçu de l'INSEE.",
      badgeLabel: siretFailed
        ? "SIRET à corriger"
        : siretDeclared
          ? "SIRET transmis"
          : "SIRET à déclarer",
      badgeVariant: siretFailed ? "danger" : siretDeclared ? "warning" : "info",
      nextAction: siretFailed
        ? "Corrigez votre numéro SIRET pour activer votre compte."
        : siretDeclared
          ? "Vérification en cours — votre compte s'active automatiquement si le SIRET est reconnu."
          : "Saisissez votre numéro SIRET pour activer votre compte.",
    };
  }

  if (stepParam === "questionnaire" && isEditMode) {
    return {
      title: "Modifier le questionnaire fiscal",
      subtitle: "Ajustez vos réponses tant que votre SIRET n'a pas été déclaré.",
      badgeLabel: "Modification",
      badgeVariant: "info",
      nextAction: null,
    };
  }

  if (stepParam === "questionnaire" && questionnaireDone) {
    return {
      title: "Questionnaire fiscal",
      subtitle: "Vos réponses sont enregistrées.",
      badgeLabel: "Complété",
      badgeVariant: "success",
      nextAction: null,
    };
  }

  if (!questionnaireDone) {
    return {
      title: "Onboarding micro-entreprise",
      subtitle: `${buildMicroEnterpriseContextSubtitle(profile)} — parcours adapté à votre situation.`,
      badgeLabel: "Questionnaire à compléter",
      badgeVariant: "info",
      nextAction: "Complétez le questionnaire fiscal en 4 étapes (~10 min).",
    };
  }

  // Questionnaire done, not active, no step param — recap state
  return {
    title: "Micro-entreprise",
    subtitle: buildMicroEnterpriseContextSubtitle(profile),
    badgeLabel: STATUS_LABELS[profile.account_status] ?? profile.account_status,
    badgeVariant: profile.account_status === "pending_siret" ? "warning" : "neutral",
    nextAction: null,
  };
}

function getNextActionAfterQuestionnaire(
  profile: MyProfile,
  registrationPath: RegistrationPath,
  inpiSent: boolean,
  hasSiret: boolean,
  siretDeclared: boolean,
): string {
  if (siretDeclared && !hasSiret) {
    if (profile.siret_verification_failed) {
      return "Votre SIRET n'a pas été reconnu — corrigez-le pour activer votre compte.";
    }
    return "Votre SIRET est en cours de vérification.";
  }
  if (hasSiret) {
    return "Votre compte sera activé sous peu.";
  }
  if (registrationPath === "existing_siret") {
    return "Prochaine étape : déclarez votre SIRET existant pour activer votre compte.";
  }
  if (!inpiSent) {
    return "Prochaine étape : créez votre micro-entreprise sur l'INPI (Guichet Unique).";
  }
  return "Prochaine étape : déclarez votre SIRET dès réception de l'INSEE.";
}

export type MicroTimelineStepId = "questionnaire" | "inpi" | "siret";

export interface MicroTimelineStep {
  id: MicroTimelineStepId;
  label: string;
  href: string;
  isDone: boolean;
  isCurrent: boolean;
  isWaiting: boolean;
}

export function getMicroEnterpriseTimelineSteps(
  profile: MyProfile,
  stepParam: MicroStep | null,
): MicroTimelineStep[] {
  const registrationPath = inferRegistrationPath(profile);
  const questionnaireDone = Boolean(profile.micro_enterprise_activity);
  const inpiDone =
    Boolean(profile.inpi_declaration_sent_at) || hasValidSiret(profile.siret);
  const siretDone = hasValidSiret(profile.siret);
  const siretWaiting = Boolean(profile.siret) && !siretDone;

  const steps: Omit<MicroTimelineStep, "isCurrent">[] = [
    {
      id: "questionnaire",
      label: "Questionnaire",
      href: questionnaireDone
        ? "/app/micro-entreprise"
        : "/app/micro-entreprise?step=questionnaire",
      isDone: questionnaireDone,
      isWaiting: false,
    },
  ];

  if (registrationPath === "new_micro") {
    steps.push({
      id: "inpi",
      label: "INPI",
      href: "/app/micro-entreprise#inpi-guide",
      isDone: inpiDone,
      isWaiting: false,
    });
  }

  steps.push({
    id: "siret",
    label: "SIRET",
    href: "/app/micro-entreprise?step=siret",
    isDone: siretDone,
    isWaiting: siretWaiting,
  });

  const currentId = resolveCurrentTimelineStep(
    stepParam,
    questionnaireDone,
    registrationPath,
    inpiDone,
    siretDone,
    siretWaiting,
  );

  return steps.map((step) => ({
    ...step,
    isCurrent: step.id === currentId && !step.isDone,
  }));
}

function resolveCurrentTimelineStep(
  stepParam: MicroStep | null,
  questionnaireDone: boolean,
  registrationPath: RegistrationPath,
  inpiDone: boolean,
  siretDone: boolean,
  siretWaiting: boolean,
): MicroTimelineStepId {
  if (stepParam === "guide") return "inpi";
  if (stepParam === "siret") return "siret";
  if (stepParam === "questionnaire" || !questionnaireDone) return "questionnaire";
  if (siretWaiting) return "siret";
  if (!siretDone) {
    if (registrationPath === "new_micro" && !inpiDone) return "inpi";
    return "siret";
  }
  return "siret";
}

export function getPrimaryRecapCta(
  profile: MyProfile,
): { primary: { label: string; href: string }; secondary: { label: string; href: string } | null } {
  const registrationPath = inferRegistrationPath(profile);
  const inpiSent = Boolean(profile.inpi_declaration_sent_at);
  const hasSiret = hasValidSiret(profile.siret);

  if (profile.siret_verification_failed && profile.siret) {
    return {
      primary: {
        label: "Corriger mon SIRET",
        href: "/app/micro-entreprise?step=siret",
      },
      secondary: null,
    };
  }

  if (hasSiret || profile.siret) {
    return {
      primary: { label: "Voir mon tableau de bord", href: "/app" },
      secondary: null,
    };
  }

  if (registrationPath === "existing_siret") {
    return {
      primary: { label: "Déclarer mon SIRET", href: "/app/micro-entreprise?step=siret" },
      secondary: null,
    };
  }

  if (!inpiSent) {
    return {
      primary: { label: "Voir le guide INPI", href: "/app/micro-entreprise#inpi-guide" },
      secondary: { label: "Déclarer mon SIRET", href: "/app/micro-entreprise?step=siret" },
    };
  }

  return {
    primary: { label: "Déclarer mon SIRET", href: "/app/micro-entreprise?step=siret" },
    secondary: { label: "Revoir le guide INPI", href: "/app/micro-entreprise#inpi-guide" },
  };
}
