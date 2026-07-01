import { calculateFiscalBreakdown, resolveEffectiveAcre } from "./fiscal.js";
import { isStripeConfigured, stripe } from "./stripe.js";
import {
  resolveStripePaymentStrategy as resolveStripePaymentStrategyImpl,
  type StripePaymentStrategy,
} from "./stripe-test-connect.js";
import { supabaseAdmin } from "./supabase.js";
import { isTeacherVisibleInMarketplace } from "./tutor-visibility.js";

export interface BookingInput {
  slotId: string;
  subject?: string;
  clientUserId: string;
}

export interface BookingFiscal {
  amountGross: number;
  commissionSasu: number;
  taxesUrssaf: number;
  netPayout: number;
}

export interface PreparedBooking {
  slot: {
    id: string;
    provider_id: string;
    starts_at: string;
    ends_at: string;
  };
  client: {
    id: string;
    campus_id: string;
  };
  tutor: {
    id: string;
    first_name: string;
    last_name: string;
    stripe_connect_account_id: string | null;
  };
  subject: string;
  fiscal: BookingFiscal;
}

export async function prepareBooking(
  input: BookingInput,
): Promise<
  | { ok: true; data: PreparedBooking }
  | { ok: false; status: number; error: string }
> {
  const { data: client } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, role, campus_id, account_status, status_acre, versement_liberatoire, first_name, last_name",
    )
    .eq("id", input.clientUserId)
    .maybeSingle();

  if (!client) {
    return { ok: false, status: 404, error: "Profil introuvable" };
  }

  const { data: slot, error: slotError } = await supabaseAdmin
    .from("tutor_slots")
    .select("id, provider_id, starts_at, ends_at, booked")
    .eq("id", input.slotId)
    .maybeSingle();

  if (slotError || !slot || slot.booked) {
    return { ok: false, status: 404, error: "Créneau indisponible" };
  }

  const { data: existingBooking } = await supabaseAdmin
    .from("courses")
    .select("id, status, client_id")
    .eq("slot_id", input.slotId)
    .in("status", ["scheduled", "payment_pending"])
    .maybeSingle();

  if (existingBooking) {
    const existingClientId = existingBooking.client_id as string;
    if (existingBooking.status === "scheduled") {
      return { ok: false, status: 404, error: "Créneau indisponible" };
    }
    if (existingClientId !== input.clientUserId) {
      return { ok: false, status: 404, error: "Créneau indisponible" };
    }
    await supabaseAdmin.from("transactions").delete().eq("course_id", existingBooking.id);
    await supabaseAdmin.from("courses").delete().eq("id", existingBooking.id);
  }

  if (slot.provider_id === client.id) {
    return {
      ok: false,
      status: 400,
      error: "Vous ne pouvez pas réserver votre propre créneau",
    };
  }

  const { data: tutor } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, campus_id, hourly_rate, status_acre, acre_start_date, versement_liberatoire, first_name, last_name, role, account_status, profile_setup_complete, stripe_connect_account_id, stripe_connect_onboarding_complete, siret, is_autoentrepreneur_verified",
    )
    .eq("id", slot.provider_id)
    .eq("campus_id", client.campus_id)
    .maybeSingle();

  if (!tutor || !isTeacherVisibleInMarketplace(tutor)) {
    return { ok: false, status: 400, error: "Ce tuteur n'est pas disponible" };
  }

  const tutorSiret = (tutor.siret ?? "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(tutorSiret)) {
    return {
      ok: false,
      status: 400,
      error: "Ce tuteur n'a pas de SIRET valide — cours impossible",
    };
  }

  if (!tutor.is_autoentrepreneur_verified) {
    return {
      ok: false,
      status: 400,
      error: "Le statut auto-entrepreneur de ce tuteur n'est pas encore vérifié",
    };
  }

  if (!tutor.hourly_rate) {
    return {
      ok: false,
      status: 400,
      error: "Ce tuteur n'a pas défini de tarif horaire",
    };
  }

  const durationHours =
    (new Date(slot.ends_at).getTime() - new Date(slot.starts_at).getTime()) /
    (1000 * 60 * 60);
  const amountGross = Math.round(tutor.hourly_rate * durationHours * 100) / 100;

  // ACRE effective à la date du cours : le taux réduit ne s'applique que dans
  // la fenêtre de 12 mois. Un cours au-delà repasse au taux plein.
  const effectiveAcre = resolveEffectiveAcre({
    statusAcre: tutor.status_acre,
    acreStartDate: (tutor.acre_start_date as string | null) ?? null,
    referenceDate: new Date(slot.starts_at),
  });

  const fiscalResult = calculateFiscalBreakdown({
    amountGross,
    statusAcre: effectiveAcre,
    versementLiberatoire: tutor.versement_liberatoire,
  });

  const subject =
    input.subject ??
    `Tutorat avec ${tutor.first_name} ${tutor.last_name}`.trim();

  return {
    ok: true,
    data: {
      slot,
      client: { id: client.id, campus_id: client.campus_id as string },
      tutor: {
        id: tutor.id,
        first_name: tutor.first_name,
        last_name: tutor.last_name,
        stripe_connect_account_id: tutor.stripe_connect_account_id as
          | string
          | null,
      },
      subject,
      fiscal: {
        amountGross: fiscalResult.amountGross,
        commissionSasu: fiscalResult.commissionSasu,
        taxesUrssaf: fiscalResult.taxesUrssaf + fiscalResult.taxesLiberatoire,
        netPayout: fiscalResult.netPayout,
      },
    },
  };
}

export async function resolveStripePaymentStrategy(
  tutorStripeAccountId: string | null | undefined,
): Promise<StripePaymentStrategy> {
  return resolveStripePaymentStrategyImpl(tutorStripeAccountId);
}

export function shouldUseStripePayment(
  tutorStripeAccountId: string | null | undefined,
): boolean {
  return (
    isStripeConfigured &&
    Boolean(stripe) &&
    Boolean(tutorStripeAccountId)
  );
}

export async function finalizeBookingSlot(
  slotId: string,
  clientId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from("tutor_slots")
    .update({ booked: true, booked_by: clientId })
    .eq("id", slotId)
    .eq("booked", false);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function cancelPendingBooking(courseId: string): Promise<void> {
  await supabaseAdmin.from("transactions").delete().eq("course_id", courseId);
  await supabaseAdmin.from("courses").delete().eq("id", courseId);
}
