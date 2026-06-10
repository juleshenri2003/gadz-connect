import type { UserRole } from "@gadz-connect/types";

export function isStudent(role: UserRole): boolean {
  return role === "student_provider";
}

export function isTutor(role: UserRole): boolean {
  return role === "teacher";
}

/** Micro-entreprise / SIRET requis uniquement pour les enseignants-intervenants */
export function needsMicroEnterprise(role: UserRole): boolean {
  return role === "teacher";
}
