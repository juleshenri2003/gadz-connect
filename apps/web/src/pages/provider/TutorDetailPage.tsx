import { useMemo, useEffect, useState } from "react";
import { Button, Input, Label, cn } from "@gadz-connect/ui";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Modal } from "@/components/Modal";
import { markTutorProfileViewed } from "@/features/dashboard/studentDashboardTasks";
import { formatEuro } from "@/features/admin/format";
import { useTutorCvPdfUrl } from "@/features/cv/useCvPdf";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import {
  computeSlotPrice,
  formatSlotDuration,
  formatSlotRange,
  isTrialSlotDuration,
} from "@/features/marketplace/marketplaceUtils";
import { useTutorTrialEligibility } from "@/features/onboarding/useStudentLearningProfile";
import { TutorCvSection } from "@/features/marketplace/tutor-detail/TutorCvSection";
import { TutorPresentationSection } from "@/features/marketplace/tutor-detail/TutorPresentationSection";
import { TutorProfileLinks } from "@/features/profile/TutorProfileLinks";
import { TutorProfileHeader } from "@/features/marketplace/tutor-detail/TutorProfileHeader";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";
import {
  useBookSlot,
  useConfirmBookingPayment,
  useTutor,
  useTutorSlots,
  type TutorSlot,
} from "@/features/marketplace/useTutors";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { BookingPaymentForm } from "@/features/stripe/BookingPaymentForm";
import { useStripeConfig } from "@/features/stripe/useStripeConfig";
import { useUrssafStatus } from "@/features/urssaf/useUrssaf";

const SUBJECT_OTHER = "__other__";

type BookingMode = "standard" | "trial";

