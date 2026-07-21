import { StudentInvoicesList } from "@/features/billing/StudentInvoicesList";
import { UrssafEnrollmentSection } from "@/features/urssaf/UrssafEnrollmentSection";

export function StudentInvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Mes factures</h2>
        <p className="mt-1 text-sm text-ink-600">
          Retrouvez ici toutes vos factures de cours et vos relevés mensuels.
        </p>
      </div>
      <UrssafEnrollmentSection />
      <StudentInvoicesList />
    </div>
  );
}
