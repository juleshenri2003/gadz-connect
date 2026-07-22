import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  cn,
} from "@gadz-connect/ui";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Modal } from "@/components/Modal";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import {
  MarketplaceVisibilityPill,
  TeacherMarketplaceVisibility,
} from "@/features/dashboard/teacher-cockpit/TeacherMarketplaceVisibility";
import { getFutureSlots } from "@/features/dashboard/teacher-cockpit/teacherCockpitUtils";
import { TutorList } from "@/features/marketplace/TutorList";
import { countBookableTutors } from "@/features/marketplace/marketplaceUtils";
import { useTutors } from "@/features/marketplace/useTutors";
import {
  parseCoursesTab,
  type CoursesTab,
} from "@/features/marketplace/teacherCoursesTab";
import {
  useCreateSlot,
  useDeleteSlot,
  useMySlots,
  useMyTutorProfile,
  type TutorSlot,
} from "@/features/marketplace/useTutors";
import { TeacherPublicProfileForm } from "@/features/profile/TeacherPublicProfileForm";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import { useCoursesToDocument } from "@/features/repository/useRepository";
import {
  getPastCourseEvents,
  needsAttendanceConfirm,
  PastCoursesPanel,
} from "@/features/scheduling/PastCoursesPanel";
import { useMySchedule } from "@/features/scheduling/useSchedule";

