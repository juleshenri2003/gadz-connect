/**
 * Répare les données démo facturation (cours sans client, factures obsolètes).
 * Usage: pnpm --filter @gadz-connect/api repair-demo-billing
 */
import "dotenv/config";
import { regeneratePaymentInvoices } from "../src/lib/billing/regenerate-payment-invoices.js";
import { supabaseAdmin } from "../src/lib/supabase.js";

const STUDENT_EMAIL = "eleve.dupont@ensam.eu";
const JULES_PROVIDER_ID = "875166c7-bb36-48c7-9ac2-5e0eb72b6451";

async function main() {
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  const student = authUsers.users.find((u) => u.email === STUDENT_EMAIL);

  if (!student?.id) {
    console.warn(`Élève démo ${STUDENT_EMAIL} introuvable — lancez seed-student`);
  }

  const { data: orphanCourses, error: coursesError } = await supabaseAdmin
    .from("courses")
    .select("id, title, client_id, provider_id")
    .eq("provider_id", JULES_PROVIDER_ID)
    .is("client_id", null);

  if (coursesError) {
    throw new Error(coursesError.message);
  }

  if (student?.id && (orphanCourses?.length ?? 0) > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("courses")
      .update({ client_id: student.id })
      .eq("provider_id", JULES_PROVIDER_ID)
      .is("client_id", null);

    if (updateError) {
      throw new Error(updateError.message);
    }
    console.log(
      `✓ ${orphanCourses!.length} cours Jules Henri rattachés à ${STUDENT_EMAIL}`,
    );
  } else {
    console.log("Aucun cours orphelin à rattacher.");
  }

  const { data: txs } = await supabaseAdmin
    .from("transactions")
    .select("id, course_id, stripe_payment_intent_id")
    .eq("status_stripe", "succeeded");

  let regenerated = 0;
  for (const tx of txs ?? []) {
    const paymentIntentId =
      (tx.stripe_payment_intent_id as string | null) ?? `repair-${tx.id}`;
    await regeneratePaymentInvoices({
      transactionId: tx.id as string,
      courseId: tx.course_id as string,
      paymentIntentId,
    });
    regenerated += 1;
    console.log(`✓ Factures régénérées pour transaction ${(tx.id as string).slice(0, 8)}`);
  }

  console.log(`Terminé — ${regenerated} transaction(s) régénérée(s).`);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