export function TutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialSlotId = searchParams.get("slot");

  useEffect(() => {
    if (id) markTutorProfileViewed();
  }, [id]);

  const { data: tutor, isLoading } = useTutor(id ?? "");
  const { data: slots } = useTutorSlots(id ?? "");
  const { data: trialEligibility } = useTutorTrialEligibility(id);
  const { data: profile } = useMyProfile();
  const { data: cvPdfUrl } = useTutorCvPdfUrl(id ?? "", Boolean(tutor?.has_cv_pdf));
  const bookSlot = useBookSlot();
  const confirmPayment = useConfirmBookingPayment();
  const { data: stripeConfig } = useStripeConfig();
  const { data: urssafStatus } = useUrssafStatus();
  const [bookingMode, setBookingMode] = useState<BookingMode>("standard");
  const [isHomeVisit, setIsHomeVisit] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [parentPays, setParentPays] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(
    null,
  );
  const [pendingBooking, setPendingBooking] = useState<{
    courseId: string;
    subject: string;
    amountGross: number;
    netPayout: number;
    scheduledAt: string;
    endsAt: string;
  } | null>(null);
  const [booked, setBooked] = useState<{
    subject: string;
    amountGross: number;
    netPayout: number;
    scheduledAt: string;
    endsAt: string;
    tutorName: string;
    paymentMethod?: "stripe" | "urssaf";
    parentChargeEstimate?: number;
  } | null>(null);

  useEffect(() => {
    if (trialEligibility && !trialEligibility.eligible && bookingMode === "trial") {
      setBookingMode("standard");
    }
  }, [trialEligibility, bookingMode]);

  const visibleSlots = useMemo(() => {
    if (!slots) return [];
    if (bookingMode === "trial") {
      return slots.filter((slot) =>
        isTrialSlotDuration(slot.starts_at, slot.ends_at),
      );
    }
    return slots;
  }, [slots, bookingMode]);

  const selectedSlotData = useMemo(
    () => visibleSlots.find((slot) => slot.id === selectedSlot),
    [visibleSlots, selectedSlot],
  );

  const estimatedPrice = useMemo(() => {
    if (bookingMode === "trial") return 0;
    if (!tutor?.hourly_rate || !selectedSlotData) return null;
    return computeSlotPrice(
      tutor.hourly_rate,
      selectedSlotData.starts_at,
      selectedSlotData.ends_at,
    );
  }, [bookingMode, tutor?.hourly_rate, selectedSlotData]);

  const resolvedSubject = useMemo(() => {
    if (selectedSubject === SUBJECT_OTHER) {
      return customSubject.trim();
    }
    return selectedSubject.trim();
  }, [selectedSubject, customSubject]);

  const declaredParents = profile?.parents ?? [];

  useEffect(() => {
    const parents = profile?.parents ?? [];
    if (parents.length === 0) {
      setSelectedParentId("");
      return;
    }
    setSelectedParentId((current) =>
      parents.some((p) => p.id === current) ? current : (parents[0]?.id ?? ""),
    );
  }, [profile?.parents]);

  const canConfirmBooking =
    Boolean(selectedSlot) &&
    (bookingMode === "trial" || Boolean(tutor?.hourly_rate)) &&
    resolvedSubject.length > 0 &&
    (!parentPays || Boolean(selectedParentId));

  useEffect(() => {
    if (
      selectedSlot &&
      !visibleSlots.some((slot) => slot.id === selectedSlot)
    ) {
      setSelectedSlot(null);
    }
  }, [selectedSlot, visibleSlots]);

  useEffect(() => {
    if (visibleSlots.length === 1 && !selectedSlot) {
      setSelectedSlot(visibleSlots[0]!.id);
    }
  }, [visibleSlots, selectedSlot]);

  useEffect(() => {
    if (tutor?.subjects.length) {
      setSelectedSubject(tutor.subjects[0] ?? "");
    } else if (tutor) {
      setSelectedSubject(SUBJECT_OTHER);
    }
  }, [tutor?.id, tutor?.subjects]);

  useEffect(() => {
    if (initialSlotId && slots?.some((s) => s.id === initialSlotId)) {
      setSelectedSlot(initialSlotId);
      setConfirmOpen(true);
    }
  }, [initialSlotId, slots]);

  const canUseUrssaf =
    bookingMode === "standard" &&
    isHomeVisit &&
    urssafStatus?.status === "actif" &&
    urssafStatus.operational;

  async function handleBook() {
    if (!selectedSlot || !resolvedSubject) return;
    if (parentPays && !selectedParentId) {
      setBookingError("Choisissez un parent payeur ou ajoutez-en un dans Mon profil.");
      return;
    }
    setBookingError(null);
    try {
      const result = await bookSlot.mutateAsync({
        slotId: selectedSlot,
        subject: resolvedSubject,
        payerParentId: parentPays ? selectedParentId : undefined,
        sessionType: bookingMode,
        isHomeVisit: bookingMode === "standard" ? isHomeVisit : false,
      });

      if (
        result.requiresPayment &&
        result.clientSecret &&
        stripeConfig?.configured &&
        stripeConfig.publishableKey
      ) {
        setPendingBooking({
          courseId: result.courseId,
          subject: result.subject,
          amountGross: result.amountGross,
          netPayout: result.netPayout,
          scheduledAt: result.scheduledAt,
          endsAt: result.endsAt,
        });
        setPaymentClientSecret(result.clientSecret);
        setConfirmOpen(false);
        return;
      }

      showBookingSuccess(result);
      trackMarketplaceEvent("booking_complete", { tutorId: id ?? "" });
    } catch (err) {
      setBookingError(
        err instanceof Error ? err.message : "Réservation impossible",
      );
      setConfirmOpen(false);
    }
  }

  function showBookingSuccess(result: {
    subject: string;
    amountGross: number;
    netPayout: number;
    scheduledAt: string;
    endsAt: string;
    paymentMethod?: "stripe" | "urssaf";
    parentChargeEstimate?: number;
  }) {
    const name = tutor
      ? `${tutor.first_name} ${tutor.last_name}`.trim()
      : "Votre tuteur";
    setBooked({
      subject: result.subject,
      amountGross: result.amountGross,
      netPayout: result.netPayout,
      scheduledAt: result.scheduledAt,
      endsAt: result.endsAt,
      tutorName: name,
      paymentMethod: result.paymentMethod,
      parentChargeEstimate: result.parentChargeEstimate,
    });
    setConfirmOpen(false);
    setPaymentClientSecret(null);
    setPendingBooking(null);
  }

  async function handlePaymentSuccess() {
    if (!pendingBooking) return;
    try {
      await confirmPayment.mutateAsync(pendingBooking.courseId);
      showBookingSuccess(pendingBooking);
      trackMarketplaceEvent("booking_complete", { tutorId: id ?? "" });
    } catch (err) {
      setBookingError(
        err instanceof Error
          ? err.message
          : "Paiement reçu mais confirmation impossible — réessayez dans quelques instants.",
      );
      setPaymentClientSecret(null);
      setPendingBooking(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-ink-400">Chargement…</p>;
  }

  if (!tutor) {
    return (
      <p className="text-sm text-danger">
        Tuteur introuvable.{" "}
        <Link to={marketplaceRoutes.list("app")} className="underline">
          Retour
        </Link>
      </p>
    );
  }

  const name = `${tutor.first_name} ${tutor.last_name}`.trim();

  if (booked) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border border-success/20 bg-success-bg p-6">
          <h2 className="text-lg font-semibold text-success">
            Réservation confirmée
          </h2>
          <p className="mt-2 text-sm text-success">
            Avec {booked.tutorName}
          </p>
          <p className="mt-1 text-sm text-success">
            {booked.subject} —{" "}
            {new Date(booked.scheduledAt).toLocaleString("fr-FR")}
            {booked.endsAt
              ? ` (${formatSlotDuration(booked.scheduledAt, booked.endsAt)})`
              : ""}
          </p>
          <p className="mt-2 text-sm text-success">
            Montant :{" "}
            {booked.amountGross > 0
              ? booked.paymentMethod === "urssaf" && booked.parentChargeEstimate != null
                ? `${formatEuro(booked.parentChargeEstimate)} après le cours (avance immédiate 50 %)`
                : formatEuro(booked.amountGross)
              : "Séance d'essai gratuite"}
          </p>
          {booked.paymentMethod === "urssaf" ? (
            <p className="mt-2 text-sm text-success">
              Paiement différé : l&apos;URSSAF prélèvera environ 50 % après la
              réalisation du cours au domicile.
            </p>
          ) : null}
          <p className="mt-2 text-sm text-success">
            Votre cours apparaît dans votre emploi du temps.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app/planning">Voir mon emploi du temps →</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={marketplaceRoutes.list("app")}>Retour aux tuteurs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TutorProfileHeader
        tutor={tutor}
        backHref={marketplaceRoutes.list("app")}
        backLabel="← Tous les tuteurs"
      />

      <TutorPresentationSection tutor={tutor} />

      {(tutor.profile_links?.length ?? 0) > 0 ? (
        <section className="rounded-md border border-line bg-surface p-6">
          <h2 className="font-semibold text-ink-900">Liens</h2>
          <TutorProfileLinks links={tutor.profile_links} className="mt-3" />
        </section>
      ) : null}

      <TutorCvSection
        hasCvPdf={tutor.has_cv_pdf}
        cvPdfUrl={cvPdfUrl}
        cvText={tutor.cv}
      />

      <section className="rounded-md border border-line bg-surface p-6">
        <h3 className="font-semibold text-ink-900">Créneaux disponibles</h3>
        {!tutor.hourly_rate ? (
          <p className="mt-2 text-sm text-warning">
            Ce tuteur n&apos;a pas encore défini de tarif.
          </p>
        ) : !visibleSlots.length ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-ink-600">
              {bookingMode === "trial"
                ? "Aucun créneau d'une heure ou moins pour une séance d'essai. Choisissez un cours payant ou un autre professeur."
                : "Aucun créneau ouvert pour l'instant. Revenez plus tard ou consultez un autre professeur."}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to={marketplaceRoutes.list("app")}>
                Retour à la liste des tuteurs
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {trialEligibility?.eligible ? (
              <div className="mt-4 space-y-3 rounded-lg border border-brand-100 bg-brand-50/50 p-4">
                <p className="text-sm font-medium text-ink-900">
                  Première séance offerte avec ce tuteur
                </p>
                <p className="text-xs text-ink-600">
                  Réservez une séance d&apos;essai gratuite (1 h max) pour faire
                  connaissance, sans engagement.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={bookingMode === "trial" ? "default" : "outline"}
                    onClick={() => setBookingMode("trial")}
                  >
                    Séance d&apos;essai gratuite
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={bookingMode === "standard" ? "default" : "outline"}
                    onClick={() => setBookingMode("standard")}
                  >
                    Cours payant
                  </Button>
                </div>
              </div>
            ) : trialEligibility && !trialEligibility.eligible ? (
              <p className="mt-4 text-xs text-ink-500">
                {trialEligibility.reason ??
                  "Séance d'essai déjà utilisée avec ce tuteur — réservation au tarif habituel."}
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              <Label htmlFor="booking-subject">Matière ou objet du cours</Label>
              {tutor.subjects.length > 0 ? (
                <select
                  id="booking-subject"
                  className="flex h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                >
                  {tutor.subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                  <option value={SUBJECT_OTHER}>Autre</option>
                </select>
              ) : (
                <Input
                  id="booking-subject"
                  placeholder="Ex. Mécanique, Thermodynamique…"
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                />
              )}
              {selectedSubject === SUBJECT_OTHER ? (
                <Input
                  placeholder="Précisez la matière ou le sujet"
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                />
              ) : null}
            </div>

            <ul className="mt-4 space-y-2">
              {visibleSlots.map((slot) => (
                <SlotOption
                  key={slot.id}
                  slot={slot}
                  hourlyRate={tutor.hourly_rate!}
                  selected={selectedSlot === slot.id}
                  onSelect={() => setSelectedSlot(slot.id)}
                  isTrial={bookingMode === "trial"}
                />
              ))}
            </ul>
          </>
        )}
        {bookSlot.error ? (
          <p className="mt-3 text-sm text-danger">
            {(bookSlot.error as Error).message}
          </p>
        ) : bookingError ? (
          <p className="mt-3 text-sm text-danger">{bookingError}</p>
        ) : null}
        {visibleSlots.length ? (
          <Button
            className="mt-4"
            disabled={!canConfirmBooking || bookSlot.isPending}
            onClick={() => {
              setBookingError(null);
              setConfirmOpen(true);
            }}
          >
            {bookSlot.isPending
              ? "Réservation…"
              : bookingMode === "trial"
                ? "Réserver la séance d'essai gratuite"
                : estimatedPrice != null
                  ? `Réserver — ${formatEuro(estimatedPrice)}`
                  : "Réserver ce créneau"}
          </Button>
        ) : null}
        {visibleSlots.length && !selectedSlot ? (
          <p className="mt-2 text-xs text-ink-500">
            Sélectionnez un créneau ci-dessus pour continuer.
          </p>
        ) : null}
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setBookingError(null);
        }}
        title="Confirmer la réservation"
        description="Vérifiez les détails avant de valider."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={bookSlot.isPending || !canConfirmBooking}
              onClick={() => void handleBook()}
            >
              {bookSlot.isPending ? "Réservation…" : "Confirmer"}
            </Button>
          </div>
        }
      >
        {selectedSlotData ? (
          <dl className="space-y-3 text-sm text-ink-600">
            <div>
              <dt className="font-medium text-ink-900">Professeur</dt>
              <dd>{name}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">Créneau</dt>
              <dd>
                {formatSlotRange(
                  selectedSlotData.starts_at,
                  selectedSlotData.ends_at,
                )}{" "}
                ({formatSlotDuration(selectedSlotData.starts_at, selectedSlotData.ends_at)})
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">Matière</dt>
              <dd>{resolvedSubject || "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">Montant estimé</dt>
              <dd>
                {bookingMode === "trial"
                  ? "Gratuit (séance d'essai)"
                  : estimatedPrice != null
                    ? formatEuro(estimatedPrice)
                    : "—"}
              </dd>
            </div>
            {bookingMode === "standard" ? (
              <div className="space-y-2 border-t border-line pt-3">
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={isHomeVisit}
                    onChange={(event) => setIsHomeVisit(event.target.checked)}
                  />
                  Cours en présentiel au domicile de l&apos;élève
                </label>
                {isHomeVisit && urssafStatus?.status === "actif" ? (
                  <p className="text-xs text-success">
                    Avance immédiate active — vous ne paierez qu&apos;environ 50 %
                    après le cours (prélèvement URSSAF).
                  </p>
                ) : isHomeVisit && urssafStatus?.operational ? (
                  <p className="text-xs text-ink-500">
                    Activez l&apos;avance immédiate dans Mes factures pour payer
                    50 % au lieu de 100 % maintenant.
                  </p>
                ) : null}
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={parentPays}
                    onChange={(event) => setParentPays(event.target.checked)}
                  />
                  Un parent paie pour moi
                </label>
                {parentPays ? (
                  <div className="space-y-2">
                    {declaredParents.length > 0 ? (
                      <div className="space-y-1">
                        <Label htmlFor="booking-parent">Parent facturé</Label>
                        <select
                          id="booking-parent"
                          className="flex h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
                          value={selectedParentId}
                          onChange={(event) =>
                            setSelectedParentId(event.target.value)
                          }
                        >
                          {declaredParents.map((parent) => (
                            <option key={parent.id} value={parent.id}>
                              {parent.first_name} {parent.last_name} (
                              {parent.email})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-ink-400">
                          Le cours reste à votre nom ; ce parent apparaîtra comme
                          payeur sur la facture.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-ink-500">
                        Aucun parent déclaré.{" "}
                        <Link
                          to="/app/profil"
                          className="font-medium text-brand-700 underline"
                        >
                          Ajouter un parent dans Mon profil
                        </Link>
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            {bookingMode === "standard" ? (
              <p className="text-xs text-ink-400">
                {canUseUrssaf
                  ? "Pas de paiement maintenant — l'URSSAF prélèvera votre part après le cours."
                  : stripeConfig?.configured
                    ? "Paiement carte, Apple Pay ou Google Pay à la confirmation."
                    : "Sans Stripe configuré, la réservation est enregistrée sans débit carte."}
              </p>
            ) : (
              <p className="text-xs text-ink-400">
                Séance d&apos;essai sans paiement — pour faire connaissance avec
                votre tuteur.
              </p>
            )}
            {bookingError ? (
              <p className="text-sm text-danger">{bookingError}</p>
            ) : null}
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(paymentClientSecret && pendingBooking)}
        onClose={() => {
          setPaymentClientSecret(null);
          setPendingBooking(null);
        }}
        title="Paiement sécurisé"
        description="Carte, Apple Pay ou Google Pay — confirmez la réservation en un geste."
      >
        {paymentClientSecret &&
        pendingBooking &&
        stripeConfig?.publishableKey ? (
          <BookingPaymentForm
            publishableKey={stripeConfig.publishableKey}
            clientSecret={paymentClientSecret}
            amountLabel={formatEuro(pendingBooking.amountGross)}
            onSuccess={handlePaymentSuccess}
            onCancel={() => {
              setPaymentClientSecret(null);
              setPendingBooking(null);
              setConfirmOpen(false);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

interface SlotOptionProps {
  slot: TutorSlot;
  hourlyRate: number;
  selected: boolean;
  onSelect: () => void;
  isTrial?: boolean;
}

function SlotOption({
  slot,
  hourlyRate,
  selected,
  onSelect,
  isTrial,
}: SlotOptionProps) {
  const price = isTrial
    ? 0
    : computeSlotPrice(hourlyRate, slot.starts_at, slot.ends_at);

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition hover:bg-paper",
          selected
            ? "border-brand-600 bg-brand-50/50"
            : "border-line",
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
              selected
                ? "border-brand-600 bg-brand-600"
                : "border-ink-400 bg-surface",
            )}
            aria-hidden
          >
            {selected ? (
              <span className="h-1.5 w-1.5 rounded-full bg-surface" />
            ) : null}
          </span>
          <span className="text-sm">
            {formatSlotRange(slot.starts_at, slot.ends_at)}
          </span>
        </div>
        <span className="text-sm font-medium text-ink-600">
          {isTrial ? "Gratuit" : formatEuro(price)}
        </span>
      </button>
    </li>
  );
}
