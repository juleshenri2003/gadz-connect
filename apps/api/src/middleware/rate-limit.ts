import type { NextFunction, Request, Response } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

function getClientKey(req: Request, prefix: string): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : req.socket.remoteAddress) ?? "unknown";
  return `${prefix}:${ip}`;
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 60;
  const keyPrefix = options.keyPrefix ?? "default";

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getClientKey(req, keyPrefix);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: "Trop de requêtes — réessayez dans quelques instants",
      });
      return;
    }

    entry.count += 1;
    next();
  };
}

/** Réinitialise le store (tests uniquement). */
export function resetRateLimitStore(): void {
  store.clear();
}
