import type { User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export interface AuthenticatedRequest extends Request {
  user?: User;
  accessToken?: string;
  profileGuard?: {
    role: string;
    account_status: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: "Token d'authentification requis" });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Session invalide ou expirée" });
    return;
  }

  req.user = data.user;
  req.accessToken = token;
  next();
}
