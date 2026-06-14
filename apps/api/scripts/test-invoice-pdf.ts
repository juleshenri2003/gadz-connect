#!/usr/bin/env tsx
/**
 * Génère des factures PDF de démo (parent + étudiant) sans Stripe ni Supabase.
 * Usage: pnpm --filter @gadz-connect/api test-invoice-pdf
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPlatformBillingConfig } from "../src/lib/billing/platform-config.js";
import {
  buildDemoParentInvoicePdf,
  buildDemoStudentInvoicePdf,
} from "../src/lib/billing/demo-invoice-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../tmp/invoices");

async function main() {
  const platform = getPlatformBillingConfig();

  console.log("── Config plateforme ──");
  console.log("  Raison sociale :", platform.legalName);
  console.log("  N° SAP         :", platform.sapNumber);
  console.log("  Adresse        :", platform.address);
  console.log("  TVA applicable :", platform.vatApplicable ? "oui" : "non");
  console.log("");

  const [parentPdf, studentPdf] = await Promise.all([
    buildDemoParentInvoicePdf(),
    buildDemoStudentInvoicePdf(),
  ]);

  mkdirSync(OUT_DIR, { recursive: true });

  const parentPath = join(OUT_DIR, "facture-parent-GC-PARENT-2026-000001.pdf");
  const studentPath = join(
    OUT_DIR,
    "facture-etudiant-GC-STUDENT-2026-000001.pdf",
  );

  writeFileSync(parentPath, parentPdf);
  writeFileSync(studentPath, studentPdf);

  console.log("── PDF générés ──");
  console.log(`  Parent   : ${parentPath}`);
  console.log(`  Étudiant : ${studentPath}`);
  console.log("");
  console.log("Ouvrez les fichiers pour vérifier le rendu.");
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
