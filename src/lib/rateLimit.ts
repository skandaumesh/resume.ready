// ─────────────────────────────────────────────────────────────────────────
// Daily rate limiting, backed by Postgres (no Redis needed, serverless-safe).
// Protects the OpenRouter quota: one abusive user or bot can otherwise drain
// every free-tier AI call for the day.
// ─────────────────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Daily budgets. AI calls are the scarce resource; deterministic tools are
// effectively free and aren't limited.
export const LIMITS = {
  /** Authenticated AI actions (generate / improve / tailor / enhance / parse) per user. */
  userAi: 40,
  /** Anonymous public ATS checks per IP. */
  publicAts: 5,
  /** Anonymous roasts per IP. */
  publicRoast: 3,
  /** Anonymous LinkedIn profile ratings per IP (deterministic, cheap). */
  publicLinkedin: 5,
  /** Anonymous LinkedIn AI-coach runs per IP (costs an AI call). */
  publicLinkedinAi: 3,
} as const;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

/**
 * Count one use against a daily bucket. Returns ok=false when over budget.
 * The key should identify who + what, e.g. `u:${userId}:ai` or `ip:${ip}:roast`;
 * the current UTC date is appended so buckets reset at midnight.
 */
export async function consumeRateLimit(
  bucket: string,
  limit: number,
): Promise<RateLimitResult> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${bucket}:${day}`;
  try {
    const row = await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    return { ok: row.count <= limit, remaining: Math.max(0, limit - row.count) };
  } catch {
    // If the limiter itself fails, let the request through rather than
    // breaking the product; the quota risk is momentary.
    return { ok: true, remaining: limit };
  }
}

/** Best-effort client IP for anonymous rate limiting. */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export const AI_LIMIT_MESSAGE =
  "You've used today's AI quota. It resets at midnight UTC. This limit keeps the free AI models available for everyone.";

export const PUBLIC_LIMIT_MESSAGE =
  "You've used today's free checks from this network. Sign up (it's free) for a much higher daily limit.";
