import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

import { MemoryRateLimiter } from "@/lib/memory-rate-limit";

// Rate limiting uses Upstash Redis when its environment variables are set: the recommended
// production setup, shared by every serverless instance. Without them (local development, the
// end-to-end tests, a deployment that skipped Upstash), the same limits apply in memory, per
// process: each instance counts on its own and a cold start resets it, so it slows down a script
// hammering one instance without being a fleet-wide guarantee. If Upstash is slow or down,
// requests go through.

type Bucket = "createRoom" | "joinRoom" | "pairScreen" | "pairScreenGlobal" | "participant";

const MINUTE = 60_000;

/** Sliding windows. Generous enough for a whole team behind the same office IP. */
const RULES: Record<Bucket, { requests: number; windowMs: number }> = {
  // Per IP: each room is a row kept 7 days.
  createRoom: { requests: 10, windowMs: 60 * MINUTE },
  // Per IP: a seat is limited to 6 per room, but each join is a row and a cookie.
  joinRoom: { requests: 30, windowMs: 10 * MINUTE },
  // Per IP: a wrong pairing code costs a try, so codes cannot be guessed by trying them all.
  pairScreen: { requests: 10, windowMs: 10 * MINUTE },
  // Every IP together (a single key): a code is checked against every session, so many IPs
  // trying codes at once would add up. Far above what real screens being paired need.
  pairScreenGlobal: { requests: 300, windowMs: 10 * MINUTE },
  // Per participant, every action: each one writes and sends a real-time message.
  participant: { requests: 120, windowMs: MINUTE },
};

const BUCKETS = Object.keys(RULES) as Bucket[];

/**
 * `RATE_LIMIT_MULTIPLIER` scales every quota (default 1). Only the end-to-end tests set it: their
 * hundreds of rooms all come from the same address. Never set in production.
 */
function multiplier(): number {
  const value = Number(process.env.RATE_LIMIT_MULTIPLIER);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** Counts a request for `key`: true if it is within the quota. */
type Limiter = (key: string) => Promise<boolean>;

let limiters: Record<Bucket, Limiter> | undefined;

function getLimiters(): Record<Bucket, Limiter> {
  if (limiters) return limiters;
  const scale = multiplier();
  const requests = (bucket: Bucket) => Math.max(1, Math.round(RULES[bucket].requests * scale));
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  const build = (make: (bucket: Bucket) => Limiter) =>
    Object.fromEntries(BUCKETS.map((bucket) => [bucket, make(bucket)])) as Record<Bucket, Limiter>;

  if (!url || !token) {
    return (limiters = build((bucket) => {
      const limiter = new MemoryRateLimiter(requests(bucket), RULES[bucket].windowMs);
      return async (key) => limiter.limit(key);
    }));
  }

  // A single retry: past the 1 s timeout, the request has gone through anyway.
  const redis = new Redis({ url, token, retry: { retries: 1 } });
  return (limiters = build((bucket) => {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests(bucket), `${RULES[bucket].windowMs} ms`),
      prefix: `virgule:${bucket}`,
      // Blocked keys are remembered in memory: no Redis call while the function stays warm.
      ephemeralCache: new Map(),
      timeout: 1000,
    });
    return async (key) => {
      const { success, reason } = await limiter.limit(key);
      if (reason === "timeout") console.error("[rate-limit] Upstash timed out, request let through");
      return success;
    };
  }));
}

/**
 * Client IP. On Vercel, `x-forwarded-for` is set by the platform (a value sent by the client
 * is overwritten), its first entry is the client.
 */
export function clientIpFrom(requestHeaders: Headers): string {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip")?.trim() || "unknown";
}

/** True if `key` has used up its quota for this bucket (`key` defaults to the client IP). */
export async function isRateLimited(bucket: Bucket, key?: string): Promise<boolean> {
  try {
    return !(await getLimiters()[bucket](key ?? clientIpFrom(await headers())));
  } catch (error) {
    console.error("[rate-limit] check failed", error);
    return false;
  }
}
