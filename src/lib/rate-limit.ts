import { prisma } from "@/lib/prisma";

/**
 * Simple Postgres-backed rate limiting for expensive, per-user, LLM-backed
 * actions (e.g. interview generation).
 *
 * We deliberately do NOT use an in-memory counter here: this app can run as
 * multiple serverless instances, and an in-memory map would reset per
 * instance/cold-start and give every instance its own independent quota,
 * which is not a real limit. Postgres (already required by this app) is the
 * single source of truth, so we lean on it instead of adding a new
 * dependency like Redis/Upstash just for this.
 *
 * This keys off the `Interview` table itself (one row per successful
 * generation) rather than a separate rate-limit table, since "how many
 * interviews has this user generated recently" is exactly what we already
 * store.
 */

// Minimum time a user must wait between two interview generations.
// Stops double-clicks / rapid retries from doubling up Gemini calls.
const COOLDOWN_MS = 20_000; // 20 seconds

// Maximum number of interviews a user may generate within the rolling window.
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 8;

export type RateLimitResult =
  | { limited: false }
  | { limited: true; reason: "cooldown" | "window"; retryAfterSeconds: number };

export async function checkInterviewGenerationRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(now - WINDOW_MS);

  const [mostRecent, countInWindow] = await Promise.all([
    prisma.interview.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.interview.count({
      where: { userId, createdAt: { gte: windowStart } },
    }),
  ]);

  if (mostRecent) {
    const elapsedMs = now - mostRecent.createdAt.getTime();

    if (elapsedMs < COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((COOLDOWN_MS - elapsedMs) / 1000);
      return { limited: true, reason: "cooldown", retryAfterSeconds };
    }
  }

  if (countInWindow >= MAX_PER_WINDOW) {
    // Everyone in the window counts toward the cap, so the earliest possible
    // retry is roughly when the window has fully rolled over. We don't track
    // the exact oldest timestamp here to keep this to two queries; a coarse
    // "try again in a bit" is fine for a cap this generous.
    const retryAfterSeconds = Math.ceil(WINDOW_MS / 1000);
    return { limited: true, reason: "window", retryAfterSeconds };
  }

  return { limited: false };
}