import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

/**
 * Auth optionnelle — enrichit la requête si un Bearer valide est présent,
 * sans rejeter les visiteurs anonymes.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next();
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      next();
      return;
    }

    req.user = user;
    next();
  } catch {
    next();
  }
}
