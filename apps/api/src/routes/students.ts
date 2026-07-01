import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { createInvoiceSignedUrl } from "../lib/billing/invoice-storage.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const studentsRouter = Router();

studentsRouter.use(requireAuth);

/**
 * GET /api/students/me/invoices
 * Factures reçues par le payeur (SAP TTC) par cours + relevés mensuels.
 */
studentsRouter.get("/me/invoices", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const [courseInvoicesResult, summariesResult] = await Promise.all([
    supabaseAdmin
      .from("payment_invoices")
      .select(
        `
        id,
        invoice_number,
        invoice_type,
        amount,
        created_at,
        transaction:transaction_id (
          course:course_id ( subject, title, scheduled_at )
        )
      `,
      )
      .eq("client_profile_id", userId)
      .eq("invoice_type", "parent")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("monthly_invoices")
      .select(
        "id, invoice_number, invoice_type, amount, line_count, billing_period, created_at",
      )
      .eq("profile_id", userId)
      .eq("invoice_type", "parent")
      .order("billing_period", { ascending: false }),
  ]);

  if (courseInvoicesResult.error) {
    res.status(500).json({ error: courseInvoicesResult.error.message });
    return;
  }
  if (summariesResult.error) {
    res.status(500).json({ error: summariesResult.error.message });
    return;
  }

  type CourseJoin = {
    subject: string | null;
    title: string;
    scheduled_at: string | null;
  };

  const courseRows = (courseInvoicesResult.data ?? []).map((row) => {
    const transaction = Array.isArray(row.transaction)
      ? row.transaction[0]
      : row.transaction;
    const course = (
      Array.isArray(transaction?.course)
        ? transaction?.course[0]
        : transaction?.course
    ) as CourseJoin | null | undefined;
    const subject = course?.subject ?? course?.title ?? "Cours particulier";

    return {
      id: row.id as string,
      invoice_number: row.invoice_number as string,
      invoice_type: "parent" as const,
      amount: Number(row.amount),
      created_at: row.created_at as string,
      course_subject: subject,
      course_title: subject,
      scheduled_at: (course?.scheduled_at as string | null) ?? null,
      is_monthly: false,
      line_count: 1,
    };
  });

  const summaryRows = (summariesResult.data ?? []).map((row) => {
    const billingPeriod = row.billing_period as string;
    const lineCount = Number(row.line_count ?? 0);
    const periodLabel = new Date(`${billingPeriod}T00:00:00.000Z`).toLocaleDateString(
      "fr-FR",
      { month: "long", year: "numeric", timeZone: "UTC" },
    );
    const label = `Relevé mensuel — ${periodLabel} (${lineCount} facture${lineCount > 1 ? "s" : ""})`;

    return {
      id: row.id as string,
      invoice_number: row.invoice_number as string,
      invoice_type: "parent" as const,
      amount: Number(row.amount),
      created_at: row.created_at as string,
      course_subject: label,
      course_title: label,
      scheduled_at: `${billingPeriod}T12:00:00.000Z`,
      is_monthly: true,
      line_count: lineCount,
    };
  });

  const merged = [...courseRows, ...summaryRows].sort(
    (a, b) =>
      new Date(b.scheduled_at ?? b.created_at).getTime() -
      new Date(a.scheduled_at ?? a.created_at).getTime(),
  );

  res.json({ data: merged });
});

/**
 * GET /api/students/me/invoices/:id/url
 * URL signée pour télécharger une facture ou un relevé mensuel du payeur.
 */
studentsRouter.get(
  "/me/invoices/:id/url",
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;

    const { data: monthlyInvoice, error: monthlyError } = await supabaseAdmin
      .from("monthly_invoices")
      .select("id, storage_path, profile_id, invoice_type")
      .eq("id", invoiceId)
      .maybeSingle();

    if (monthlyError) {
      res.status(500).json({ error: monthlyError.message });
      return;
    }

    if (monthlyInvoice) {
      if (
        monthlyInvoice.profile_id !== userId ||
        monthlyInvoice.invoice_type !== "parent"
      ) {
        res.status(404).json({ error: "Facture introuvable" });
        return;
      }

      try {
        const url = await createInvoiceSignedUrl(
          monthlyInvoice.storage_path as string,
        );
        res.json({ data: { url } });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Impossible de générer le lien";
        res.status(500).json({ error: message });
      }
      return;
    }

    const { data: courseInvoice, error: courseError } = await supabaseAdmin
      .from("payment_invoices")
      .select("id, storage_path, client_profile_id, invoice_type")
      .eq("id", invoiceId)
      .maybeSingle();

    if (courseError) {
      res.status(500).json({ error: courseError.message });
      return;
    }

    if (
      !courseInvoice ||
      courseInvoice.client_profile_id !== userId ||
      courseInvoice.invoice_type !== "parent"
    ) {
      res.status(404).json({ error: "Facture introuvable" });
      return;
    }

    try {
      const url = await createInvoiceSignedUrl(courseInvoice.storage_path as string);
      res.json({ data: { url } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de générer le lien";
      res.status(500).json({ error: message });
    }
  },
);
