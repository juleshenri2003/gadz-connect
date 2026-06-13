import type { RegistrationPath } from "@gadz-connect/types";
import type { DashboardTask } from "@/features/dashboard/dashboardTypes";
import type { BrandId } from "./brands/BrandLogo";
import type { DestinationIcon } from "./GuideDestinationHint";

export interface GuidePartner {
  brand: BrandId;
  label: string;
  hint?: string;
}

export interface GuideStepContent {
  why: string;
  ctaLabel?: string;
  externalUrl?: string;
  externalLabel?: string;
  externalBrand?: BrandId;
  waitingMessage?: string;
  blockedMessage?: string;
  blockedHref?: string;
  blockedHrefLabel?: string;
  partners?: GuidePartner[];
  destination?: { icon: DestinationIcon; label: string };
  estimatedDuration?: string;
  prerequisites?: string[];
}

const TEACHER_GUIDE_SHARED: Record<string, GuideStepContent> = {
  profile: {
    why: "Votre identité et votre campus permettent à l'équipe de vous identifier et de vous proposer aux bons élèves.",
    ctaLabel: "Compléter mon profil",
    destination: { icon: "profile", label: "Configuration du profil" },
    estimatedDuration: "5 min",
  },
  questionnaire: {
    why: "Ces informations fiscales sont nécessaires pour déclarer votre activité de tutorat en micro-entreprise.",
    ctaLabel: "Remplir le questionnaire",
    partners: [
      {
        brand: "urssaf",
        label: "Déclarations via l'espace auto-entrepreneur URSSAF",
        hint: "Périodicité et options fiscales",
      },
    ],
    destination: { icon: "micro", label: "Micro-entreprise — questionnaire" },
    estimatedDuration: "10 min",
    prerequisites: ["Profil complété"],
  },
  inpi: {
    why: "L'immatriculation sur le Guichet Unique INPI est obligatoire pour obtenir votre numéro SIRET et exercer légalement.",
    externalUrl: "https://procedures.inpi.fr/",
    externalLabel: "Ouvrir le Guichet Unique INPI",
    externalBrand: "inpi",
    estimatedDuration: "1 à 15 jours",
    prerequisites: ["Questionnaire fiscal complété"],
  },
  stripe: {
    why: "Stripe Connect permet de recevoir vos virements de tutorat de manière sécurisée et conforme.",
    ctaLabel: "Configurer les paiements",
    partners: [
      {
        brand: "stripe",
        label: "Virements sécurisés via Stripe Connect",
        hint: "Compte prestataire pour recevoir vos paiements",
      },
    ],
    blockedMessage:
      "Cette étape sera accessible une fois votre SIRET enregistré et votre compte activé.",
    blockedHref: "/app/micro-entreprise",
    blockedHrefLabel: "Voir micro-entreprise",
    destination: { icon: "payments", label: "Paiements — Stripe Connect" },
    estimatedDuration: "10 min",
    prerequisites: ["Compte activé"],
  },
  publish_slots: {
    why: "Publiez votre tarif et vos créneaux pour que les élèves puissent réserver des cours avec vous.",
    ctaLabel: "Publier mes créneaux",
    blockedMessage:
      "Vous pourrez publier des créneaux une fois votre compte activé (SIRET enregistré).",
    blockedHref: "/app/micro-entreprise",
    blockedHrefLabel: "Voir micro-entreprise",
    destination: { icon: "courses", label: "Mes cours — tarif et créneaux" },
    estimatedDuration: "5 min",
    prerequisites: ["Compte activé", "Stripe configuré (recommandé)"],
  },
};

