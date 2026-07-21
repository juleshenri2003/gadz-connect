/**
 * Recette sandbox URSSAF (mode mock par défaut).
 * Usage: pnpm --filter @gadz-connect/api urssaf-sandbox-test
 */
import "dotenv/config";
import { resetUrssafMockState } from "../src/lib/urssaf/mock.js";
import { inscrireClient } from "../src/lib/urssaf/inscrire-client.js";
import { statutTransmission } from "../src/lib/urssaf/statut-transmission.js";
import {
  transmettreDemandePaiement,
} from "../src/lib/urssaf/demande-paiement.js";
import { consulterDemandePaiement } from "../src/lib/urssaf/consulter-demande.js";

const TEST_PROFILE_ID = "00000000-0000-4000-8000-000000000001";

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  process.env.URSSAF_API_MOCK = "true";
  process.env.URSSAF_API_ENABLED = "false";
  resetUrssafMockState();

  console.log("1. Inscrire un client (mock)…");
  const enrollment = await inscrireClient({
    profileId: TEST_PROFILE_ID,
    firstName: "Jean",
    lastName: "Dupont",
    birthDate: "1985-03-15",
    birthPlace: "Paris",
    fiscalAddress: "12 rue de la Paix, 75002 Paris",
    iban: "FR7630006000011234567890189",
  });
  console.log("   →", enrollment);

  console.log("2. Attente activation rattachement…");
  await sleep(6_000);
  const clientStatus = await statutTransmission(enrollment.transmissionId);
  console.log("   →", clientStatus);
  if (clientStatus.status !== "actif") {
    throw new Error("Le client mock n'est pas passé actif");
  }

  console.log("3. Demande de paiement (40 €)…");
  const payment = await transmettreDemandePaiement({
    profileId: TEST_PROFILE_ID,
    courseId: "00000000-0000-4000-8000-000000000099",
    transactionId: "00000000-0000-4000-8000-000000000098",
    urssafClientId: enrollment.urssafClientId,
    amountEur: 40,
    serviceDate: "2026-07-10",
    description: "Cours de mathématiques",
  });
  console.log("   →", payment);

  console.log("4. Polling statut paiement…");
  let finalStatus = payment.status;
  for (let i = 0; i < 6; i += 1) {
    await sleep(3_000);
    const consulted = await consulterDemandePaiement(payment.paymentRequestId);
    finalStatus = consulted.status;
    console.log(`   tentative ${i + 1} →`, consulted);
    if (finalStatus === "paye" || finalStatus === "rejetee") break;
  }

  if (finalStatus !== "paye") {
    throw new Error(`Statut final inattendu : ${finalStatus}`);
  }

  console.log("\n✓ Recette sandbox mock OK — prêt pour l'API réelle après habilitation.\n");
}

main().catch((err: Error) => {
  console.error("✗", err.message);
  process.exit(1);
});
