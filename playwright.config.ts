import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// Second server on the same build, with Pusher turned on and its own database: e2e/pusher.spec.ts
// plays the Pusher server in the browser (page.routeWebSocket). Nothing ever reaches Pusher.
const PUSHER_PORT = 3101;

// Explicit values win over the .env files loaded by Prisma and Next.js.
const offline = {
  TURSO_DATABASE_URL: "",
  TURSO_AUTH_TOKEN: "",
  PUSHER_APP_ID: "",
  PUSHER_SECRET: "",
  NEXT_PUBLIC_PUSHER_KEY: "",
  NEXT_PUBLIC_PUSHER_CLUSTER: "",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",
  // Without Upstash, the limits apply in memory. Every test comes from the same address (hundreds
  // of rooms created, joined and paired): the quotas are scaled up rather than switched off.
  RATE_LIMIT_MULTIPLIER: "1000",
};

// End-to-end tests: the production build of the app, against a dedicated SQLite database
// (`e2e.db`, recreated on each run). Every external service is switched off: no Turso, no
// Pusher (the app syncs by polling, except on the second server below), no Upstash (the
// in-memory rate limits apply, scaled up).
// Production build rather than `next dev`: dev renders too slowly once several sessions poll
// at once (page refreshes took up to 14 s), and the tests waiting on them failed at random.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // The 4 vCPUs of a GitHub runner also run the server and every browser.
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  // Mobile first: the app is mostly used on a phone.
  projects: [
    { name: "mobile", testIgnore: "pusher.spec.ts", use: { ...devices["Pixel 7"] } },
    {
      name: "mobile-pusher",
      testMatch: "pusher.spec.ts",
      use: { ...devices["Pixel 7"], baseURL: `http://localhost:${PUSHER_PORT}` },
    },
  ],
  webServer: [
    {
      command: `rm -f e2e.db e2e.db-wal e2e.db-shm && prisma migrate deploy && next build && next start --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      // Never reuse a server already on the port: it would serve an older build, and the tests
      // would check stale code without saying so. A busy port stops the run with an explicit error.
      reuseExistingServer: false,
      // Includes the build.
      timeout: 300_000,
      env: { ...offline, DATABASE_URL: "file:./e2e.db" },
    },
    {
      // Starts once the first server answers, so on the build it has just made.
      command: `rm -f e2e-pusher.db e2e-pusher.db-wal e2e-pusher.db-shm && prisma migrate deploy && until curl -sf -o /dev/null http://localhost:${PORT}; do sleep 1; done && next start --port ${PUSHER_PORT}`,
      url: `http://localhost:${PUSHER_PORT}`,
      reuseExistingServer: false,
      timeout: 300_000,
      // A public key and a cluster only: the browser connects (to the test), the server sends
      // nothing (no app id or secret).
      env: { ...offline, DATABASE_URL: "file:./e2e-pusher.db", NEXT_PUBLIC_PUSHER_KEY: "e2e-key", NEXT_PUBLIC_PUSHER_CLUSTER: "e2e" },
    },
  ],
});
