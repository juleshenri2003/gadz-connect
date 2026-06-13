import type { AccountStatus } from "@gadz-connect/types";
import type { MyProfile } from "@/features/auth/useMyProfile";
import type { MicroStatusVariant } from "@/features/onboarding/microEnterprisePageUtils";

export function isProfileCvComplete(profile: Pick<MyProfile, "cv" | "cv_pdf_path" | "cv_complete">): boolean {
  if (profile.cv_complete) return true;
  if (profile.cv_pdf_path) return true;
  return (profile.cv?.trim().length ?? 0) >= 50;
}

export function accountStatusVariant(status: AccountStatus): MicroStatusVariant {
  switch (status) {
    case "active":
      return "success";
    case "pending_siret":
      return "warning";
    case "suspended":
      return "danger";
    default:
      return "neutral";
  }
}

export function cvPdfFileName(cvPdfPath: string | null | undefined): string | null {
  if (!cvPdfPath) return null;
  const parts = cvPdfPath.split("/");
  const name = parts[parts.length - 1];
  return name || "cv.pdf";
}
