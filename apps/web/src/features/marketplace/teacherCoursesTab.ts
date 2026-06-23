import { marketplaceRoutes } from "./marketplaceRoutes";

export type CoursesTab = "slots" | "profile" | "documentation";

const VALID_TABS: CoursesTab[] = ["slots", "profile", "documentation"];

export function parseCoursesTab(value: string | null | undefined): CoursesTab {
  if (value && VALID_TABS.includes(value as CoursesTab)) {
    return value as CoursesTab;
  }
  return "slots";
}

export function coursesTabHref(tab: CoursesTab): string {
  return marketplaceRoutes.tab(tab, "app");
}

export const BIO_MAX_LENGTH = 2000;
