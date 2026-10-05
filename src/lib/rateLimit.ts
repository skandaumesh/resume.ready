// ─────────────────────────────────────────────────────────────────────────
// Daily rate limiting, backed by Postgres (no Redis needed, serverless-safe).
// Protects the OpenRouter quota: one abusive user or bot can otherwise drain
// every free-tier AI call for the day.
// ─────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AiBusyError } from "@/lib/ai/generateResume";

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
  /** The dated bucket key that was counted — what refundRateLimit gives back. */
  key: string;
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
    return { ok: row.count <= limit, remaining: Math.max(0, limit - row.count), key };
  } catch {
    // If the limiter itself fails, let the request through rather than
    // breaking the product; the quota risk is momentary.
    return { ok: true, remaining: limit, key };
  }
}

/** Give back one counted use, for a request that failed through no fault of the user. */
export async function refundRateLimit(rl: RateLimitResult): Promise<void> {
  try {
    await prisma.rateLimit.update({
      where: { key: rl.key },
      data: { count: { decrement: 1 } },
    });
  } catch {
    // Best effort — at worst the user loses one use for the day.
  }
}

/**
 * For an AI route's catch block: when every AI model is busy (AiBusyError),
 * refund the use and answer 503 { busy, retryAfter } so the browser waits and
 * retries (lib/aiFetch.ts) — without automatic retries eating the student's
 * daily quota. Returns null for any other error.
 */
export async function aiBusyResponse(
  err: unknown,
  rl: RateLimitResult,
): Promise<NextResponse | null> {
  if (!(err instanceof AiBusyError)) return null;
  await refundRateLimit(rl);
  return NextResponse.json(
    { error: err.message, busy: true, retryAfter: err.retryAfterSec },
    { status: 503, headers: { "Retry-After": String(err.retryAfterSec) } },
  );
}

export interface PublicRateLimitResult extends RateLimitResult {
  signedIn: boolean;
}

/**
 * Daily limit for the no-login tools. Anonymous visitors are counted per IP,
 * but a whole campus on one Wi-Fi shares an IP — so signed-in students are
 * counted per account instead: AI tools against their usual daily AI quota,
 * AI-free ones in their own per-user bucket.
 */
export async function consumePublicRateLimit(
  req: NextRequest,
  bucket: string,
  ipLimit: number,
  { usesAi }: { usesAi: boolean },
): Promise<PublicRateLimitResult> {
  const { userId } = await auth();
  if (userId) {
    const key = usesAi ? `u:${userId}:ai` : `u:${userId}:${bucket}`;
    return { ...(await consumeRateLimit(key, LIMITS.userAi)), signedIn: true };
  }
  const key = `ip:${getClientIp(req)}:${bucket}`;
  return { ...(await consumeRateLimit(key, ipLimit)), signedIn: false };
}

/**
 * The 429 for a used-up no-login limit. Anonymous visitors get `signIn: true`
 * so the page can offer a Sign in button (components/SignInToContinue.tsx).
 */
export function publicLimitResponse(
  rl: PublicRateLimitResult,
  message: string = PUBLIC_LIMIT_MESSAGE,
): NextResponse {
  return rl.signedIn
    ? NextResponse.json({ error: AI_LIMIT_MESSAGE }, { status: 429 })
    : NextResponse.json({ error: message, signIn: true }, { status: 429 });
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
  "You've used today's free checks on this network (everyone on the same Wi-Fi shares them). Sign in (it's free) to keep going; your checks then count just for you.";
