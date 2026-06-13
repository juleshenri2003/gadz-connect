import { useEffect, useMemo, useState } from "react";
import { Button, Input, Label } from "@gadz-connect/ui";
import { Link, useParams } from "react-router-dom";
import { Modal } from "@/components/Modal";
import { markTutorProfileViewed } from "@/features/dashboard/studentDashboardTasks";
import { formatEuro } from "@/features/admin/format";
import { useTutorCvPdfUrl } from "@/features/cv/useCvPdf";
import {
  computeSlotPrice,
} from "@/features/marketplace/marketplaceUtils";
import {
  useBookSlot,
  useTutor,
  useTutorSlots,
  type TutorSlot,
} from "@/features/marketplace/useTutors";

const SUBJECT_OTHER = "__other__";

function formatSlotRange(starts: string, ends: string) {
  const start = new Date(starts);
  const end = new Date(ends);
  return `${start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatDuration(starts: string, ends: string): string {
  const minutes =
    (new Date(ends).getTime() - new Date(starts).getTime()) / (1000 * 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1).replace(".", ",")} h`;
}

export function TutorDetailPage() {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) markTutorProfileViewed();
  }, [id]);

  const { data: tutor, isLoading } = useTutor(id ?? "");
  const { data: slots } = useTutorSlots(id ?? "");
  const { data: cvPdfUrl } = useTutorCvPdfUrl(id ?? "", Boolean(tutor?.has_cv_pdf));
  const bookSlot = useBookSlot();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    if (!tutor) return;
    if (tutor.subjects.length > 0) {
      setSelectedSubject(tutor.subjects[0] ?? "");
    } else {
      setSelectedSubject(SUBJECT_OTHER);
    }
  }, [tutor?.id, tutor?.subjects]);

  async function handleBook() {
    if (!selectedSlot || !resolvedSubject) return;
    const result = await bookSlot.mutateAsync({
      slotId: selectedSlot,
      subject: resolvedSubject,
    });
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
  }

  if (isLoading) {
    return <p className="text-sm text-ink-400">Chargement…</p>;
  }

  if (!tutor) {
    return (
      <p className="text-sm text-danger">
        Tuteur introuvable.{" "}
        <Link to="/app/cours" className="underline">
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
              ? ` (${formatDuration(booked.scheduledAt, booked.endsAt)})`
              : ""}
          </p>
          <p className="mt-2 text-sm text-success">
            Montant : {formatEuro(booked.amountGross)}
          </p>
          <p className="mt-2 text-sm text-success">
            Le paiement vous sera demandé prochainement via Stripe. Votre cours
            apparaît déjà dans votre emploi du temps.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app/planning">Voir mon emploi du temps →</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/cours">Retour aux tuteurs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/app/cours" className="text-sm text-ink-400 hover:text-ink-900">
          ← Tous les tuteurs
        </Link>
        <h2 className="mt-3 text-2xl font-bold text-ink-900">{name}</h2>
        <p className="mt-1 text-sm text-ink-600">
          {tutor.campus?.name} —{" "}
          {tutor.hourly_rate
            ? `${formatEuro(tutor.hourly_rate)} / heure`
            : "Tarif non renseigné"}
        </p>
      </div>

      <section className="rounded-md border border-line bg-surface p-6">
        <h3 className="font-semibold text-ink-900">Présentation</h3>
        <p className="mt-2 text-sm text-ink-600">
          {tutor.bio ?? "Aucune description courte pour le moment."}
        </p>
        {tutor.subjects.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tutor.subjects.map((s) => (
              <span
                key={s}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-md border border-line bg-surface p-6">
        <h3 className="font-semibold text-ink-900">CV</h3>
        <p className="mt-1 text-xs text-ink-400">
          Parcours et compétences — consultez avant de réserver
        </p>
        {tutor.has_cv_pdf && cvPdfUrl ? (
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <a href={cvPdfUrl} target="_blank" rel="noopener noreferrer">
                Ouvrir le CV PDF →
              </a>
            </Button>
          </div>
        ) : null}
        {tutor.cv ? (
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
            {tutor.cv}
          </div>
        ) : !tutor.has_cv_pdf ? (
          <p className="mt-4 text-sm text-warning">
            Ce professeur n&apos;a pas encore renseigné de CV.
          </p>
        ) : null}
      </section>

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
              <Link to="/app/cours">Retour à la liste des tuteurs</Link>
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
        ) : null}
        {slots?.length ? (
          <Button
            className="mt-4"
            disabled={!canConfirmBooking || bookSlot.isPending}
            onClick={() => setConfirmOpen(true)}
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
        onClose={() => setConfirmOpen(false)}
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
                ({formatDuration(selectedSlotData.starts_at, selectedSlotData.ends_at)})
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
              Le paiement Stripe sera demandé ultérieurement. La réservation
              crée votre cours dans l&apos;emploi du temps.
            </p>
          </dl>
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
