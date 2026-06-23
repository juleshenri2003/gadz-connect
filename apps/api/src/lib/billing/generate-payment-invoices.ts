import { getPlatformBillingConfig } from "./platform-config.js";
import {
  formatFrenchDate,
  formatInvoiceNumber,
} from "./format.js";
import {
  createInvoiceSignedUrl,
  invoiceStoragePath,
  uploadInvoicePdf,
} from "./invoice-storage.js";
import { sendParentInvoiceEmail } from "../email/send-parent-invoice.js";
import { buildParentInvoicePdf } from "../pdf/parent-invoice.js";
import { buildStudentInvoicePdf } from "../pdf/student-invoice.js";
import { buildInvoiceDownloadFilename } from "./invoice-filename.js";
import { supabaseAdmin } from "../supabase.js";

export interface GeneratePaymentInvoicesInput {
  transactionId: string;
  courseId: string;
  paymentIntentId: string;
}

export interface GeneratePaymentInvoicesResult {
  parentInvoiceId: string | null;
  studentInvoiceId: string | null;
  parentEmailSent: boolean;
}

async function nextInvoiceSequence(
  invoiceType: "parent" | "student",
): Promise<number> {
  const prefix = invoiceType === "parent" ? "GC-PARENT-" : "GC-STUDENT-";
  const year = new Date().getFullYear();
  const { data, error } = await supabaseAdmin
    .from("payment_invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}${year}-%`);

  if (error) {
    console.warn("[billing] compteur factures:", error.message);
    return Date.now() % 1_000_000;
  }

  let maxSequence = 0;
  for (const row of data ?? []) {
    const match = (row.invoice_number as string).match(/-(\d+)$/);
    if (match) {
      maxSequence = Math.max(maxSequence, Number.parseInt(match[1]!, 10));
    }
  }

  return maxSequence + 1;
}

async function getClientEmail(clientId: string | null | undefined): Promise<string | null> {
  if (!clientId) return null;
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(clientId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

/**
 * Génère les deux factures PDF (parent + étudiant), les stocke,
 * envoie la facture parent par e-mail et enregistre la facture étudiant.
 */
export async function generatePaymentInvoices(
  input: GeneratePaymentInvoicesInput,
): Promise<GeneratePaymentInvoicesResult> {
  const { data: existing } = await supabaseAdmin
    .from("payment_invoices")
    .select("id, invoice_type, parent_email_sent_at")
    .eq("transaction_id", input.transactionId);

  if (existing && existing.length >= 2) {
    const parentRow = existing.find((row) => row.invoice_type === "parent");
    return {
      parentInvoiceId: parentRow?.id ?? null,
      studentInvoiceId:
        existing.find((row) => row.invoice_type === "student")?.id ?? null,
      parentEmailSent: Boolean(parentRow?.parent_email_sent_at),
    };
  }

  const { data: transaction, error: txError } = await supabaseAdmin
    .from("transactions")
    .select(
      "id, course_id, amount_gross, commission_sasu, total_paid_parent, platform_commission, teacher_gross_revenue, net_payout, status_stripe",
    )
    .eq("id", input.transactionId)
    .maybeSingle();

  if (txError || !transaction) {
    throw new Error(txError?.message ?? "Transaction introuvable");
  }

  if (transaction.status_stripe !== "succeeded") {
    throw new Error("Transaction non confirmée — factures non générées");
  }

  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select(
      "id, subject, title, scheduled_at, slot_id, client_id, provider_id",
    )
    .eq("id", input.courseId)
    .maybeSingle();

  if (courseError || !course) {
    throw new Error(courseError?.message ?? "Cours introuvable");
  }

  let endsAt: string | null = null;
  if (course.slot_id) {
    const { data: slot } = await supabaseAdmin
      .from("tutor_slots")
      .select("ends_at")
      .eq("id", course.slot_id as string)
      .maybeSingle();
    endsAt = (slot?.ends_at as string) ?? null;
  }

  const clientId = (course.client_id as string | null) ?? null;
  const providerId = course.provider_id as string;

  const [{ data: client }, { data: provider }] = await Promise.all([
    clientId
      ? supabaseAdmin
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", clientId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("profiles")
      .select(
        "first_name, last_name, siret, micro_enterprise_address, is_autoentrepreneur_verified",
      )
      .eq("id", providerId)
      .maybeSingle(),
  ]);

  if (!provider?.siret) {
    console.warn(
      `[billing] SIRET manquant pour le prestataire ${providerId} — facture étudiant incomplète`,
    );
  }

  const platform = getPlatformBillingConfig();
  const invoiceDate = formatFrenchDate(new Date().toISOString());
  const subject =
    (course.subject as string) ?? (course.title as string) ?? "Cours particulier";
  const parentName = client
    ? `${client.first_name} ${client.last_name}`.trim()
    : "Client";
  const tutorName = provider
    ? `${provider.first_name} ${provider.last_name}`.trim()
    : "Prestataire";
  const studentLegalName = provider
    ? `${provider.first_name} ${provider.last_name} EI`
    : "Prestataire EI";
  const studentAddress =
    (provider?.micro_enterprise_address as string | null)?.trim() ||
    "Adresse de l'auto-entreprise non renseignée";
  const amountGross = Number(
    transaction.total_paid_parent ?? transaction.amount_gross,
  );
  const studentAmount = Number(
    transaction.teacher_gross_revenue ??
      transaction.amount_gross - transaction.commission_sasu,
  );

  const parentSequence = await nextInvoiceSequence("parent");
  const studentSequence = await nextInvoiceSequence("student");
  const parentInvoiceNumber = formatInvoiceNumber("PARENT", parentSequence);
  const studentInvoiceNumber = formatInvoiceNumber("STUDENT", studentSequence);

  const parentPdf = await buildParentInvoicePdf({
    invoiceNumber: parentInvoiceNumber,
    invoiceDate,
    platform,
    parentName,
    studentBeneficiaryName: parentName,
    tutorName,
    subject,
    scheduledAt: (course.scheduled_at as string) ?? null,
    endsAt,
    amountGross,
  });

  const studentPdf = await buildStudentInvoicePdf({
    invoiceNumber: studentInvoiceNumber,
    invoiceDate,
    platform,
    studentLegalName,
    studentSiret: (provider?.siret as string) ?? "00000000000000",
    studentAddress,
    subject,
    scheduledAt: (course.scheduled_at as string) ?? null,
    endsAt,
    amount: studentAmount,
  });

  const parentStoragePath = invoiceStoragePath("parent", input.transactionId);
  const studentStoragePath = invoiceStoragePath("student", input.transactionId);

  await uploadInvoicePdf(parentStoragePath, parentPdf);
  await uploadInvoicePdf(studentStoragePath, studentPdf);

  let parentInvoiceId: string | null = null;
  let studentInvoiceId: string | null = null;
  let parentEmailSent = false;

  const hasParent = existing?.some((row) => row.invoice_type === "parent");
  const hasStudent = existing?.some((row) => row.invoice_type === "student");

  if (!hasParent) {
    const { data: parentRow, error: parentInsertError } = await supabaseAdmin
      .from("payment_invoices")
      .insert({
        transaction_id: input.transactionId,
        course_id: input.courseId,
        invoice_type: "parent",
        invoice_number: parentInvoiceNumber,
        amount: amountGross,
        storage_path: parentStoragePath,
        client_profile_id: clientId,
        provider_profile_id: providerId,
      })
      .select("id")
      .single();

    if (parentInsertError) {
      throw new Error(parentInsertError.message);
    }
    parentInvoiceId = parentRow.id as string;

    const clientEmail = await getClientEmail(clientId);
    if (clientEmail) {
      const parentLastName = (client?.last_name as string | undefined)?.trim();
      const profLastName = (provider?.last_name as string | undefined)?.trim();
      const emailResult = await sendParentInvoiceEmail({
        to: clientEmail,
        parentName,
        invoiceNumber: parentInvoiceNumber,
        amountGross,
        subject,
        pdfBuffer: parentPdf,
        downloadFilename: buildInvoiceDownloadFilename({
          invoiceNumber: parentInvoiceNumber,
          invoiceType: "parent",
          parentLastName,
          profLastName,
          subject,
        }),
      });

      if (emailResult.sent) {
        parentEmailSent = true;
        await supabaseAdmin
          .from("payment_invoices")
          .update({ parent_email_sent_at: new Date().toISOString() })
          .eq("id", parentInvoiceId);
      }
    } else {
      console.warn(
        `[billing] e-mail client introuvable (${clientId}) — facture parent stockée uniquement`,
      );
    }
  } else {
    parentInvoiceId =
      existing?.find((row) => row.invoice_type === "parent")?.id ?? null;
    parentEmailSent = Boolean(
      existing?.find((row) => row.invoice_type === "parent")?.parent_email_sent_at,
    );
  }

  if (!hasStudent) {
    const { data: studentRow, error: studentInsertError } = await supabaseAdmin
      .from("payment_invoices")
      .insert({
        transaction_id: input.transactionId,
        course_id: input.courseId,
        invoice_type: "student",
        invoice_number: studentInvoiceNumber,
        amount: studentAmount,
        storage_path: studentStoragePath,
        provider_profile_id: providerId,
        client_profile_id: clientId,
      })
      .select("id")
      .single();

    if (studentInsertError) {
      throw new Error(studentInsertError.message);
    }
    studentInvoiceId = studentRow.id as string;
  } else {
    studentInvoiceId =
      existing?.find((row) => row.invoice_type === "student")?.id ?? null;
  }

  // Vérifie que les URLs signées sont générables (sanity check stockage)
  await createInvoiceSignedUrl(parentStoragePath, 60);
  await createInvoiceSignedUrl(studentStoragePath, 60);

  return { parentInvoiceId, studentInvoiceId, parentEmailSent };
}
