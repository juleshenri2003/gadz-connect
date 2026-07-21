import { randomUUID } from "node:crypto";
import type { UrssafClientStatus, UrssafPaymentStatus } from "@gadz-connect/types";

const mockClients = new Map<
  string,
  {
    urssafClientId: string;
    transmissionId: string;
    status: UrssafClientStatus;
    createdAt: number;
  }
>();

const mockPayments = new Map<
  string,
  {
    amount: number;
    status: UrssafPaymentStatus;
    createdAt: number;
  }
>();

export function mockInscrireClient(input: {
  profileId: string;
}): {
  urssafClientId: string;
  transmissionId: string;
  status: UrssafClientStatus;
} {
  const urssafClientId = `MOCK-CLI-${randomUUID().slice(0, 8)}`;
  const transmissionId = `MOCK-TX-${randomUUID().slice(0, 8)}`;
  mockClients.set(input.profileId, {
    urssafClientId,
    transmissionId,
    status: "rattachement_en_attente",
    createdAt: Date.now(),
  });
  return {
    urssafClientId,
    transmissionId,
    status: "rattachement_en_attente",
  };
}

export function mockStatutTransmission(transmissionId: string): {
  status: UrssafClientStatus;
  urssafClientId?: string;
} {
  for (const [profileId, entry] of mockClients) {
    if (entry.transmissionId !== transmissionId) continue;
    const elapsed = Date.now() - entry.createdAt;
    if (elapsed > 5_000 && entry.status === "rattachement_en_attente") {
      entry.status = "actif";
      mockClients.set(profileId, entry);
    }
    return {
      status: entry.status,
      urssafClientId: entry.urssafClientId,
    };
  }
  return { status: "inscription_envoyee" };
}

export function mockPollClientStatus(profileId: string): UrssafClientStatus {
  const entry = mockClients.get(profileId);
  if (!entry) return "inscription_envoyee";
  const elapsed = Date.now() - entry.createdAt;
  if (elapsed > 5_000 && entry.status === "rattachement_en_attente") {
    entry.status = "actif";
    mockClients.set(profileId, entry);
  }
  return entry.status;
}

export function mockDemandePaiement(input: {
  amount: number;
}): {
  paymentRequestId: string;
  transmissionId: string;
  status: UrssafPaymentStatus;
} {
  const paymentRequestId = `MOCK-PAY-${randomUUID().slice(0, 8)}`;
  const transmissionId = `MOCK-PTX-${randomUUID().slice(0, 8)}`;
  mockPayments.set(paymentRequestId, {
    amount: input.amount,
    status: "recue",
    createdAt: Date.now(),
  });
  return {
    paymentRequestId,
    transmissionId,
    status: "recue",
  };
}

export function mockConsulterDemande(paymentRequestId: string): {
  status: UrssafPaymentStatus;
  paidAt?: string;
} {
  const entry = mockPayments.get(paymentRequestId);
  if (!entry) return { status: "recue" };

  const elapsed = Date.now() - entry.createdAt;
  if (elapsed > 3_000 && entry.status === "recue") {
    entry.status = "en_attente_validation";
  }
  if (elapsed > 6_000 && entry.status === "en_attente_validation") {
    entry.status = "validee";
  }
  if (elapsed > 9_000 && entry.status === "validee") {
    entry.status = "virement_effectue";
  }
  if (elapsed > 12_000 && entry.status === "virement_effectue") {
    entry.status = "paye";
  }
  mockPayments.set(paymentRequestId, entry);

  return {
    status: entry.status,
    paidAt: entry.status === "paye" ? new Date().toISOString() : undefined,
  };
}

/** Réinitialise l'état mock (tests). */
export function resetUrssafMockState(): void {
  mockClients.clear();
  mockPayments.clear();
}
