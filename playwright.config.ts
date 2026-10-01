import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// End-to-end tests: the production build of the app, against a dedicated SQLite database
// (`e2e.db`, recreated on each run). Every external service is switched off: no Turso, no
// Pusher (the app syncs by polling), no rate limiting.
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
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `rm -f e2e.db && prisma migrate deploy && next build && next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Never reuse a server already on the port: it would serve an older build, and the tests
    // would check stale code without saying so. A busy port stops the run with an explicit error.
    reuseExistingServer: false,
    // Includes the build.
    timeout: 300_000,
    // Explicit values win over the .env files loaded by Prisma and Next.js.
    env: {
      DATABASE_URL: "file:./e2e.db",
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      PUSHER_APP_ID: "",
      PUSHER_SECRET: "",
      NEXT_PUBLIC_PUSHER_KEY: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
    },
  },
});
