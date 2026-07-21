import { supabaseAdmin } from "../supabase.js";

export interface AuditLogInput {
  profileId?: string;
  courseId?: string;
  transactionId?: string;
  method: string;
  requestPath: string;
  requestSummary?: Record<string, unknown>;
  responseStatus?: number;
  responseSummary?: Record<string, unknown>;
  errorMessage?: string;
}

export async function logUrssafApiCall(input: AuditLogInput): Promise<void> {
  const { error } = await supabaseAdmin.from("urssaf_api_audit_log").insert({
    profile_id: input.profileId ?? null,
    course_id: input.courseId ?? null,
    transaction_id: input.transactionId ?? null,
    method: input.method,
    request_path: input.requestPath,
    request_summary: input.requestSummary ?? null,
    response_status: input.responseStatus ?? null,
    response_summary: input.responseSummary ?? null,
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.error("[urssaf] audit log:", error.message);
  }
}
