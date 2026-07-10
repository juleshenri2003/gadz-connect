export const CLASS_YEAR_OPTIONS = [
  "L1",
  "L2",
  "L3",
  "GI1",
  "GI2",
  "GI3",
  "GIM",
  "Autre",
] as const;

export const LEARNING_FLAG_OPTIONS = [
  { value: "dyslexie" as const, label: "Dyslexie" },
  { value: "hpi" as const, label: "HPI (haut potentiel)" },
  { value: "tdah" as const, label: "TDAH" },
  { value: "autre" as const, label: "Autre besoin spécifique" },
];

export const LEARNING_FLAG_LABELS: Record<string, string> = {
  dyslexie: "Dyslexie",
  hpi: "HPI",
  tdah: "TDAH",
  autre: "Autre",
};
