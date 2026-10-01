import "server-only";

import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Rate limiting is optional, like Pusher: without Upstash environment variables (local
// development), nothing is limited. If Upstash is slow or down, requests go through.

type Bucket = "createRoom" | "joinRoom" | "participant";

/** Sliding windows. Generous enough for a whole team behind the same office IP. */
const RULES: Record<Bucket, { requests: number; window: Duration }> = {
  // Per IP: each room is a row kept 7 days.
  createRoom: { requests: 10, window: "1 h" },
  // Per IP: a seat is limited to 6 per room, but each join is a row and a cookie.
  joinRoom: { requests: 30, window: "10 m" },
  // Per participant, every action: each one writes and sends a real-time message.
  participant: { requests: 120, window: "1 m" },
};

let limiters: Record<Bucket, Ratelimit> | null | undefined;

function getLimiters(): Record<Bucket, Ratelimit> | null {
  if (limiters !== undefined) return limiters;
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  if (!url || !token) return (limiters = null);
  // A single retry: past the 1 s timeout, the request has gone through anyway.
  const redis = new Redis({ url, token, retry: { retries: 1 } });
  const make = (bucket: Bucket) =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RULES[bucket].requests, RULES[bucket].window),
      prefix: `virgule:${bucket}`,
      // Blocked keys are remembered in memory: no Redis call while the function stays warm.
      ephemeralCache: new Map(),
      timeout: 1000,
    });
  return (limiters = { createRoom: make("createRoom"), joinRoom: make("joinRoom"), participant: make("participant") });
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
  const limiter = getLimiters()?.[bucket];
  if (!limiter) return false;
  try {
    const { success, reason } = await limiter.limit(key ?? clientIpFrom(await headers()));
    if (reason === "timeout") console.error("[rate-limit] Upstash timed out, request let through");
    return !success;
  } catch (error) {
    console.error("[rate-limit] check failed", error);
    return false;
  }
}
