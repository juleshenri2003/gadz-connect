import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { useProviderProgress } from "@/features/onboarding/progress/useProviderProgress";
import { getFutureSlots, needsHourlyRate } from "./teacherCockpitUtils";

interface TeacherBookabilityAlertProps {
  onFixRate?: () => void;
  onFixSlots?: () => void;
}

export function TeacherBookabilityAlert({
  onFixRate,
  onFixSlots,
}: TeacherBookabilityAlertProps = {}) {
  const { profile, slots } = useProviderProgress();
  if (!profile || profile.account_status !== "active") return null;

  const futureSlots = getFutureSlots(slots);
  const isBookable =
    !needsHourlyRate(profile.hourly_rate) && futureSlots.length > 0;

  if (isBookable) return null;

  const needsRate = needsHourlyRate(profile.hourly_rate);

  return (
    <section
      className="rounded-md border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning"
      role="status"
    >
      <p className="font-medium">Profil non réservable</p>
      <p className="mt-1 text-warning">
        {needsRate
          ? "Ajoutez un tarif horaire dans votre profil."
          : "Publiez au moins un créneau à venir."}
      </p>
      {needsRate ? (
        onFixRate ? (
          <Button className="mt-3" size="sm" variant="outline" onClick={onFixRate}>
            Corriger →
          </Button>
        ) : (
          <Button className="mt-3" size="sm" variant="outline" asChild>
            <Link to="/app/profil">Corriger →</Link>
          </Button>
        )
      ) : onFixSlots ? (
        <Button className="mt-3" size="sm" variant="outline" onClick={onFixSlots}>
          Corriger →
        </Button>
      ) : (
        <Button className="mt-3" size="sm" variant="outline" asChild>
          <Link to="/app/cours">Corriger →</Link>
        </Button>
      )}
    </section>
  );
}
