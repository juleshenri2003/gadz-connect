import { Router } from "express";
import { z } from "zod";
import { calculateFiscalBreakdown } from "../lib/fiscal.js";

const fiscalCalculateSchema = z.object({
  amountGross: z.number().positive().default(40),
  statusAcre: z.boolean().default(false),
  versementLiberatoire: z.boolean().default(false),
});

export const fiscalRouter = Router();

/**
 * POST /api/fiscal/calculate
 * Simule le flux financier d'un cours (défaut : 40 € brut).
 */
fiscalRouter.post("/calculate", (req, res) => {
  const parsed = fiscalCalculateSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten(),
    });
    return;
  }

  const result = calculateFiscalBreakdown(parsed.data);
  res.json({ data: result });
});

/**
 * GET /api/fiscal/calculate/demo
 * Exemple documenté : cours à 40 € brut, taux plein, sans libératoire.
 */
fiscalRouter.get("/calculate/demo", (_req, res) => {
  const result = calculateFiscalBreakdown({
    amountGross: 40,
    statusAcre: false,
    versementLiberatoire: false,
  });

  res.json({
    data: result,
    breakdown: {
      label: "Cours 40 € — commission 5 € — URSSAF 21,1 % — net virement",
      steps: [
        "Montant brut : 40,00 €",
        "Commission SASU : −5,00 €",
        "Base cotisable : 35,00 €",
        `Cotisations URSSAF (21,1 %) : −${result.taxesUrssaf.toFixed(2)} €`,
        `Net virement prestataire : ${result.netPayout.toFixed(2)} €`,
      ],
    },
  });
});
