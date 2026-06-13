import { Link } from "react-router-dom";
import { Button, Input, Label } from "@gadz-connect/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCreateSlot } from "@/features/marketplace/useTutors";

interface TeacherSlotQuickPublishProps {
  embedded?: boolean;
}

export function TeacherSlotQuickPublish({
  embedded = false,
}: TeacherSlotQuickPublishProps) {
  const createSlot = useCreateSlot();
  const queryClient = useQueryClient();
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!slotStart || !slotEnd) {
      setError("Renseignez le début et la fin du créneau.");
      return;
    }
    try {
      await createSlot.mutateAsync({
        startsAt: new Date(slotStart).toISOString(),
        endsAt: new Date(slotEnd).toISOString(),
      });
      setSlotStart("");
      setSlotEnd("");
      void queryClient.invalidateQueries({ queryKey: ["schedule-me"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-financial"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-transactions"] });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const form = (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={embedded ? "planning-slot-start" : "cockpit-slot-start"}>
            Début
          </Label>
          <Input
            id={embedded ? "planning-slot-start" : "cockpit-slot-start"}
            type="datetime-local"
            value={slotStart}
            onChange={(e) => setSlotStart(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={embedded ? "planning-slot-end" : "cockpit-slot-end"}>
            Fin
          </Label>
          <Input
            id={embedded ? "planning-slot-end" : "cockpit-slot-end"}
            type="datetime-local"
            value={slotEnd}
            onChange={(e) => setSlotEnd(e.target.value)}
          />
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-danger">{error}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={createSlot.isPending}
          onClick={() => void handleSubmit()}
        >
          {createSlot.isPending ? "Publication…" : "Publier"}
        </Button>
        {!embedded ? (
          <Button size="sm" variant="outline" asChild>
            <Link to="/app/cours">Mes cours →</Link>
          </Button>
        ) : null}
      </div>
    </>
  );

  if (embedded) {
    return (
      <section
        id="publier-creneau"
        className="scroll-mt-6 rounded-md border border-line bg-surface p-5"
      >
        <h3 className="font-semibold text-ink-900">Publier un créneau</h3>
        <p className="mt-1 text-sm text-ink-600">
          Ajoutez une disponibilité sans quitter l&apos;emploi du temps.
        </p>
        {form}
      </section>
    );
  }

  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <h3 className="font-semibold text-ink-900">Publier un créneau</h3>
      <p className="mt-1 text-sm text-ink-600">
        Ajoutez une disponibilité sans quitter le cockpit.
      </p>
      {form}
    </section>
  );
}
