import { Button } from "@gadz-connect/ui";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import {
  useBookSlot,
  useTutor,
  useTutorSlots,
} from "@/features/marketplace/useTutors";

function formatSlotRange(starts: string, ends: string) {
  const start = new Date(starts);
  const end = new Date(ends);
  return `${start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function TutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tutor, isLoading } = useTutor(id ?? "");
  const { data: slots } = useTutorSlots(id ?? "");
  const bookSlot = useBookSlot();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState<{
    subject: string;
    amountGross: number;
    netPayout: number;
    scheduledAt: string;
  } | null>(null);

  async function handleBook() {
    if (!selectedSlot) return;
    const result = await bookSlot.mutateAsync({ slotId: selectedSlot });
    setBooked({
      subject: result.subject,
      amountGross: result.amountGross,
      netPayout: result.netPayout,
      scheduledAt: result.scheduledAt,
    });
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  if (!tutor) {
    return (
      <p className="text-sm text-red-600">
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
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-lg font-semibold text-green-900">
            Réservation confirmée
          </h2>
          <p className="mt-2 text-sm text-green-800">
            {booked.subject} —{" "}
            {new Date(booked.scheduledAt).toLocaleString("fr-FR")}
          </p>
          <p className="mt-2 text-sm text-green-800">
            Montant : {formatEuro(booked.amountGross)} (paiement Stripe à
            venir)
          </p>
        </div>
        <Button asChild>
          <Link to="/app/cours">Retour aux tuteurs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/app/cours" className="text-sm text-slate-500 hover:text-slate-900">
          ← Tous les tuteurs
        </Link>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">{name}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {tutor.campus?.name} —{" "}
          {tutor.hourly_rate
            ? `${formatEuro(tutor.hourly_rate)} / heure`
            : "Tarif non renseigné"}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Profil</h3>
        <p className="mt-2 text-sm text-slate-600">
          {tutor.bio ?? "Aucune description pour le moment."}
        </p>
        {tutor.subjects.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tutor.subjects.map((s) => (
              <span
                key={s}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Créneaux disponibles</h3>
        {!tutor.hourly_rate ? (
          <p className="mt-2 text-sm text-amber-700">
            Ce tuteur n&apos;a pas encore défini de tarif.
          </p>
        ) : !slots?.length ? (
          <p className="mt-2 text-sm text-slate-500">Aucun créneau pour l&apos;instant.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {slots.map((slot) => (
              <li key={slot.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/50">
                  <input
                    type="radio"
                    name="slot"
                    value={slot.id}
                    checked={selectedSlot === slot.id}
                    onChange={() => setSelectedSlot(slot.id)}
                  />
                  <span className="text-sm">
                    {formatSlotRange(slot.starts_at, slot.ends_at)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {bookSlot.error ? (
          <p className="mt-3 text-sm text-red-600">
            {(bookSlot.error as Error).message}
          </p>
        ) : null}
        <Button
          className="mt-4"
          disabled={!selectedSlot || bookSlot.isPending || !tutor.hourly_rate}
          onClick={() => void handleBook()}
        >
          {bookSlot.isPending ? "Réservation…" : "Réserver ce créneau"}
        </Button>
      </section>
    </div>
  );
}
