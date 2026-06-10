import type { UserRole } from "@gadz-connect/types";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.js";
import { isRhAllowedEmail } from "../lib/rh-access.js";
import { supabaseAdmin } from "../lib/supabase.js";

const ADMIN_ROLES: UserRole[] = ["admin_campus", "admin_general"];

export interface AdminProfile {
  id: string;
  role: UserRole;
  campus_id: string;
  first_name: string;
  last_name: string;
}

export interface AdminRequest extends AuthenticatedRequest {
  adminProfile?: AdminProfile;
}

export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  if (!isRhAllowedEmail(req.user.email)) {
    res.status(403).json({
      error: "Accès RH réservé — adresse e-mail non autorisée",
    });
    return;
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, campus_id, first_name, last_name")
    .eq("id", req.user.id)
    .maybeSingle();

  if (error || !profile) {
    res.status(403).json({ error: "Profil administrateur introuvable" });
    return;
  }

  if (!ADMIN_ROLES.includes(profile.role as UserRole)) {
    res.status(403).json({ error: "Accès réservé aux administrateurs" });
    return;
  }

  req.adminProfile = profile as AdminProfile;
  next();
}

export function adminCampusFilter(
  admin: AdminProfile,
): { campusId: string } | null {
  if (admin.role === "admin_general") return null;
  return { campusId: admin.campus_id };
}
