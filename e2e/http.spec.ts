import { expect, setUpSession, test } from "./helpers";

// What the server says around the pages: security headers, search engines kept out of
// sessions, status codes, and the daily purge kept to Vercel's cron.

const SECURITY_HEADERS = {
  "content-security-policy": "frame-ancestors 'none'",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

test("every answer carries the security headers", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  for (const url of ["/", link, `${link}/phase`, "/r/doesnotexist"]) {
    const response = await page.request.get(url, { maxRedirects: 0 });
    const headers = response.headers();
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(headers[name], `${name} on ${url}`).toBe(value);
    }
    expect(headers["permissions-policy"], `permissions-policy on ${url}`).toContain("camera=()");
  }
});

test("sessions stay out of search engines, the home page does not", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const stranger = await openAsGuest(link);
  await expect(stranger.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
});

test("an unknown session answers 404", async ({ page }) => {
  const response = await page.goto("/r/doesnotexist");
  expect(response?.status()).toBe(404);
});

test("the daily purge refuses anyone without the cron secret", async ({ request }) => {
  expect((await request.get("/api/cron/purge")).status()).toBe(401);
  const guessed = await request.get("/api/cron/purge", { headers: { authorization: "Bearer guess" } });
  expect(guessed.status()).toBe(401);
  // Without a secret set (as here), even an empty one is refused: no open purge by mistake.
  const empty = await request.get("/api/cron/purge", { headers: { authorization: "Bearer " } });
  expect(empty.status()).toBe(401);
});
