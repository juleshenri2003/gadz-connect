/**
 * Relances e-mail Stripe Connect (cron prod : 1×/jour).
 * Usage: pnpm --filter @gadz-connect/api stripe-onboarding-reminders
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { maybeSendStripeOnboardingEmail } from "../src/lib/stripe-onboarding-email.js";

const MIN_DAYS_BETWEEN_REMINDERS = Number(
  process.env.STRIPE_ONBOARDING_REMINDER_DAYS ?? "3",
);

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: teachers, error } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "teacher")
    .eq("account_status", "active")
    .eq("stripe_connect_onboarding_complete", false)
    .not("stripe_connect_account_id", "is", null);

  if (error) {
    console.error("profiles:", error.message);
    process.exit(1);
  }

  console.log(
    `── Relances Stripe Connect (${teachers?.length ?? 0} prof(s) éligible(s)) ──\n`,
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const teacher of teachers ?? []) {
    const label = `${teacher.first_name} ${teacher.last_name}`;
    const result = await maybeSendStripeOnboardingEmail(teacher.id as string, {
      variant: "reminder",
      minDaysSinceLastEmail: MIN_DAYS_BETWEEN_REMINDERS,
    });

    if (result.sent) {
      console.log(`✓ ${label} — e-mail envoyé`);
      sent += 1;
    } else if (result.skipped) {
      console.log(`· ${label} — ${result.reason ?? "ignoré"}`);
      skipped += 1;
    } else {
      console.log(`✗ ${label} — ${result.reason ?? "échec"}`);
      failed += 1;
    }
  }

  console.log(`\nRésumé : ${sent} envoyé(s), ${skipped} ignoré(s), ${failed} échec(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
