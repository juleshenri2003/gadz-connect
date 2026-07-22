import { marketplaceRoutes } from "./marketplaceRoutes";

export type CoursesTab = "slots" | "profile" | "history";

const VALID_TABS: CoursesTab[] = ["slots", "profile", "history"];

/** Ancien onglet « documentation » fusionné dans « history ». */
const TAB_ALIASES: Record<string, CoursesTab> = {
  documentation: "history",
};

export function parseCoursesTab(value: string | null | undefined): CoursesTab {
  if (!value) return "slots";
  if (VALID_TABS.includes(value as CoursesTab)) {
    return value as CoursesTab;
  }
  return TAB_ALIASES[value] ?? "slots";
}

export function coursesTabHref(tab: CoursesTab): string {
  return marketplaceRoutes.tab(tab, "app");
}

export const BIO_MAX_LENGTH = 2000;
