import type { RegistrationPath } from "@gadz-connect/types";
import type { AdminProfileRow } from "@/features/admin/types";
import { getStripeStatus, REGISTRATION_PATH_SHORT } from "./adminUserLabels";

export type TeacherReadinessClass = "ready" | "missing_siret" | "missing_stripe";

export type TeacherSubclassKey =
  | RegistrationPath
  | "unspecified";

export interface TeacherSubclassGroup {
  key: TeacherSubclassKey;
  label: string;
  profiles: AdminProfileRow[];
}

export interface TeacherClassGroup {
  id: TeacherReadinessClass;
  label: string;
  hint: string;
  profiles: AdminProfileRow[];
  subclasses: TeacherSubclassGroup[];
}

const CLASS_ORDER: TeacherReadinessClass[] = [
  "ready",
  "missing_siret",
  "missing_stripe",
];

const CLASS_META: Record<
  TeacherReadinessClass,
  { label: string; hint: string }
> = {
  ready: {
    label: "Complets",
    hint: "SIRET renseigné et Stripe actif",
  },
  missing_siret: {
    label: "Sans SIRET",
    hint: "Aucun SIRET soumis — onboarding micro-entreprise incomplet",
  },
  missing_stripe: {
    label: "Sans Stripe",
    hint: "SIRET OK, Stripe manquant ou onboarding incomplet",
  },
};

const SUBCLASS_ORDER: TeacherSubclassKey[] = [
  "existing_siret",
  "new_micro",
  "unspecified",
];

export function classifyTeacherReadiness(
  profile: AdminProfileRow,
): TeacherReadinessClass {
  if (!profile.siret?.trim()) return "missing_siret";
  if (getStripeStatus(profile) !== "active") return "missing_stripe";
  return "ready";
}

function subclassKey(profile: AdminProfileRow): TeacherSubclassKey {
  const path = profile.registration_path as RegistrationPath | null;
  if (path === "existing_siret" || path === "new_micro") return path;
  return "unspecified";
}

function subclassLabel(key: TeacherSubclassKey): string {
  if (key === "unspecified") return "Parcours non renseigné";
  return REGISTRATION_PATH_SHORT[key];
}

function sortByName(a: AdminProfileRow, b: AdminProfileRow): number {
  const last = a.last_name.localeCompare(b.last_name, "fr");
  if (last !== 0) return last;
  return a.first_name.localeCompare(b.first_name, "fr");
}

/** Groupe les professeurs par classe (prêt / SIRET / Stripe) puis sous-classe (parcours). */
export function groupTeachersByReadiness(
  profiles: AdminProfileRow[],
): TeacherClassGroup[] {
  const buckets: Record<TeacherReadinessClass, AdminProfileRow[]> = {
    ready: [],
    missing_siret: [],
    missing_stripe: [],
  };

  for (const profile of profiles) {
    buckets[classifyTeacherReadiness(profile)].push(profile);
  }

  return CLASS_ORDER.map((id) => {
    const list = buckets[id].slice().sort(sortByName);
    const bySubclass = new Map<TeacherSubclassKey, AdminProfileRow[]>();

    for (const profile of list) {
      const key = subclassKey(profile);
      const current = bySubclass.get(key) ?? [];
      current.push(profile);
      bySubclass.set(key, current);
    }

    const subclasses: TeacherSubclassGroup[] = SUBCLASS_ORDER.filter((key) =>
      bySubclass.has(key),
    ).map((key) => ({
      key,
      label: subclassLabel(key),
      profiles: bySubclass.get(key) ?? [],
    }));

    return {
      id,
      label: CLASS_META[id].label,
      hint: CLASS_META[id].hint,
      profiles: list,
      subclasses,
    };
  });
}

export function countTeacherReadiness(profiles: AdminProfileRow[]): Record<
  TeacherReadinessClass,
  number
> {
  const counts: Record<TeacherReadinessClass, number> = {
    ready: 0,
    missing_siret: 0,
    missing_stripe: 0,
  };
  for (const profile of profiles) {
    counts[classifyTeacherReadiness(profile)] += 1;
  }
  return counts;
}
