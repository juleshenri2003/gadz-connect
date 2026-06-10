import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";
import { WeekCalendar } from "@/features/scheduling/WeekCalendar";
import { useAdminSchedule } from "@/features/scheduling/useSchedule";
import type { ScheduleEvent } from "@/features/scheduling/types";

export function AdminSchedulePage() {
  const { data, isLoading, isError } = useAdminSchedule();

  function renderMeta(event: ScheduleEvent): string | undefined {
    const parts = [
      event.providerName ? `Prof : ${event.providerName}` : null,
      event.clientName ? `Élève : ${event.clientName}` : null,
      event.campusName,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Emploi du temps</h2>
        <p className="mt-1 text-sm text-slate-600">
          Vue calendrier des cours planifiés sur votre périmètre campus
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planning campus</CardTitle>
          <CardDescription>
            Sessions tutorat avec date de cours enregistrée dans Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500">Chargement du planning…</p>
          ) : isError ? (
            <p className="text-sm text-red-600">
              Impossible de charger l&apos;emploi du temps.
            </p>
          ) : (
            <WeekCalendar
              events={data?.events ?? []}
              emptyLabel="Aucun cours planifié pour cette semaine."
              renderEventMeta={renderMeta}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
