import type { Page } from "@playwright/test";

import { POLL_INTERVAL_MS } from "../src/lib/config";
import type { OpenAsGuest } from "./helpers";
import { expect, idea, LIVE_TIMEOUT, setUpSession, startIdeas, suggestIdea, test } from "./helpers";

// Switching networks (Wi-Fi to mobile data, one access point to the next): the browser still
// reports being online, but the requests under way are lost. Offline proper is in offline.spec.ts,
// Pusher's own reconnection in pusher.spec.ts.

/** Every request to the app fails as if the connection were switching; returns the way back. */
async function switchNetwork(page: Page) {
  const app = new URL(page.url()).origin + "/**";
  await page.route(app, (route) => route.abort("internetdisconnected"));
  return () => page.unroute(app);
}

/** Sam hosts, Lea follows into the ideas phase with "Pizza" suggested. */
async function inIdeas(page: Page, openAsGuest: OpenAsGuest) {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });
  return guest;
}

const toast = (page: Page, text: string) => page.getByRole("region", { name: /Notifications/ }).getByText(text);

const DROPPED = "The connection dropped. Try again.";

test("a vote lost in a network switch says so, and the step stays on screen", async ({ page, openAsGuest }) => {
  const guest = await inIdeas(page, openAsGuest);
  const upvote = idea(guest, "Pizza").getByRole("button", { name: "For" });

  const restore = await switchNetwork(guest);
  await upvote.click();
  await expect(toast(guest, DROPPED)).toBeVisible();
  // Not the step's error page: the ideas stay, and the vote goes back.
  await expect(guest.getByRole("heading", { name: "The ideas" })).toBeVisible();
  await expect(upvote).toHaveAttribute("aria-pressed", "false");

  await restore();
  await upvote.click();
  await expect(upvote).toHaveAttribute("aria-pressed", "true");
  await guest.reload();
  await expect(idea(guest, "Pizza").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");
});

test("an idea lost in a network switch keeps its text for another try", async ({ page, openAsGuest }) => {
  const guest = await inIdeas(page, openAsGuest);
  const field = guest.getByLabel("Your idea…");
  const add = guest.getByRole("button", { name: "Add", exact: true });

  const restore = await switchNetwork(guest);
  await field.fill("Tacos");
  await add.click();
  await expect(toast(guest, DROPPED)).toBeVisible();
  await expect(field).toHaveValue("Tacos");

  await restore();
  await add.click();
  await expect(idea(guest, "Tacos")).toBeVisible();
  await expect(idea(page, "Tacos")).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("creating a session during a network switch keeps the form filled", async ({ page }) => {
  await page.goto("/");
  const name = page.getByLabel("Session name");
  const create = page.getByRole("button", { name: "Create the session" });
  // Typed again until the page has hydrated (a field filled before is reset).
  await expect(async () => {
    await name.fill("Friday night");
    await page.getByLabel("Your first name").fill("Sam");
    await expect(create).toBeEnabled({ timeout: 1000 });
  }).toPass();

  const restore = await switchNetwork(page);
  await create.click();
  await expect(toast(page, DROPPED)).toBeVisible();
  await expect(name).toHaveValue("Friday night");

  await restore();
  await create.click();
  await expect(page.getByRole("heading", { level: 1, name: "Friday night" })).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("updates lost in a network switch leave the page as is, then catch up", async ({ page, openAsGuest }) => {
  const guest = await inIdeas(page, openAsGuest);
  const restore = await switchNetwork(guest);
  await suggestIdea(page, "Burger");

  // Several polling rounds fail: the page stays, rather than the browser's error page.
  await guest.waitForTimeout(POLL_INTERVAL_MS * 2);
  await expect(guest).toHaveURL(/\/ideas$/);
  await expect(idea(guest, "Pizza")).toBeVisible();

  await restore();
  await expect(idea(guest, "Burger")).toBeVisible({ timeout: LIVE_TIMEOUT });
});
