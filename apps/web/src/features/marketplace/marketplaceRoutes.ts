import type { CoursesTab } from "./teacherCoursesTab";

export type MarketplaceBase = "public" | "app";

const BASE_PATH: Record<MarketplaceBase, string> = {
  public: "",
  app: "/app",
};

export const marketplaceRoutes = {
  list(base: MarketplaceBase = "public", query?: string): string {
    const path = base === "app" ? "/app/cours" : "/";
    if (!query) return path;
    return `${path}?${query}`;
  },

  detail(id: string, base: MarketplaceBase = "public"): string {
    return base === "app" ? `/app/cours/${id}` : `/tuteurs/${id}`;
  },

  detailWithSlot(
    id: string,
    slotId: string,
    base: MarketplaceBase = "public",
  ): string {
    return `${marketplaceRoutes.detail(id, base)}?slot=${slotId}`;
  },

  tab(tab: CoursesTab, base: MarketplaceBase = "app"): string {
    return `${BASE_PATH[base]}/cours?tab=${tab}`;
  },

  login(intent?: "teacher"): string {
    const params = new URLSearchParams({ auth: "login" });
    if (intent === "teacher") params.set("intent", "teacher");
    return `/?${params}`;
  },

  /** Vision SEO : /campus/paris/tuteurs */
  campusList(campusSlug: string): string {
    return `/campus/${campusSlug}/tuteurs`;
  },
} as const;
