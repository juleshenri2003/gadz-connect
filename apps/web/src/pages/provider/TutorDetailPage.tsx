import { useMemo, useEffect, useState } from "react";
import { Button, Input, Label } from "@gadz-connect/ui";
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
} from "@/features/marketplace/marketplaceUtils";
import { TutorCvSection } from "@/features/marketplace/tutor-detail/TutorCvSection";
import { TutorPresentationSection } from "@/features/marketplace/tutor-detail/TutorPresentationSection";
import { TutorProfileHeader } from "@/features/marketplace/tutor-detail/TutorProfileHeader";
import { trackMarketplaceEvent } from "@/features/marketplace/marketplaceAnalytics";
import {
  useBookSlot,
  useConfirmBookingPayment,
  useTutor,
  useTutorSlots,
  type TutorSlot,
} from "@/features/marketplace/useTutors";
import { BookingPaymentForm } from "@/features/stripe/BookingPaymentForm";
import { useStripeConfig } from "@/features/stripe/useStripeConfig";

const SUBJECT_OTHER = "__other__";

export function TutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialSlotId = searchParams.get("slot");

  useEffect(() => {
    if (id) markTutorProfileViewed();
  }, [id]);

  const { data: tutor, isLoading } = useTutor(id ?? "");
  const { data: slots } = useTutorSlots(id ?? "");
  const { data: cvPdfUrl } = useTutorCvPdfUrl(id ?? "", Boolean(tutor?.has_cv_pdf));
  const bookSlot = useBookSlot();
  const confirmPayment = useConfirmBookingPayment();
  const { data: stripeConfig } = useStripeConfig();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
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
  } | null>(null);

  const selectedSlotData = useMemo(
    () => slots?.find((slot) => slot.id === selectedSlot),
    [slots, selectedSlot],
  );

  const estimatedPrice = useMemo(() => {
    if (!tutor?.hourly_rate || !selectedSlotData) return null;
    return computeSlotPrice(
      tutor.hourly_rate,
      selectedSlotData.starts_at,
      selectedSlotData.ends_at,
    );
  }, [tutor?.hourly_rate, selectedSlotData]);

  const resolvedSubject = useMemo(() => {
    if (selectedSubject === SUBJECT_OTHER) {
      return customSubject.trim();
    }
    return selectedSubject.trim();
  }, [selectedSubject, customSubject]);

  const canConfirmBooking =
    Boolean(selectedSlot) &&
    Boolean(tutor?.hourly_rate) &&
    resolvedSubject.length > 0;

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

  async function handleBook() {
    if (!selectedSlot || !resolvedSubject) return;
    setBookingError(null);
    try {
      const result = await bookSlot.mutateAsync({
        slotId: selectedSlot,
        subject: resolvedSubject,
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
            Montant : {formatEuro(booked.amountGross)}
          </p>
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
        ) : !slots?.length ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-ink-600">
              Aucun créneau ouvert pour l&apos;instant. Revenez plus tard ou
              consultez un autre professeur.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to={marketplaceRoutes.list("app")}>
                Retour à la liste des tuteurs
              </Link>
            </Button>
          </div>
        ) : (
          <>
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
              {slots.map((slot) => (
                <SlotOption
                  key={slot.id}
                  slot={slot}
                  hourlyRate={tutor.hourly_rate!}
                  selected={selectedSlot === slot.id}
                  onSelect={() => setSelectedSlot(slot.id)}
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
        {slots?.length ? (
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
              : estimatedPrice != null
                ? `Réserver — ${formatEuro(estimatedPrice)}`
                : "Réserver ce créneau"}
          </Button>
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
                {estimatedPrice != null ? formatEuro(estimatedPrice) : "—"}
              </dd>
            </div>
            <p className="text-xs text-ink-400">
              {stripeConfig?.configured
                ? "Le paiement par carte sera demandé à la confirmation."
                : "Sans Stripe configuré, la réservation est enregistrée sans débit carte."}
            </p>
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
        description="Réglez votre cours pour confirmer la réservation."
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
}

function SlotOption({ slot, hourlyRate, selected, onSelect }: SlotOptionProps) {
  const price = computeSlotPrice(hourlyRate, slot.starts_at, slot.ends_at);

  return (
    <li>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 hover:bg-paper has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50/50">
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="slot"
            value={slot.id}
            checked={selected}
            onChange={onSelect}
          />
          <span className="text-sm">
            {formatSlotRange(slot.starts_at, slot.ends_at)}
          </span>
        </div>
        <span className="text-sm font-medium text-ink-600">
          {formatEuro(price)}
        </span>
      </label>
    </li>
  );
}
