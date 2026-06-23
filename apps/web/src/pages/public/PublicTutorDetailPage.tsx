import { useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthGateModal } from "@/features/auth/AuthGateModal";
import { useAuthGate } from "@/features/auth/useAuthGate";
import { useSelectedCampus } from "@/features/campus/useSelectedCampus";
import { usePageMeta } from "@/features/layout/usePageMeta";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";
import { PublicTutorSlotsPanel } from "@/features/marketplace/tutor-detail/PublicTutorSlotsPanel";
import { ShareTutorButton } from "@/features/marketplace/tutor-detail/ShareTutorButton";
import { TutorCvSection } from "@/features/marketplace/tutor-detail/TutorCvSection";
import { TutorPresentationSection } from "@/features/marketplace/tutor-detail/TutorPresentationSection";
import { TutorProfileHeader } from "@/features/marketplace/tutor-detail/TutorProfileHeader";
import {
  usePublicTutor,
  usePublicTutorSlots,
} from "@/features/marketplace/usePublicTutors";

export function PublicTutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { campusId } = useSelectedCampus();
  const { gate, openGate, closeGate, proceedToLogin } = useAuthGate();

  const { data: tutor, isLoading } = usePublicTutor(campusId, id ?? "");
  const { data: slots } = usePublicTutorSlots(campusId, id ?? "");

  const tutorName = tutor
    ? `${tutor.first_name} ${tutor.last_name}`.trim()
    : "";

  usePageMeta(
    tutorName || "Professeur",
    tutor?.bio?.slice(0, 160) ??
      "Fiche professeur Gadz'Connect — matières, tarif et créneaux disponibles.",
  );

  useEffect(() => {
    if (id && tutor) {
      trackMarketplaceEvent("tutor_profile_view", { tutorId: id });
    }
  }, [id, tutor]);

  useEffect(() => {
    const slotId = searchParams.get("slot");
    if (!user || !id || !slotId) return;
    navigate(marketplaceRoutes.detailWithSlot(id, slotId, "app"), {
      replace: true,
    });
  }, [user, id, searchParams, navigate]);

  function handleBookSlot(slotId: string) {
    if (!tutor || !id) return;

    if (user) {
      navigate(marketplaceRoutes.detailWithSlot(id, slotId, "app"));
      return;
    }

    openGate({
      tutorId: id,
      tutorName,
      slotId,
      intent: "student",
    });
  }

  if (isLoading || !campusId) {
    return <p className="text-sm text-ink-400">Chargement…</p>;
  }

  if (!tutor) {
    return (
      <p className="text-sm text-danger">
        Tuteur introuvable.{" "}
        <Link to="/" className="underline">
          Retour
        </Link>
      </p>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${marketplaceRoutes.detail(tutor.id, "public")}`
      : marketplaceRoutes.detail(tutor.id, "public");

  return (
    <>
      <div className="space-y-8">
        <TutorProfileHeader
          tutor={tutor}
          backHref="/"
          backLabel="← Accueil"
          actions={
            <ShareTutorButton url={shareUrl} tutorName={tutorName} />
          }
        />

        <TutorPresentationSection tutor={tutor} />

        <TutorCvSection
          hasCvPdf={tutor.has_cv_pdf}
          guestMode
        />

        <PublicTutorSlotsPanel
          hourlyRate={tutor.hourly_rate}
          slots={slots}
          onBookSlot={handleBookSlot}
          listBackHref="/"
        />
      </div>

      <AuthGateModal
        open={Boolean(gate)}
        context={gate}
        onClose={closeGate}
        onContinue={proceedToLogin}
      />
    </>
  );
}
