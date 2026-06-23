import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  campusSlugFromName,
  resolveCampusIdFromSlug,
} from "@/features/campus/campusLabels";
import { useSelectedCampus } from "@/features/campus/useSelectedCampus";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";

/** Synchronise le campus depuis /campus/:campusSlug/tuteurs et met à jour l'URL au changement. */
export function usePublicCampusRoute() {
  const { campusSlug } = useParams<{ campusSlug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { campusId, setCampusId, campuses, selectedCampus } =
    useSelectedCampus();

  useEffect(() => {
    if (!campusSlug || !campuses.length) return;
    const resolved = resolveCampusIdFromSlug(campusSlug, campuses);
    if (resolved && resolved !== campusId) {
      setCampusId(resolved);
    }
  }, [campusSlug, campuses, campusId, setCampusId]);

  useEffect(() => {
    if (campusSlug || !selectedCampus) return;
    if (location.pathname !== "/") return;
    const slug = campusSlugFromName(selectedCampus.name);
    navigate(marketplaceRoutes.campusList(slug), { replace: true });
  }, [campusSlug, selectedCampus, navigate, location.pathname]);

  function selectCampus(id: string) {
    const campus = campuses.find((c) => c.id === id);
    if (!campus) return;

    setCampusId(id);
    trackMarketplaceEvent("campus_change", {
      campusId: id,
      campusName: campus.name,
    });

    const slug = campusSlugFromName(campus.name);
    navigate(marketplaceRoutes.campusList(slug), { replace: true });
  }

  const canonicalUrl =
    selectedCampus && typeof window !== "undefined"
      ? `${window.location.origin}${marketplaceRoutes.campusList(campusSlugFromName(selectedCampus.name))}`
      : undefined;

  return {
    campusSlug,
    campusId,
    selectedCampus,
    campuses,
    selectCampus,
    canonicalUrl,
  };
}
