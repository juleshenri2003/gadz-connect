import type { UrssafClientStatus } from "@gadz-connect/types";
import { notifyUrssafClientActif } from "../notification-helpers.js";
import { supabaseAdmin } from "../supabase.js";
import { statutTransmission } from "./statut-transmission.js";
import { mockPollClientStatus } from "./mock.js";
import { getUrssafApiConfig } from "./config.js";

export interface UrssafPollingStats {
  clientsPolled: number;
  clientsActivated: number;
  paymentsPolled: number;
  paymentsPaid: number;
  paymentsRejected: number;
  profPayoutsTriggered: number;
  errors: string[];
}

type PendingClientRow = {
  id: string;
  profile_id: string;
  urssaf_transmission_id: string | null;
  status: UrssafClientStatus;
};

async function pollPendingClients(stats: UrssafPollingStats): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("urssaf_clients")
    .select("id, profile_id, urssaf_transmission_id, status")
    .in("status", ["inscription_envoyee", "rattachement_en_attente"]);

  if (error) {
    stats.errors.push(`clients: ${error.message}`);
    return;
  }

  const config = getUrssafApiConfig();

  for (const row of (data ?? []) as PendingClientRow[]) {
    try {
      stats.clientsPolled += 1;
      let nextStatus: UrssafClientStatus;
      let urssafClientId: string | undefined;

      if (config.mock) {
        nextStatus = mockPollClientStatus(row.profile_id);
      } else if (row.urssaf_transmission_id) {
        const result = await statutTransmission(
          row.urssaf_transmission_id,
          row.profile_id,
        );
        nextStatus = result.status;
        urssafClientId = result.urssafClientId;
      } else {
        continue;
      }

      const becameActif =
        nextStatus === "actif" && row.status !== "actif";

      const updates: Record<string, unknown> = {
        status: nextStatus,
        last_polled_at: new Date().toISOString(),
      };
      if (urssafClientId) updates.urssaf_client_id = urssafClientId;
      if (becameActif) {
        updates.activated_at = new Date().toISOString();
        stats.clientsActivated += 1;
      }
      if (nextStatus === "refuse" && row.status !== "refuse") {
        updates.refused_at = new Date().toISOString();
      }

      await supabaseAdmin
        .from("urssaf_clients")
        .update(updates)
        .eq("id", row.id);

      if (becameActif) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("campus_id")
          .eq("id", row.profile_id)
          .maybeSingle();
        const campusId = profile?.campus_id as string | undefined;
        if (campusId) {
          await notifyUrssafClientActif(row.profile_id, campusId);
        }
      }
    } catch (err) {
      stats.errors.push(
        `client ${row.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

export async function runUrssafPollingJobs(): Promise<UrssafPollingStats> {
  const stats: UrssafPollingStats = {
    clientsPolled: 0,
    clientsActivated: 0,
    paymentsPolled: 0,
    paymentsPaid: 0,
    paymentsRejected: 0,
    profPayoutsTriggered: 0,
    errors: [],
  };

  await pollPendingClients(stats);

  const { pollUrssafPayments } = await import("./payment.js");
  const paymentStats = await pollUrssafPayments();
  stats.paymentsPolled = paymentStats.polled;
  stats.paymentsPaid = paymentStats.paid;
  stats.paymentsRejected = paymentStats.rejected;
  stats.profPayoutsTriggered = paymentStats.profPayoutsTriggered;
  stats.errors.push(...paymentStats.errors);

  return stats;
}
