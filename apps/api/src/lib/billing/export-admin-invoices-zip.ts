import { createRequire } from "node:module";
import type { Archiver } from "archiver";
import type { Response } from "express";
import type { AdminBudgetPeriod } from "../admin-budget.js";
import {
  downloadAdminInvoicePdf,
  fetchAdminInvoices,
} from "./admin-invoices.js";

const require = createRequire(import.meta.url);
const archiver = require("archiver") as (
  format: string,
  options?: { zlib?: { level?: number } },
) => Archiver;

export async function streamAdminInvoicesZip(
  res: Response,
  scopeCampusId: string | undefined,
  period: AdminBudgetPeriod,
): Promise<void> {
  const { invoices } = await fetchAdminInvoices(scopeCampusId, {
    period,
    limit: 500,
  });

  if (invoices.length === 0) {
    throw new Error("Aucune facture sur la période sélectionnée");
  }

  const label =
    period === "month"
      ? "mois-courant"
      : period === "week"
        ? "semaine-courante"
        : period === "30d"
          ? "30-jours"
          : "tout";

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="gadz-connect-factures-${label}.zip"`,
  );

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err: Error) => {
    throw err;
  });
  archive.pipe(res);

  for (const invoice of invoices) {
    const { buffer, filename } = await downloadAdminInvoicePdf(
      invoice.id,
      scopeCampusId,
    );
    archive.append(buffer, { name: filename });
  }

  await archive.finalize();
}
