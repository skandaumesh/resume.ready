// ─────────────────────────────────────────────────────────────────────────
// First-party analytics: one Postgres row per meaningful product event.
// No external service, no cookies, no PII beyond the Clerk user id we already
// hold. This is the data source for honest stats ("average ATS score",
// "checks run this week") and for knowing which tools people actually use.
//
// Query examples (prisma studio / SQL):
//   avg score:   SELECT AVG((meta->>'score')::int) FROM "Event" WHERE name='ats_checked';
//   tool usage:  SELECT name, COUNT(*) FROM "Event" GROUP BY 1 ORDER BY 2 DESC;
// ─────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";

/** Fire-and-forget event. Never throws; analytics must never break the app. */
export async function track(
  name: string,
  userId?: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        name,
        userId: userId ?? null,
        meta: (meta ?? {}) as object,
      },
    });
  } catch {
    // Swallow: a failed analytics write must not fail the request.
  }
}
