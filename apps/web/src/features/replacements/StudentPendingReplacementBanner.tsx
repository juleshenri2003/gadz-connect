import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { buildAlertFocusHref } from "@/features/notifications/notificationUtils";
import { usePendingReplacementsForStudent } from "@/features/replacements/useReplacements";

export function StudentPendingReplacementBanner() {
  const { data: pending } = usePendingReplacementsForStudent();

  if (!pending?.length) return null;

  const total = pending.reduce(
    (sum, p) => sum + p.pendingProposalsCount,
    0,
  );

  const first = pending[0]!;
  const href =
    first.recipientId
      ? buildAlertFocusHref(first.recipientId, first.id)
      : "/app/alertes";

  return (
    <section className="rounded-md border border-warning/30 bg-warning-bg p-4">
      <p className="font-semibold text-warning">
        Remplacement à valider
      </p>
      <p className="mt-1 text-sm text-warning">
        {total} proposition{total > 1 ? "s" : ""} de professeur
        {total > 1 ? "s" : ""} en attente de votre choix pour maintenir vos
        cours au même horaire.
      </p>
      <Button className="mt-3" size="sm" asChild>
        <Link to={href}>Choisir un remplaçant →</Link>
      </Button>
    </section>
  );
}
