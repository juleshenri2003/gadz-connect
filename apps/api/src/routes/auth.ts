import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  isEmailLoginEnabled,
  performEmailLogin,
} from "../lib/email-login.js";
import { ensureProfileForUser } from "../lib/profiles.js";
import { isRhAllowedEmail } from "../lib/rh-access.js";
import { supabaseAuth } from "../lib/supabase.js";

export const authRouter = Router();

const magicLinkSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url(),
  intent: z.enum(["rh", "default"]).optional(),
});

const sessionCodeSchema = z.object({
  code: z.string().min(1),
});

const sessionTokensSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

function mapSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
}) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: {
      id: session.user.id,
      email: session.user.email,
      user_metadata: session.user.user_metadata ?? {},
    },
  };
}

/**
 * POST /api/auth/magic-link
 * Envoie un Magic Link via Supabase Auth (côté serveur).
 */
authRouter.post("/magic-link", async (req, res) => {
  if (!supabaseAuth) {
    res.status(503).json({ error: "Auth Supabase non configurée" });
    return;
  }

  const parsed = magicLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { email, redirectTo, intent } = parsed.data;

  if (intent === "rh" && !isRhAllowedEmail(email)) {
    res.status(403).json({
      error: "Cette plateforme RH n'accepte que les adresses e-mail autorisées.",
    });
    return;
  }

  const { error } = await supabaseAuth.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[auth] magic-link:", error.message);
    const isRateLimit = error.message.toLowerCase().includes("rate limit");
    res.status(isRateLimit ? 429 : 400).json({
      error: isRateLimit
        ? "Trop de tentatives — attendez quelques minutes ou utilisez la connexion dev en local."
        : error.message,
    });
    return;
  }

  res.json({ data: { sent: true } });
});

/**
 * POST /api/auth/session
 * Échange un code PKCE ou des tokens hash contre une session.
 */
authRouter.post("/session", async (req, res) => {
  if (!supabaseAuth) {
    res.status(503).json({ error: "Auth Supabase non configurée" });
    return;
  }

  const codeParsed = sessionCodeSchema.safeParse(req.body);
  const tokensParsed = sessionTokensSchema.safeParse(req.body);

  let sessionData: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    user: NonNullable<AuthenticatedRequest["user"]>;
  } | null = null;
  let authErrorMessage: string | undefined;

  if (codeParsed.success) {
    const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(
      codeParsed.data.code,
    );
    if (data.session?.user) {
      sessionData = data.session;
    }
    authErrorMessage = error?.message;
  } else if (tokensParsed.success) {
    const { data, error } = await supabaseAuth.auth.setSession({
      access_token: tokensParsed.data.access_token,
      refresh_token: tokensParsed.data.refresh_token,
    });
    if (data.session?.user) {
      sessionData = data.session;
    }
    authErrorMessage = error?.message;
  } else {
    res.status(400).json({
      error: "Corps invalide — fournir code ou access_token + refresh_token",
    });
    return;
  }

  if (!sessionData) {
    res.status(401).json({
      error: authErrorMessage ?? "Impossible d'établir la session",
    });
    return;
  }

  const ensured = await ensureProfileForUser(sessionData.user);
  if (!ensured.ok) {
    res.status(500).json({ error: ensured.message });
    return;
  }

  res.json({ data: { session: mapSession(sessionData) } });
});

/**
 * GET /api/auth/me
 * Utilisateur courant (JWT vérifié côté serveur).
 */
authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  res.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata ?? {},
      },
    },
  });
});

/**
 * POST /api/auth/logout
 * Invalidation côté client — le serveur ne conserve pas de session.
 */
authRouter.post("/logout", (_req, res) => {
  res.json({ data: { ok: true } });
});

const emailLoginSchema = z.object({
  email: z.string().email(),
});

async function handleEmailLogin(
  req: { body: unknown },
  res: {
    status: (code: number) => { json: (body: unknown) => void };
    json: (body: unknown) => void;
  },
) {
  if (!isEmailLoginEnabled()) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const parsed = emailLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "E-mail invalide" });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const result = await performEmailLogin(email);

  if (!result.ok) {
    res.status(result.status).json({ error: result.message });
    return;
  }

  res.json({
    data: {
      session: mapSession(result.session),
      profileSetupComplete: result.profileSetupComplete,
    },
  });
}

/**
 * POST /api/auth/email-login
 * Connexion directe par e-mail (sans Magic Link utilisateur).
 * Dev ou ALLOW_EMAIL_LOGIN=true.
 */
authRouter.post("/email-login", (req, res) => {
  void handleEmailLogin(req, res);
});

/**
 * POST /api/auth/dev-login
 * Alias rétrocompatible — même comportement que email-login.
 */
authRouter.post("/dev-login", (req, res) => {
  void handleEmailLogin(req, res);
});
