import { Button, Input, Label } from "@gadz-connect/ui";
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  useCreateSlot,
  useMySlots,
  useMyTutorProfile,
  useTutors,
  useUpdateTutorProfile,
} from "@/features/marketplace/useTutors";

function formatSlotRange(starts: string, ends: string) {
  const start = new Date(starts);
  const end = new Date(ends);
  return `${start.toLocaleDateString("fr-FR")} ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

function TutorManagePanel() {
  const { data: profile } = useMyTutorProfile();
  const { data: slots } = useMySlots();
  const updateProfile = useUpdateTutorProfile();
  const createSlot = useCreateSlot();

  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [subjects, setSubjects] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");

  async function saveProfile() {
    await updateProfile.mutateAsync({
      bio: bio || profile?.bio || undefined,
      hourlyRate: rate ? Number(rate) : undefined,
      subjects: subjects
        ? subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
    });
  }

  async function addSlot() {
    if (!slotStart || !slotEnd) return;
    await createSlot.mutateAsync({
      startsAt: new Date(slotStart).toISOString(),
      endsAt: new Date(slotEnd).toISOString(),
    });
    setSlotStart("");
    setSlotEnd("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Mon profil tuteur</h3>
        <p className="mt-1 text-sm text-slate-600">
          Tarif actuel :{" "}
          {profile?.hourly_rate
            ? formatEuro(profile.hourly_rate)
            : "non défini"}
        </p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="bio">Présentation</Label>
            <textarea
              id="bio"
              className="min-h-[80px] w-full rounded-md border border-slate-200 p-2 text-sm"
              placeholder={profile?.bio ?? "Décrivez vos compétences…"}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rate">Tarif horaire (€)</Label>
            <Input
              id="rate"
              type="number"
              min={1}
              step={0.5}
              placeholder={profile?.hourly_rate?.toString() ?? "40"}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="subjects">Matières (séparées par des virgules)</Label>
            <Input
              id="subjects"
              placeholder={
                profile?.subjects?.join(", ") ?? "Maths, Physique, SolidWorks"
              }
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={updateProfile.isPending}
            onClick={() => void saveProfile()}
          >
            Enregistrer le profil
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Mes créneaux</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="slotStart">Début</Label>
            <Input
              id="slotStart"
              type="datetime-local"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slotEnd">Fin</Label>
            <Input
              id="slotEnd"
              type="datetime-local"
              value={slotEnd}
              onChange={(e) => setSlotEnd(e.target.value)}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="mt-3"
          disabled={createSlot.isPending}
          onClick={() => void addSlot()}
        >
          Ajouter un créneau
        </Button>
        <ul className="mt-4 space-y-2 text-sm">
          {slots?.length ? (
            slots.map((slot) => (
              <li
                key={slot.id}
                className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <span>{formatSlotRange(slot.starts_at, slot.ends_at)}</span>
                <span
                  className={
                    slot.booked ? "text-amber-700" : "text-green-700"
                  }
                >
                  {slot.booked ? "Réservé" : "Libre"}
                </span>
              </li>
            ))
          ) : (
            <li className="text-slate-500">Aucun créneau publié.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function TutorList() {
  const { data: tutors, isLoading } = useTutors();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  if (!tutors?.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        Aucun tuteur disponible sur votre campus pour le moment.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tutors.map((tutor) => {
        const name = `${tutor.first_name} ${tutor.last_name}`.trim();
        return (
          <Link
            key={tutor.id}
            to={`/app/cours/${tutor.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <p className="font-semibold text-slate-900">{name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {tutor.hourly_rate
                ? `${formatEuro(tutor.hourly_rate)} / h`
                : "Tarif à définir"}
            </p>
            {tutor.subjects.length > 0 ? (
              <p className="mt-2 text-xs text-indigo-600">
                {tutor.subjects.slice(0, 3).join(" · ")}
              </p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export function ProviderCoursesPage() {
  const { data: me } = useMyProfile();
  const student = me ? isStudent(me.role) : false;
  const tutorActive = me?.account_status === "active";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {student ? "Tutorat" : "Mes cours"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {student
            ? "Choisissez un tuteur et réservez un créneau sur votre campus."
            : tutorActive
              ? "Gérez votre profil tuteur et vos créneaux."
              : "Validez votre micro-entreprise (SIRET) pour proposer des cours."}
        </p>
      </div>

      {student ? (
        <section className="space-y-4">
          <h3 className="font-semibold text-slate-900">Tuteurs du campus</h3>
          <TutorList />
        </section>
      ) : tutorActive ? (
        <>
          <TutorManagePanel />
          <section className="space-y-4">
            <h3 className="font-semibold text-slate-900">
              Autres tuteurs du campus
            </h3>
            <TutorList />
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Complétez votre onboarding micro-entreprise et attendez la validation
          de votre SIRET pour publier des créneaux.
        </section>
      )}
    </div>
  );
}
