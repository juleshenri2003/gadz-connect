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
import { DeclareUnavailableButton } from "@/features/notifications/DeclareUnavailableButton";
import { WeekCalendar } from "@/features/scheduling/WeekCalendar";
import { useMySchedule } from "@/features/scheduling/useSchedule";
import type { ScheduleEvent } from "@/features/scheduling/types";

export function SchedulePage() {
  const { data: profile } = useMyProfile();
  const { data, isLoading, isError } = useMySchedule();
  const student = profile?.role ? isStudent(profile.role) : true;

  function renderMeta(event: ScheduleEvent): string | undefined {
    if (event.status === "awaiting_replacement") {
      return "Remplacement en cours — consultez vos alertes";
    }
    if (
      !student &&
      event.kind === "slot_booked" &&
      !event.courseId
    ) {
      return "Créneau réservé sans cours enregistré — annulation indisponible";
    }
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
              renderEventActions={(event) => {
                if (!event.courseId || event.kind === "slot_available") {
                  return null;
                }
                if (
                  event.status === "scheduled" ||
                  event.status === "awaiting_replacement"
                ) {
                  return (
                    <DeclareUnavailableButton
                      courseId={event.courseId}
                      eventTitle={event.title}
                      courseStatus={event.status}
                    />
                  );
                }
                return null;
              }}
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
