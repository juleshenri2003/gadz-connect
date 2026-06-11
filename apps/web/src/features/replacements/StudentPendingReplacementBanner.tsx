import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { usePendingReplacementsForStudent } from "@/features/replacements/useReplacements";

export function StudentPendingReplacementBanner() {
  const { data: pending } = usePendingReplacementsForStudent();

  if (!pending?.length) return null;

  const total = pending.reduce(
    (sum, p) => sum + p.pendingProposalsCount,
    0,
  );

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold text-amber-900">
        Remplacement à valider
      </p>
      <p className="mt-1 text-sm text-amber-800">
        {total} proposition{total > 1 ? "s" : ""} de professeur
        {total > 1 ? "s" : ""} en attente de votre choix pour maintenir vos
        cours au même horaire.
      </p>
      <Button className="mt-3" size="sm" asChild>
        <Link to="/app/alertes">Choisir un remplaçant →</Link>
      </Button>
    </section>
  );
}
