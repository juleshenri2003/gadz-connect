import { Button, cn } from "@gadz-connect/ui";
import { BookOpen, ChevronLeft, Clock3, Lock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import { campusDisplayName } from "@/features/campus/campusLabels";
import { TutorAvatar } from "../TutorCard";
import {
  formatNextSlot,
  type MarketplaceTutorBase,
} from "../marketplaceUtils";
import { ShareTutorButton } from "./ShareTutorButton";
import type { TutorSlotView } from "./slotCalendarUtils";
import { TutorCollapsibleSection } from "./TutorCollapsibleSection";
import { TutorCvSection } from "./TutorCvSection";
import { TutorPresentationSection } from "./TutorPresentationSection";
import { TutorProfileLinks } from "@/features/profile/TutorProfileLinks";

const BOOKING_CALENDAR_ID = "tutor-booking-calendar";

export interface PublicCheapestSlot {
  id: string;
  starts_at: string;
  ends_at: string;
  price: number;
}

interface TutorProfileHeaderProps {
  tutor: MarketplaceTutorBase & {
    campus?: { name: string } | null;
    cheapest_upcoming_slot?: PublicCheapestSlot | null;
  };
  backHref: string;
  backLabel?: string;
  /** @deprecated Préférer shareUrl + shareTutorName pour le hero public. */
  actions?: React.ReactNode;
  shareUrl?: string;
  shareTutorName?: string;
  showSubjects?: boolean;
  includeAbout?: boolean;
  aboutDefaultOpen?: boolean;
  includeCv?: boolean;
  cvGuestMode?: boolean;
  cvDefaultOpen?: boolean;
  cvPdfUrl?: string | null;
  className?: string;
  variant?: "default" | "public";
  slots?: TutorSlotView[];
  slotsLoading?: boolean;
  onBookSlot?: (slotId: string) => void;
  listBackHref?: string;
}

function scrollToBookingCalendar() {
  document
    .getElementById(BOOKING_CALENDAR_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function CampusLocation({
  campusName,
  className,
}: {
  campusName: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm text-ink-600",
        className,
      )}
    >
      <MapPin
        className="h-3.5 w-3.5 shrink-0 text-ink-400"
        aria-hidden
      />
      <span>{campusDisplayName(campusName)}</span>
    </span>
  );
}

function SubjectLine({
  subjects,
  className,
}: {
  subjects: string[];
  className?: string;
}) {
  if (subjects.length === 0) return null;

  const displayed = subjects.slice(0, 6);
  const extra = subjects.length - displayed.length;

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <BookOpen
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
          Matières
        </p>
        <p className="mt-0.5 text-sm font-medium leading-snug text-ink-900">
          {displayed.join(" · ")}
          {extra > 0 ? (
            <span className="font-normal text-ink-500">{` · +${extra}`}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function HeroPitchContent({
  tutor,
  campusName,
  includeAbout,
  aboutDefaultOpen,
  showSubjects,
  cvGuestMode,
  hasCv,
}: {
  tutor: MarketplaceTutorBase;
  campusName?: string | null;
  includeAbout?: boolean;
  aboutDefaultOpen?: boolean;
  showSubjects?: boolean;
  cvGuestMode?: boolean;
  hasCv: boolean;
}) {
  const bio = tutor.bio?.trim() || "Aucune description courte pour le moment.";
  const isLongBio = bio.length > 200;
  const showTags = showSubjects !== false && tutor.subjects.length > 0;
  const showCvNote = cvGuestMode && hasCv;
  const showLinks = (tutor.profile_links?.length ?? 0) > 0;
  const showCampus = Boolean(campusName);

  return (
    <div className="space-y-3">
      {showCampus ? (
        <CampusLocation
          campusName={campusName!}
          className="text-xs text-ink-500"
        />
      ) : null}

      {includeAbout ? (
        isLongBio ? (
          <TutorCollapsibleSection
            title="Présentation"
            summary={`${bio.slice(0, 200).trimEnd()}…`}
            defaultOpen={aboutDefaultOpen}
            embedded
            nested
            className="border-0 bg-transparent"
          >
            <p className="text-sm leading-relaxed text-ink-600">{bio}</p>
          </TutorCollapsibleSection>
        ) : (
          <p className="text-sm leading-relaxed text-ink-600">{bio}</p>
        )
      ) : null}

      {showLinks ? <TutorProfileLinks links={tutor.profile_links} /> : null}

      {showTags ? (
        <SubjectLine subjects={tutor.subjects} />
      ) : null}

      {showCvNote ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-600">
          <Lock
            className="h-3.5 w-3.5 shrink-0 text-brand-600"
            aria-hidden
          />
          CV disponible — connectez-vous pour consulter
        </p>
      ) : null}
    </div>
  );
}

function AvailabilityCapsule({
  slotCount,
  nextAvailableAt,
}: {
  slotCount: number;
  nextAvailableAt?: string | null;
}) {
  const hasSlots = slotCount > 0;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        hasSlots
          ? "border-success/20 bg-success-bg"
          : "border-warning/20 bg-warning-bg",
      )}
    >
      <div className="flex items-start gap-2">
        <Clock3
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            hasSlots ? "text-success" : "text-warning",
          )}
          aria-hidden
        />
        <div className="min-w-0">
          {hasSlots ? (
            <>
              <p className="text-sm font-semibold text-success">
                {slotCount} créneau{slotCount > 1 ? "x" : ""} disponible
                {slotCount > 1 ? "s" : ""}
              </p>
              {nextAvailableAt ? (
                <p className="mt-0.5 text-xs text-ink-600">
                  Prochain : {formatNextSlot(nextAvailableAt)}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-medium text-warning">
              Aucun créneau ouvert pour l&apos;instant
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PublicHero({
  tutor,
  backHref,
  backLabel,
  shareUrl,
  shareTutorName,
  showSubjects,
  includeAbout,
  aboutDefaultOpen,
  includeCv,
  cvGuestMode,
  cvDefaultOpen,
  cvPdfUrl,
  slots,
  slotsLoading,
  onBookSlot,
  listBackHref,
}: TutorProfileHeaderProps) {
  const name = `${tutor.first_name} ${tutor.last_name}`.trim();
  const slotCount = tutor.available_slot_count ?? 0;
  const hasSlots = slotCount > 0;
  const hasCv = Boolean(tutor.has_cv_pdf) || Boolean(tutor.cv?.trim());
  const nextSlot = slots?.[0] ?? null;
  const bookableSlotId =
    nextSlot?.id ?? tutor.cheapest_upcoming_slot?.id ?? null;

  return (
    <div className="overflow-hidden border-y border-brand-100 bg-surface shadow-surface sm:border sm:border-brand-100 sm:rounded-md">
      <div className="flex items-center justify-between gap-3 border-b border-brand-100 bg-brand-50 px-4 py-2 sm:px-6">
        <Link
          to={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 transition hover:text-brand-700"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          {backLabel?.replace(/^←\s*/, "") ?? "Retour"}
        </Link>
        {shareUrl && shareTutorName ? (
          <ShareTutorButton
            url={shareUrl}
            tutorName={shareTutorName}
            variant="ghost"
          />
        ) : null}
      </div>

      <div className="bg-brand-50 px-4 py-4 sm:px-6 sm:pb-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start lg:gap-6">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <TutorAvatar
              name={name}
              photoUrl={tutor.avatar_url}
              size="xl"
              className="ring-2 ring-brand-100 ring-offset-2 ring-offset-brand-50"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="flex flex-wrap items-start gap-2">
                  <h1 className="font-display text-xl font-bold leading-tight text-ink-900 sm:text-2xl">
                    {name}
                  </h1>
                  {tutor.has_cv_pdf ? (
                    <span
                      className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success"
                      title="CV disponible"
                    >
                      CV
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {tutor.hourly_rate
                    ? `${formatEuro(tutor.hourly_rate)} / heure`
                    : "Tarif non renseigné"}
                </p>
              </div>

              <div className="lg:hidden">
                <AvailabilityCapsule
                  slotCount={slotCount}
                  nextAvailableAt={tutor.next_available_slot_at}
                />
              </div>

              <div className="flex flex-col gap-2 lg:hidden">
                {hasSlots ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={scrollToBookingCalendar}
                  >
                    Voir les créneaux
                  </Button>
                ) : null}
                {hasSlots && bookableSlotId && onBookSlot ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={slotsLoading}
                    onClick={() => onBookSlot(bookableSlotId)}
                  >
                    Réserver le prochain créneau
                  </Button>
                ) : null}
                {!hasSlots && listBackHref ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <Link to={listBackHref}>Voir d&apos;autres profs</Link>
                  </Button>
                ) : null}
              </div>

              <HeroPitchContent
                tutor={tutor}
                campusName={tutor.campus?.name}
                includeAbout={includeAbout}
                aboutDefaultOpen={aboutDefaultOpen}
                showSubjects={showSubjects}
                cvGuestMode={cvGuestMode}
                hasCv={hasCv}
              />
            </div>
          </div>

          <div className="hidden space-y-3 lg:block">
            <AvailabilityCapsule
              slotCount={slotCount}
              nextAvailableAt={tutor.next_available_slot_at}
            />
            <div className="flex flex-col gap-2">
              {hasSlots ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={scrollToBookingCalendar}
                >
                  Voir les créneaux
                </Button>
              ) : null}
              {hasSlots && bookableSlotId && onBookSlot ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={slotsLoading}
                  onClick={() => onBookSlot(bookableSlotId)}
                >
                  Réserver le prochain créneau
                </Button>
              ) : null}
              {!hasSlots && listBackHref ? (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={listBackHref}>Voir d&apos;autres profs</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {includeCv && !cvGuestMode ? (
        <TutorCvSection
          hasCvPdf={Boolean(tutor.has_cv_pdf)}
          cvPdfUrl={cvPdfUrl}
          cvText={tutor.cv}
          guestMode={cvGuestMode}
          collapsible
          embedded
          defaultOpen={cvDefaultOpen}
        />
      ) : null}
    </div>
  );
}

export function TutorProfileHeader({
  tutor,
  backHref,
  backLabel = "← Tous les tuteurs",
  actions,
  shareUrl,
  shareTutorName,
  showSubjects = true,
  includeAbout = false,
  aboutDefaultOpen = false,
  includeCv = false,
  cvGuestMode = false,
  cvDefaultOpen = false,
  cvPdfUrl,
  className,
  variant = "default",
  slots,
  slotsLoading,
  onBookSlot,
  listBackHref,
}: TutorProfileHeaderProps) {
  if (variant === "public") {
    return (
      <header className={cn("-mx-4 sm:-mx-6", className)}>
        <PublicHero
          tutor={tutor}
          backHref={backHref}
          backLabel={backLabel}
          shareUrl={shareUrl}
          shareTutorName={shareTutorName}
          showSubjects={showSubjects}
          includeAbout={includeAbout}
          aboutDefaultOpen={aboutDefaultOpen}
          includeCv={includeCv}
          cvGuestMode={cvGuestMode}
          cvDefaultOpen={cvDefaultOpen}
          cvPdfUrl={cvPdfUrl}
          slots={slots}
          slotsLoading={slotsLoading}
          onBookSlot={onBookSlot}
          listBackHref={listBackHref}
        />
      </header>
    );
  }

  const name = `${tutor.first_name} ${tutor.last_name}`.trim();
  const slotCount = tutor.available_slot_count ?? 0;
  const hasSlots = slotCount > 0;

  return (
    <header className={cn("-mx-4 sm:-mx-6", className)}>
      <Link
        to={backHref}
        className="inline-flex items-center px-4 pb-1 text-sm font-medium text-ink-500 transition hover:text-brand-700 sm:px-6"
      >
        {backLabel}
      </Link>

      <div className="overflow-hidden border-y border-brand-100 bg-surface shadow-surface sm:border sm:border-brand-100 sm:rounded-md">
        <div className="bg-brand-50 px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <TutorAvatar
              name={name}
              photoUrl={tutor.avatar_url}
              size="lg"
              className="ring-2 ring-brand-100 ring-offset-2 ring-offset-brand-50"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-bold leading-tight text-ink-900 sm:text-2xl">
                {name}
              </h1>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                {tutor.campus?.name ? (
                  <CampusLocation campusName={tutor.campus.name} />
                ) : null}
                {tutor.campus?.name ? (
                  <span className="text-ink-300" aria-hidden>
                    ·
                  </span>
                ) : null}
                <span className="text-sm text-ink-600">
                  {tutor.hourly_rate
                    ? `${formatEuro(tutor.hourly_rate)} / heure`
                    : "Tarif non renseigné"}
                </span>
              </div>
              {hasSlots ? (
                <p className="mt-1.5 text-xs font-medium text-success">
                  {slotCount} créneau{slotCount > 1 ? "x" : ""} disponible
                  {slotCount > 1 ? "s" : ""}
                  {tutor.next_available_slot_at
                    ? ` · Prochain : ${formatNextSlot(tutor.next_available_slot_at)}`
                    : null}
                </p>
              ) : (
                <p className="mt-1.5 text-xs font-medium text-warning">
                  Aucun créneau ouvert pour l&apos;instant
                </p>
              )}
            </div>
            {actions}
          </div>

          {showSubjects && tutor.subjects.length > 0 ? (
            <SubjectLine subjects={tutor.subjects} className="mt-3" />
          ) : null}
        </div>

        {includeAbout ? (
          <TutorPresentationSection
            tutor={tutor}
            collapsible
            embedded
            defaultOpen={aboutDefaultOpen}
          />
        ) : null}

        {includeCv ? (
          <TutorCvSection
            hasCvPdf={Boolean(tutor.has_cv_pdf)}
            cvPdfUrl={cvPdfUrl}
            cvText={tutor.cv}
            guestMode={cvGuestMode}
            collapsible
            embedded
            defaultOpen={cvDefaultOpen}
          />
        ) : null}
      </div>
    </header>
  );
}
