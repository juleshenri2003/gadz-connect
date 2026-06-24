import { useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useAuthGate } from "@/features/auth/useAuthGate";
import { useSelectedCampus } from "@/features/campus/useSelectedCampus";
import { usePageMeta } from "@/features/layout/usePageMeta";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";
import { TutorAvailableSlotsList } from "@/features/marketplace/tutor-detail/TutorAvailableSlotsList";
import { TutorBookingCalendar } from "@/features/marketplace/tutor-detail/TutorBookingCalendar";
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
  const { openGate } = useAuthGate();

  const initialSlotId = searchParams.get("slot");

  const { data: tutor, isLoading } = usePublicTutor(campusId, id ?? "");
  const { data: slots, isLoading: slotsLoading } = usePublicTutorSlots(
    campusId,
    id ?? "",
  );

  const tutorName = tutor
    ? `${tutor.first_name} ${tutor.last_name}`.trim()
    : "";

  const hasSlots =
    (slots?.length ?? 0) > 0 || (tutor?.available_slot_count ?? 0) > 0;

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
    if (!user || !id || !initialSlotId) return;
    navigate(marketplaceRoutes.detailWithSlot(id, initialSlotId, "app"), {
      replace: true,
    });
  }, [user, id, initialSlotId, navigate]);

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
      <div className="space-y-6 pb-24 sm:pb-0">
        <TutorProfileHeader
          tutor={tutor}
          backHref="/"
          backLabel="← Accueil"
          actions={
            <ShareTutorButton url={shareUrl} tutorName={tutorName} />
          }
        />

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <TutorBookingCalendar
              hourlyRate={tutor.hourly_rate}
              slots={slots}
              loading={slotsLoading}
              nextAvailableAt={tutor.next_available_slot_at}
              initialSlotId={initialSlotId}
              onBookSlot={handleBookSlot}
              listBackHref="/"
            />
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <TutorPresentationSection
              tutor={tutor}
              collapsible
              defaultOpen={!hasSlots}
            />
            <TutorCvSection
              hasCvPdf={tutor.has_cv_pdf}
              guestMode
              collapsible
              defaultOpen={false}
            />
            <TutorAvailableSlotsList
              hourlyRate={tutor.hourly_rate}
              slots={slots}
              loading={slotsLoading}
              onBookSlot={handleBookSlot}
            />
          </aside>
        </div>
      </div>
    </>
  );
}