const SIRET_GUIDE_BY_PATH: Record<RegistrationPath, GuideStepContent> = {
  existing_siret: {
    why: "Saisissez votre SIRET existant pour activer automatiquement votre compte prestataire.",
    ctaLabel: "Déclarer mon SIRET",
    destination: { icon: "micro", label: "Micro-entreprise — déclaration SIRET" },
    estimatedDuration: "2 min",
    prerequisites: ["Questionnaire fiscal complété"],
  },
  new_micro: {
    why: "Saisissez le SIRET reçu de l'INSEE — votre compte sera activé instantanément, sans attente.",
    ctaLabel: "Déclarer mon SIRET",
    destination: { icon: "micro", label: "Micro-entreprise — déclaration SIRET" },
    estimatedDuration: "2 min",
    prerequisites: ["Demande INPI envoyée ou SIRET reçu"],
  },
};

const STUDENT_GUIDE_CONTENT: Record<string, GuideStepContent> = {
  profile: {
    why: "Votre identité et votre campus permettent de vous proposer les tuteurs disponibles sur votre site.",
    ctaLabel: "Voir mon profil",
    destination: { icon: "profile", label: "Mon profil" },
    estimatedDuration: "3 min",
  },
  find_tutor: {
    why: "Découvrez les professeurs de votre campus, consultez leurs profils et réservez un créneau.",
    ctaLabel: "Voir les tuteurs",
    destination: { icon: "tutors", label: "Trouver mon tuteur" },
    estimatedDuration: "10 min",
    waitingMessage:
      "Aucun tuteur n'est disponible sur votre campus pour l'instant. Reconsultez régulièrement la page Trouver mon tuteur — de nouveaux professeurs peuvent s'inscrire.",
    blockedHref: "/app/cours",
    blockedHrefLabel: "Voir Trouver mon tuteur",
  },
  follow_courses: {
    why: "Consultez vos sessions planifiées, votre emploi du temps et les résumés de cours publiés par vos tuteurs.",
    ctaLabel: "Voir mon emploi du temps",
    destination: { icon: "calendar", label: "Emploi du temps et répertoire" },
    estimatedDuration: "5 min",
    prerequisites: ["Au moins un cours réservé"],
  },
};

export function getGuideStepContent(
  task: DashboardTask,
  isStudent: boolean,
  registrationPath?: RegistrationPath,
): GuideStepContent {
  if (isStudent) {
    const content = STUDENT_GUIDE_CONTENT[task.id];
    if (content) return content;
    return { why: task.description, ctaLabel: task.href ? "Continuer" : undefined };
  }

  if (task.id === "siret" && registrationPath) {
    return SIRET_GUIDE_BY_PATH[registrationPath];
  }

  const content = TEACHER_GUIDE_SHARED[task.id];
  if (content) return content;

  return {
    why: task.description,
    ctaLabel: task.href ? "Continuer" : undefined,
  };
}

export function getTeacherStepBrand(taskId: string): BrandId | undefined {
  const content = TEACHER_GUIDE_SHARED[taskId];
  if (!content) return undefined;
  if (content.externalBrand) return content.externalBrand;
  return content.partners?.[0]?.brand;
}

export function getGuideTitle(isStudent: boolean): string {
  return isStudent ? "Guide de démarrage élève" : "Guide de démarrage prestataire";
}

export function getGuideDescription(
  isStudent: boolean,
  registrationPath?: RegistrationPath,
): string {
  if (isStudent) {
    return "Suivez ces étapes pour réserver votre premier cours de tutorat.";
  }
  if (registrationPath === "existing_siret") {
    return "Parcours express (~15 min) — activez votre compte avec votre SIRET existant.";
  }
  return "Parcours complet (~2 semaines) — créez votre micro-entreprise et proposez des cours.";
}

export function getJourneySubtitle(
  registrationPath: RegistrationPath,
  accountStatus: string,
  campusName?: string,
): string {
  const campus = campusName ? `Campus ${campusName} — ` : "";
  if (accountStatus === "pending_siret") {
    return `${campus}En cours d'immatriculation — complétez les étapes restantes`;
  }
  if (registrationPath === "existing_siret") {
    return `${campus}Compte activé automatiquement — finalisez Stripe et vos créneaux`;
  }
  return `${campus}Votre SIRET active votre compte instantanément — finalisez votre espace`;
}