const TAB_ITEMS: { id: CoursesTab; label: string }[] = [
  { id: "slots", label: "Créneaux" },
  { id: "profile", label: "Publication" },
  { id: "history", label: "Cours passés" },
];

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatSlotRange(starts: string, ends: string) {
  const start = new Date(starts);
  const end = new Date(ends);
  return `${start.toLocaleDateString("fr-FR")} ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

function splitSlots(slots: TutorSlot[] | undefined) {
  const now = Date.now();
  const upcoming = (slots ?? [])
    .filter((s) => new Date(s.starts_at).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const past = (slots ?? [])
    .filter((s) => new Date(s.starts_at).getTime() <= now)
    .sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
    );
  return { upcoming, past };
}

function slotClientLabel(slot: TutorSlot): string | null {
  if (!slot.booked || !slot.client) return null;
  return `${slot.client.first_name} ${slot.client.last_name}`.trim();
}

function SlotStatusBadge({ slot }: { slot: TutorSlot }) {
  const client = slotClientLabel(slot);
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        slot.booked
          ? "bg-warning-bg text-warning"
          : "bg-success-bg text-success",
      )}
    >
      {slot.booked ? (client ? `Réservé — ${client}` : "Réservé") : "Libre"}
    </span>
  );
}

function SlotListItem({
  slot,
  onDelete,
  deleting,
}: {
  slot: TutorSlot;
  onDelete?: (slot: TutorSlot) => void;
  deleting?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 text-sm">
      <span>{formatSlotRange(slot.starts_at, slot.ends_at)}</span>
      <div className="flex flex-wrap items-center gap-2">
        <SlotStatusBadge slot={slot} />
        {!slot.booked && onDelete ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-ink-600 hover:text-danger"
            disabled={deleting}
            onClick={() => onDelete(slot)}
          >
            {deleting ? "…" : "Retirer"}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

interface TeacherSlotsPanelProps {
  onSwitchToProfile?: () => void;
}

function TeacherSlotsPanel({ onSwitchToProfile }: TeacherSlotsPanelProps) {
  const { data: slots, isLoading } = useMySlots();
  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotError, setSlotError] = useState<string | null>(null);
  const [slotSuccess, setSlotSuccess] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TutorSlot | null>(null);

  const { upcoming, past } = useMemo(() => splitSlots(slots), [slots]);
  const visiblePast = showPast ? past : past.slice(0, 5);

  function applyDuration(hours: number) {
    setSlotError(null);
    if (!slotStart) {
      setSlotError("Indiquez d'abord le début du créneau.");
      return;
    }
    const start = new Date(slotStart);
    setSlotEnd(toDatetimeLocalValue(new Date(start.getTime() + hours * 60 * 60 * 1000)));
  }

  async function addSlot() {
    setSlotError(null);
    setSlotSuccess(false);
    if (!slotStart || !slotEnd) {
      setSlotError("Renseignez le début et la fin du créneau.");
      return;
    }
    const start = new Date(slotStart);
    const end = new Date(slotEnd);
    if (end <= start) {
      setSlotError("La fin doit être après le début.");
      return;
    }
    try {
      await createSlot.mutateAsync({
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      });
      setSlotStart("");
      setSlotEnd("");
      setSlotSuccess(true);
    } catch (err) {
      setSlotError((err as Error).message);
    }
  }

  async function confirmRemoveSlot() {
    if (!slotToDelete) return;
    setSlotError(null);
    setDeletingSlotId(slotToDelete.id);
    try {
      await deleteSlot.mutateAsync(slotToDelete.id);
      setSlotToDelete(null);
    } catch (err) {
      setSlotError((err as Error).message);
    } finally {
      setDeletingSlotId(null);
    }
  }

  return (
    <>
      <Card className="border-line">
        <CardHeader>
          <CardTitle className="text-base">Mes créneaux</CardTitle>
          <CardDescription>
            Publiez vos disponibilités — les élèves réservent depuis votre fiche
            tuteur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyDuration(1)}
            >
              Durée 1 h
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyDuration(2)}
            >
              Durée 2 h
            </Button>
          </div>
          {slotError ? (
            <p className="text-sm text-danger" role="alert">
              {slotError}
            </p>
          ) : null}
          {slotSuccess ? (
            <p className="text-sm text-success" role="status">
              Créneau publié — visible par les élèves de votre campus.
            </p>
          ) : null}
          <Button
            size="sm"
            disabled={createSlot.isPending}
            onClick={() => void addSlot()}
          >
            {createSlot.isPending ? "Publication…" : "Ajouter un créneau"}
          </Button>

          {isLoading ? (
            <p className="text-sm text-ink-400">Chargement des créneaux…</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  À venir ({upcoming.length})
                </p>
                {upcoming.length ? (
                  <ul className="space-y-2">
                    {upcoming.map((slot) => (
                      <SlotListItem
                        key={slot.id}
                        slot={slot}
                        onDelete={setSlotToDelete}
                        deleting={deletingSlotId === slot.id}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-400">
                    Aucun créneau à venir —{" "}
                    {onSwitchToProfile ? (
                      <button
                        type="button"
                        className="font-medium text-brand-700 underline"
                        onClick={onSwitchToProfile}
                      >
                        vérifiez aussi votre tarif
                      </button>
                    ) : (
                      "publiez-en un ci-dessus."
                    )}
                  </p>
                )}
              </div>

              {past.length > 0 ? (
                <details className="group rounded-lg border border-line bg-paper/50">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-ink-600">
                    Passés ({past.length})
                  </summary>
                  <ul className="space-y-2 px-3 pb-3">
                    {visiblePast.map((slot) => (
                      <SlotListItem
                        key={slot.id}
                        slot={slot}
                        onDelete={
                          !slot.booked ? setSlotToDelete : undefined
                        }
                        deleting={deletingSlotId === slot.id}
                      />
                    ))}
                  </ul>
                  {past.length > 5 && !showPast ? (
                    <div className="px-3 pb-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPast(true)}
                      >
                        Voir les {past.length - 5} autres
                      </Button>
                    </div>
                  ) : null}
                </details>
              ) : null}
            </>
          )}

          <p className="text-sm text-ink-600">
            <Link
              to="/app/planning"
              className="font-medium text-brand-700 hover:underline"
            >
              Voir dans mon emploi du temps →
            </Link>
          </p>
        </CardContent>
      </Card>

      <Modal
        open={slotToDelete != null}
        onClose={() => setSlotToDelete(null)}
        title="Retirer ce créneau ?"
        description="Il ne sera plus visible par les élèves. Cette action est définitive."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setSlotToDelete(null)}>
              Annuler
            </Button>
            <Button
              disabled={deleteSlot.isPending}
              onClick={() => void confirmRemoveSlot()}
            >
              {deleteSlot.isPending ? "Suppression…" : "Retirer"}
            </Button>
          </div>
        }
      >
        {slotToDelete ? (
          <p className="text-sm text-ink-600">
            {formatSlotRange(slotToDelete.starts_at, slotToDelete.ends_at)}
          </p>
        ) : null}
      </Modal>
    </>
  );
}

function TeacherCoursesHeaderStats() {
  const { slots } = useProviderProgress();
  const { data: tutorProfile } = useMyTutorProfile();
  const { data: coursesToDocument } = useCoursesToDocument();
  const futureCount = getFutureSlots(slots).length;
  const docCount = coursesToDocument?.length ?? 0;

  const parts: string[] = [];
  parts.push(
    `${futureCount} créneau${futureCount > 1 ? "x" : ""} à venir`,
  );
  if (docCount > 0) {
    parts.push(
      `${docCount} séance${docCount > 1 ? "s" : ""} à documenter`,
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <p
        className={cn(
          "text-sm font-medium",
          futureCount === 0 ? "text-warning" : "text-ink-600",
        )}
      >
        {parts.join(" · ")}
      </p>
      <MarketplaceVisibilityPill marketplace={tutorProfile?.marketplace} />
    </div>
  );
}

function InactiveTeacherBanner() {
  const { progress, nextHref } = useProviderProgress();
  const nextTask = progress?.tasks.find((t) => t.status !== "done");

  return (
    <section
      className="rounded-md border border-warning/20 bg-warning-bg p-6 text-sm text-warning"
      role="status"
    >
      <p className="font-medium">Compte non activé</p>
      <p className="mt-2">
        Complétez votre onboarding micro-entreprise et attendez la validation
        de votre SIRET pour publier des créneaux.
      </p>
      {nextTask ? (
        <p className="mt-2 text-warning">
          Prochaine étape : {nextTask.title}
          {progress
            ? ` (${progress.completedCount}/${progress.totalCount})`
            : ""}
        </p>
      ) : null}
      <Button className="mt-4" size="sm" asChild>
        <Link to={nextHref}>Compléter mon onboarding →</Link>
      </Button>
    </section>
  );
}

function OtherTutorsAccordion() {
  return (
    <details className="group rounded-md border border-line bg-surface">
      <summary className="cursor-pointer px-6 py-4 font-semibold text-ink-900">
        Voir les autres professeurs du campus
      </summary>
      <div className="border-t border-line px-6 pb-6 pt-4">
        <TutorList />
      </div>
    </details>
  );
}

function TeacherCoursesTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseCoursesTab(searchParams.get("tab"));
  const { data: me } = useMyProfile();
  const { data: coursesToDocument } = useCoursesToDocument();
  const { data: tutorProfile } = useMyTutorProfile();
  const { data: schedule } = useMySchedule({ includeCancelled: true });
  const docCount = coursesToDocument?.length ?? 0;
  const pastConfirmCount = getPastCourseEvents(schedule?.events).filter(
    needsAttendanceConfirm,
  ).length;
  const historyBadge = docCount + pastConfirmCount;

  function setActiveTab(tab: CoursesTab) {
    setSearchParams({ tab }, { replace: true });
  }

  return (
    <div className="space-y-6">
      <nav
        className="flex flex-wrap gap-1 rounded-lg border border-line bg-paper p-1"
        aria-label="Sections Mes cours"
      >
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition",
              activeTab === tab.id
                ? "bg-surface text-ink-900 shadow-surface"
                : "text-ink-600 hover:text-ink-900",
            )}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "history" && historyBadge > 0 ? (
              <span className="rounded-full bg-warning-bg px-1.5 py-0.5 text-xs font-semibold text-warning">
                {historyBadge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <TeacherMarketplaceVisibility
        marketplace={tutorProfile?.marketplace}
        onFixRate={() => setActiveTab("profile")}
        onFixSlots={() => setActiveTab("slots")}
      />

      {activeTab === "slots" ? (
        <TeacherSlotsPanel onSwitchToProfile={() => setActiveTab("profile")} />
      ) : null}
      {activeTab === "profile" && me ? (
        <TeacherPublicProfileForm profile={me} variant="courses-tab" />
      ) : null}
      {activeTab === "history" ? (
        <Card className="border-line">
          <CardContent className="pt-6">
            <PastCoursesPanel audience="teacher" />
          </CardContent>
        </Card>
      ) : null}

      <OtherTutorsAccordion />
    </div>
  );
}

export function ProviderCoursesPage() {
  const { data: me } = useMyProfile();
  const { data: tutors } = useTutors();
  const student = me ? isStudent(me.role) : false;
  const tutorActive = me?.account_status === "active";
  const tutorTotal = tutors?.length ?? 0;
  const bookableCount = tutors ? countBookableTutors(tutors) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">
          {student ? "Trouver mon tuteur" : "Mes cours"}
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          {student
            ? "Professeurs validés de votre campus — réservez un créneau."
            : tutorActive
              ? "Gérez votre profil tuteur et vos créneaux."
              : "Validez votre micro-entreprise (SIRET) pour proposer des cours."}
        </p>
        {student && me?.campus?.name ? (
          <p className="mt-1 text-xs text-ink-400">Campus {me.campus.name}</p>
        ) : null}
        {student && tutorTotal > 0 ? (
          <p className="mt-2 text-sm font-medium text-ink-600">
            {tutorTotal} professeur{tutorTotal > 1 ? "s" : ""}
            {bookableCount > 0
              ? ` · ${bookableCount} avec créneaux ouverts`
              : " · aucun créneau ouvert pour l'instant"}
          </p>
        ) : null}
        {!student && tutorActive && me?.campus?.name ? (
          <p className="mt-1 text-xs text-ink-400">Campus {me.campus.name}</p>
        ) : null}
        {!student && tutorActive ? <TeacherCoursesHeaderStats /> : null}
      </div>

      {student ? (
        <div className="space-y-6">
          <TutorList showFilters showGuideEmptyState />
          <PastCoursesPanel audience="student" collapsible />
        </div>
      ) : tutorActive ? (
        <TeacherCoursesTabs />
      ) : (
        <InactiveTeacherBanner />
      )}
    </div>
  );
}
