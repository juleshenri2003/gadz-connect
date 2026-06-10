import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export const campusRouter = Router();

/**
 * GET /api/campus
 * Liste des campus Arts et Métiers (public).
 */
campusRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("campus")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("[campus] list:", error.message);
    res.status(500).json({ error: "Impossible de charger les campus" });
    return;
  }

  res.json({ data });
});
