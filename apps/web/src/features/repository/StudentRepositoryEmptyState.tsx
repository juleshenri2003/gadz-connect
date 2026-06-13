import { Button } from "@gadz-connect/ui";
import { Link } from "react-router-dom";

export function StudentRepositoryEmptyState() {
  return (
    <div
      className="rounded-md border border-dashed border-line bg-paper p-8 text-center"
      role="status"
    >
      <p className="text-sm font-medium text-ink-900">
        Aucun compte-rendu pour le moment
      </p>
      <p className="mt-2 text-sm text-ink-600">
        Votre professeur dépose un résumé après chaque séance passée. Ils
        apparaîtront ici, classés par matière.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button size="sm" asChild>
          <Link to="/app/cours">Réserver un cours</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/app/planning">Voir mon emploi du temps</Link>
        </Button>
      </div>
    </div>
  );
}
