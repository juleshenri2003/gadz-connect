import { getPlatformBillingConfig } from "./platform-config.js";
import {
  formatFrenchDate,
  formatInvoiceNumber,
} from "./format.js";
import { buildParentInvoicePdf } from "../pdf/parent-invoice.js";
import { buildStudentInvoicePdf } from "../pdf/student-invoice.js";

export function buildDemoSchedule() {
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 3);
  scheduledAt.setHours(14, 0, 0, 0);
  const endsAt = new Date(scheduledAt);
  endsAt.setHours(15, 0, 0, 0);
  return { scheduledAt, endsAt };
}

export async function buildDemoParentInvoicePdf(): Promise<Buffer> {
  const platform = getPlatformBillingConfig();
  const invoiceDate = formatFrenchDate(new Date().toISOString());
  const { scheduledAt, endsAt } = buildDemoSchedule();

  return buildParentInvoicePdf({
    invoiceNumber: formatInvoiceNumber("PARENT", 1),
    invoiceDate,
    platform,
    parentName: "Sophie Dupont",
    tutorName: "Marie Martin",
    subject: "SolidWorks — modélisation 3D",
    scheduledAt: scheduledAt.toISOString(),
    endsAt: endsAt.toISOString(),
    amountGross: 36,
  });
}

export async function buildDemoStudentInvoicePdf(): Promise<Buffer> {
  const platform = getPlatformBillingConfig();
  const invoiceDate = formatFrenchDate(new Date().toISOString());
  const { scheduledAt, endsAt } = buildDemoSchedule();

  return buildStudentInvoicePdf({
    invoiceNumber: formatInvoiceNumber("STUDENT", 1),
    invoiceDate,
    platform,
    studentLegalName: "Marie Martin EI",
    studentSiret: "73282932000074",
    studentAddress: "12 rue de l'Industrie, 75015 Paris",
    subject: "SolidWorks — modélisation 3D",
    scheduledAt: scheduledAt.toISOString(),
    endsAt: endsAt.toISOString(),
    amount: 33,
  });
}
