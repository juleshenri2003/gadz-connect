#!/usr/bin/env tsx
/**
 * Génère le PDF de description produit Gadz'Connect.
 * Usage: pnpm --filter @gadz-connect/api generate-product-pdf
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProductDescriptionPdf } from "../src/lib/pdf/product-description.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(
  __dirname,
  "../../../docs/GadzConnect-Description-Produit.pdf",
);

async function main() {
  const pdf = await buildProductDescriptionPdf();
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, pdf);
  console.log("PDF généré :", OUT_PATH);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
