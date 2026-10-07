import type { CDPSession, Page } from "@playwright/test";

import { POLL_INTERVAL_MS } from "../src/lib/config";
import type { OpenAsGuest } from "./helpers";
import {
  elapseTimer,
  expect,
  expireRoom,
  idea,
  LIVE_TIMEOUT,
  pick,
  seeRecap,
  setUpSession,
  setVisibility,
  startIdeas,
  suggestIdea,
  test,
} from "./helpers";

// A phone going to sleep: the page is hidden, then frozen (no timer, no request). On waking up,
// it becomes visible again and must show what the group did meanwhile.

type Sleeping = { page: Page; cdp: CDPSession; requests: () => number };

/** Hides then freezes the page; counts the requests it still makes while asleep. */
async function fallAsleep(page: Page): Promise<Sleeping> {
  await setVisibility(page, "hidden");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Page.setWebLifecycleState", { state: "frozen" });
  let count = 0;
  page.on("request", () => count++);
  return { page, cdp, requests: () => count };
}

async function wakeUp({ page, cdp }: Sleeping) {
  await cdp.send("Page.setWebLifecycleState", { state: "active" });
  await setVisibility(page, "visible");
}

/** Sam hosts, Lea follows into the ideas phase with "Pizza" suggested. */
async function inIdeas(page: Page, openAsGuest: OpenAsGuest, { timer = false } = {}) {
  const { link, guest } = await setUpSession(page, openAsGuest);
  if (timer) await pick(page, "5 min");
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });
  return { link, guest };
}

// Faster than the next polling round: the update comes from waking up itself.
const AT_ONCE = POLL_INTERVAL_MS - 1000;

test("an asleep page stays quiet, then shows the new ideas as soon as it wakes up", async ({ page, openAsGuest }) => {
  const { guest } = await inIdeas(page, openAsGuest);
  const asleep = await fallAsleep(guest);
  await suggestIdea(page, "Burger");
  await page.waitForTimeout(POLL_INTERVAL_MS * 2);
  expect(asleep.requests()).toBe(0);

  await wakeUp(asleep);
  await expect(idea(guest, "Burger")).toBeVisible({ timeout: AT_ONCE });
});

test("a step change made during the sleep is followed on waking up", async ({ page, openAsGuest }) => {
  const { guest } = await inIdeas(page, openAsGuest);
  const asleep = await fallAsleep(guest);
  await seeRecap(page);

  await wakeUp(asleep);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: AT_ONCE });
});

test("an ideas timer that ran out during the sleep shows time's up on waking up", async ({ page, openAsGuest }) => {
  const { link, guest } = await inIdeas(page, openAsGuest, { timer: true });
  await expect(guest.getByRole("timer")).toContainText(/\d:\d\d/);
  const asleep = await fallAsleep(guest);
  await elapseTimer(link);

  await wakeUp(asleep);
  await expect(guest.getByRole("timer")).toHaveText("Time's up", { timeout: AT_ONCE });
});

test("a session that expired during the sleep says so on waking up", async ({ page, openAsGuest }) => {
  const { link, guest } = await inIdeas(page, openAsGuest);
  const asleep = await fallAsleep(guest);
  await expireRoom(link);

  await wakeUp(asleep);
  await expect(guest.getByRole("heading", { name: "This session is no longer available" })).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("waking up before the network is back keeps the page, then catches up", async ({ page, openAsGuest }) => {
  const { guest } = await inIdeas(page, openAsGuest);
  const asleep = await fallAsleep(guest);
  await suggestIdea(page, "Burger");

  // The browser still reports being online, but nothing reaches the server yet.
  const server = new URL(guest.url()).origin + "/**";
  await guest.route(server, (route) => route.abort("internetdisconnected"));
  await wakeUp(asleep);
  await guest.waitForTimeout(POLL_INTERVAL_MS * 2);
  // A refresh attempted now would have swapped the page for the browser's own error page.
  await expect(guest).toHaveURL(/\/ideas$/);
  await expect(idea(guest, "Pizza")).toBeVisible();

  await guest.unroute(server);
  await expect(idea(guest, "Burger")).toBeVisible({ timeout: LIVE_TIMEOUT });
});
