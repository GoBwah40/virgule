import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));

// Upstash simulated: `limit` answers whatever the test needs.
const limit = vi.fn();
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    class {
      limit = limit;
    },
    { slidingWindow: () => ({}) },
  ),
}));

/** Fresh module for each test: the limiters are created once per process. */
const load = () => import("@/lib/rate-limit");

beforeEach(() => {
  vi.resetModules();
  limit.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const configureUpstash = () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
};

const withoutUpstash = () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
};

describe("clientIpFrom", () => {
  it("takes the first entry of x-forwarded-for", async () => {
    const { clientIpFrom } = await load();
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to a shared key", async () => {
    const { clientIpFrom } = await load();
    expect(clientIpFrom(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});

describe("isRateLimited", () => {
  it("applies the same limits in memory without Upstash configured", async () => {
    withoutUpstash();
    const { isRateLimited } = await load();
    for (let i = 0; i < 10; i++) expect(await isRateLimited("pairScreen")).toBe(false);
    expect(await isRateLimited("pairScreen")).toBe(true);
    // Another key, another bucket: counted apart.
    expect(await isRateLimited("pairScreen", "198.51.100.2")).toBe(false);
    expect(await isRateLimited("joinRoom")).toBe(false);
    expect(limit).not.toHaveBeenCalled();
  });

  it("scales every quota with RATE_LIMIT_MULTIPLIER", async () => {
    withoutUpstash();
    vi.stubEnv("RATE_LIMIT_MULTIPLIER", "2");
    const { isRateLimited } = await load();
    for (let i = 0; i < 20; i++) expect(await isRateLimited("createRoom")).toBe(false);
    expect(await isRateLimited("createRoom")).toBe(true);
  });

  it("ignores an invalid RATE_LIMIT_MULTIPLIER", async () => {
    withoutUpstash();
    vi.stubEnv("RATE_LIMIT_MULTIPLIER", "-5");
    const { isRateLimited } = await load();
    for (let i = 0; i < 10; i++) expect(await isRateLimited("createRoom")).toBe(false);
    expect(await isRateLimited("createRoom")).toBe(true);
  });

  it("blocks once the quota is used up, keyed by IP by default", async () => {
    configureUpstash();
    limit.mockResolvedValue({ success: false });
    const { isRateLimited } = await load();
    expect(await isRateLimited("createRoom")).toBe(true);
    expect(limit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("uses the given key", async () => {
    configureUpstash();
    limit.mockResolvedValue({ success: true });
    const { isRateLimited } = await load();
    expect(await isRateLimited("participant", "p1")).toBe(false);
    expect(limit).toHaveBeenCalledWith("p1");
  });

  it("lets the request through when Upstash fails", async () => {
    configureUpstash();
    limit.mockRejectedValue(new Error("fetch failed"));
    const { isRateLimited } = await load();
    expect(await isRateLimited("joinRoom")).toBe(false);
  });
});
