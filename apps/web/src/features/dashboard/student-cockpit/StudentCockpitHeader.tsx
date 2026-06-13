interface StudentCockpitHeaderProps {
  firstName?: string | null;
  campusName?: string | null;
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function StudentCockpitHeader({
  firstName,
  campusName,
}: StudentCockpitHeaderProps) {
  const title = firstName ? `Bonjour ${firstName}` : "Tableau de bord";

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-600">
        {campusName ? `Campus ${campusName}` : "Votre espace élève Gadz'Connect"}
        {" · "}
        <span className="capitalize">{formatTodayDate()}</span>
      </p>
    </div>
  );
}
