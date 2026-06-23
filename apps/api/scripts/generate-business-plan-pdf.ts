#!/usr/bin/env tsx
/**
 * Génère le PDF du business plan provisoire Gadz'Connect.
 * Usage: pnpm --filter @gadz-connect/api generate-business-plan-pdf
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBusinessPlanPdf } from "../src/lib/pdf/business-plan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(
  __dirname,
  "../../../docs/GadzConnect-Business-Plan-PROVISOIRE.pdf",
);

async function main() {
  const pdf = await buildBusinessPlanPdf();
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, pdf);
  console.log("PDF généré :", OUT_PATH);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
