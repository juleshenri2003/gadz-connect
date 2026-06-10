/**
 * Insère cours et transactions de démo pour le pilotage RH.
 * Usage: pnpm --filter @gadz-connect/api seed-demo
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: campus } = await admin
    .from("campus")
    .select("id")
    .eq("name", "Paris")
    .maybeSingle();
  const { data: provider } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!campus || !provider) {
    console.error("Campus Paris ou profil manquant — inscrivez un utilisateur d'abord.");
    process.exit(1);
  }

  const courses = [
    {
      title: "Initiation SolidWorks",
      description: "Cours de modélisation 3D pour débutants",
      status: "scheduled" as const,
    },
    {
      title: "Préparation concours Mines-Ponts",
      description: "Soutien en mathématiques et physique",
      status: "completed" as const,
    },
  ];

  const courseIds: Record<string, string> = {};

  for (const c of courses) {
    const { data: existing } = await admin
      .from("courses")
      .select("id")
      .eq("title", c.title)
      .maybeSingle();

    if (existing) {
      courseIds[c.title] = existing.id as string;
      continue;
    }

    const { data: inserted, error } = await admin
      .from("courses")
      .insert({
        title: c.title,
        description: c.description,
        campus_id: campus.id,
        provider_id: provider.id,
        status: c.status,
      })
      .select("id")
      .single();

    if (error) throw error;
    courseIds[c.title] = inserted.id as string;
    console.log("Cours créé:", c.title);
  }

  const txs = [
    {
      course_id: courseIds["Préparation concours Mines-Ponts"],
      amount_gross: 120,
      commission_sasu: 12,
      taxes_urssaf: 18.5,
      net_payout: 89.5,
      status_stripe: "succeeded",
      status_urssaf: "pending",
    },
    {
      course_id: courseIds["Préparation concours Mines-Ponts"],
      amount_gross: 80,
      commission_sasu: 8,
      taxes_urssaf: 12.3,
      net_payout: 59.7,
      status_stripe: "succeeded",
      status_urssaf: "declared",
    },
    {
      course_id: courseIds["Initiation SolidWorks"],
      amount_gross: 150,
      commission_sasu: 15,
      taxes_urssaf: 0,
      net_payout: 0,
      status_stripe: "pending",
      status_urssaf: "pending",
    },
  ];

  for (const tx of txs) {
    const { count } = await admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("course_id", tx.course_id)
      .eq("amount_gross", tx.amount_gross);

    if ((count ?? 0) > 0) continue;

    const { error } = await admin.from("transactions").insert(tx);
    if (error) throw error;
    console.log("Transaction ajoutée:", tx.amount_gross, "€");
  }

  if (!provider.first_name) {
    await admin
      .from("profiles")
      .update({ first_name: "Jules", last_name: "Henri" })
      .eq("id", provider.id);
  }

  console.log("Démo prête — ouvrez http://localhost:5173/admin");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
