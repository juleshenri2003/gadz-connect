import { Link } from "react-router-dom";
import { Button } from "@gadz-connect/ui";
import { TeacherFinancialSummarySection } from "./TeacherFinancialSummary";
import type { TeacherFinancialSummary } from "@gadz-connect/types";

interface TeacherFinancialPanelProps {
  financial: TeacherFinancialSummary | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function TeacherFinancialPanel({
  financial,
  isLoading,
  isError,
}: TeacherFinancialPanelProps) {
  return (
    <aside className="space-y-4">
      <TeacherFinancialSummarySection
        financial={financial}
        isLoading={isLoading}
        isError={isError}
        compact
      />

      <section className="rounded-md border border-line bg-surface p-5">
        <h3 className="font-semibold text-ink-900">Actions rapides</h3>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="h-auto py-3" asChild>
            <Link to="/app/cours">Mes cours</Link>
          </Button>
          <Button size="sm" variant="outline" className="h-auto py-3" asChild>
            <Link to="/app/planning">Planning</Link>
          </Button>
          <Button size="sm" variant="outline" className="h-auto py-3" asChild>
            <Link to="/app/alertes">Alertes</Link>
          </Button>
          <Button size="sm" variant="outline" className="h-auto py-3" asChild>
            <Link to="/app/paiements">Paiements</Link>
          </Button>
        </div>
      </section>
    </aside>
  );
}
