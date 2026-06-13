interface TeacherCockpitHeaderProps {
  firstName?: string | null;
  campusName?: string | null;
}

export function TeacherCockpitHeader({
  firstName,
  campusName,
}: TeacherCockpitHeaderProps) {
  const title = firstName ? `Bonjour ${firstName}` : "Tableau de bord";

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-600">
        Cockpit de pilotage — {campusName ?? "votre activité de tutorat"}
      </p>
    </div>
  );
}
