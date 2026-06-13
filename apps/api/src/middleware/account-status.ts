import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

export async function loadAccountStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role, account_status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  req.profileGuard = {
    role: data.role as string,
    account_status: data.account_status as string,
  };
  next();
}

export function rejectSuspended(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (req.profileGuard?.account_status === "suspended") {
    res.status(403).json({
      error: "Compte suspendu — contactez l'équipe campus pour plus d'informations.",
    });
    return;
  }
  next();
}

export function requireActiveTeacher(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const guard = req.profileGuard;
  if (!guard) {
    res.status(500).json({ error: "Garde profil non initialisée" });
    return;
  }
  if (guard.role !== "teacher") {
    res.status(403).json({ error: "Réservé aux enseignants / intervenants." });
    return;
  }
  if (guard.account_status === "suspended") {
    res.status(403).json({
      error: "Compte suspendu — contactez l'équipe campus pour plus d'informations.",
    });
    return;
  }
  if (guard.account_status !== "active") {
    res.status(403).json({
      error:
        "Compte non activé — complétez votre parcours micro-entreprise et déclarez votre SIRET.",
    });
    return;
  }
  next();
}

export function requireTeacherNotSuspended(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const guard = req.profileGuard;
  if (!guard) {
    res.status(500).json({ error: "Garde profil non initialisée" });
    return;
  }
  if (guard.role !== "teacher") {
    res.status(403).json({ error: "Réservé aux enseignants / intervenants." });
    return;
  }
  if (guard.account_status === "suspended") {
    res.status(403).json({
      error: "Compte suspendu — contactez l'équipe campus pour plus d'informations.",
    });
    return;
  }
  next();
}
