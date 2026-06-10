import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { isStudent } from "@/features/auth/roles";
import { useMyProfile } from "@/features/auth/useMyProfile";
import { WeekCalendar } from "@/features/scheduling/WeekCalendar";
import { useMySchedule } from "@/features/scheduling/useSchedule";
import type { ScheduleEvent } from "@/features/scheduling/types";

export function SchedulePage() {
  const { data: profile } = useMyProfile();
  const { data, isLoading, isError } = useMySchedule();
  const student = profile?.role ? isStudent(profile.role) : true;

  function renderMeta(event: ScheduleEvent): string | undefined {
    if (student) {
      return event.counterpartName
        ? `Avec ${event.counterpartName}`
        : undefined;
    }
    if (event.kind === "slot_available") return "Ouvert aux réservations";
    if (event.counterpartName) return `Élève : ${event.counterpartName}`;
    return undefined;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Emploi du temps</h2>
        <p className="mt-1 text-sm text-slate-600">
          {student
            ? "Vos cours de tutorat réservés sur Gadz'Connect"
            : "Vos créneaux et cours planifiés"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calendrier</CardTitle>
          <CardDescription>
            {student
              ? "Retrouvez ici les sessions confirmées avec vos professeurs."
              : "Créneaux disponibles (vert) et sessions réservées (indigo)."}
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
              emptyLabel={
                student
                  ? "Aucun cours réservé — parcourez le tutorat pour réserver un créneau."
                  : "Aucun créneau cette semaine — ajoutez des disponibilités dans Mes cours."
              }
              renderEventMeta={renderMeta}
            />
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-slate-600">
        {student ? (
          <>
            <Link to="/app/cours" className="font-medium text-indigo-700 hover:underline">
              Réserver un cours →
            </Link>
          </>
        ) : (
          <>
            <Link to="/app/cours" className="font-medium text-indigo-700 hover:underline">
              Gérer mes créneaux →
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
