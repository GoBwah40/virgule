import type { Page } from "@playwright/test";

import { POLL_INTERVAL_MS } from "../src/lib/config";
import type { OpenAsGuest } from "./helpers";
import {
  clickAndConfirm,
  createRoom,
  expect,
  join,
  LIVE_TIMEOUT,
  seeRecap,
  setPhase,
  setUpSession,
  startIdeas,
  suggestIdea,
  test,
} from "./helpers";

// The browser's back and forward buttons, and links to a step other than the current one. A
// session's steps are not pages one walks through: whatever the history says, the current step
// shows, and going back leaves the session rather than going round in circles.

// Faster than the next polling round: the update comes from the navigation itself.
const AT_ONCE = POLL_INTERVAL_MS - 1000;

/** Sam hosts, Lea followed him into the ideas phase (so her history holds the topics page). */
async function guestFollowedToIdeas(page: Page, openAsGuest: OpenAsGuest) {
  const { link, guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  return { link, guest };
}

/** Presses back until the page leaves the session, waiting for each page to settle. */
async function backUntilOutOf(page: Page, max: number) {
  for (let presses = 1; presses <= max; presses++) {
    await page.goBack();
    // Room for a stale step to be corrected before the next press.
    await page.waitForTimeout(AT_ONCE);
    if (!new URL(page.url()).pathname.startsWith("/r/")) return presses;
  }
  return Infinity;
}

test("going back to a past step brings the current one at once", async ({ page, openAsGuest }) => {
  const { guest } = await guestFollowedToIdeas(page, openAsGuest);
  await guest.goBack();
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: AT_ONCE });
  await expect(guest.getByRole("heading", { name: "The ideas" })).toBeVisible();
});

test("back and forward after the step moved on both show the current step", async ({ page, openAsGuest }) => {
  const { guest } = await guestFollowedToIdeas(page, openAsGuest);
  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });

  await guest.goBack();
  await expect(guest).toHaveURL(/\/recap$/, { timeout: AT_ONCE });
  await guest.goForward().catch(() => {});
  await expect(guest).toHaveURL(/\/recap$/, { timeout: AT_ONCE });
  await expect(guest.getByRole("heading", { name: "The recap" })).toBeVisible();
});

test("the back button leaves the session instead of going round in circles", async ({ page, openAsGuest }) => {
  // Sam came from the home page and went through every step.
  const { guest } = await guestFollowedToIdeas(page, openAsGuest);
  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });

  // At most one press per page Sam went through (home, topics, ideas, recap).
  expect(await backUntilOutOf(page, 4)).toBeLessThanOrEqual(4);
  await expect(page.getByRole("button", { name: "Create the session" })).toBeVisible();
});

test("a page restored from the browser's history catches up at once", async ({ page, openAsGuest }) => {
  const { guest } = await guestFollowedToIdeas(page, openAsGuest);
  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });

  // Lea goes to another site; the session ends meanwhile; she comes back.
  await guest.goto("about:blank");
  await clickAndConfirm(page, "End the session");
  await guest.goBack();
  await expect(guest.getByRole("heading", { name: "It's decided" })).toBeVisible({ timeout: AT_ONCE });
});

test("back after leaving shows the join screen, not the session", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await clickAndConfirm(guest, "Leave the session");
  await expect(guest.getByRole("button", { name: "Create the session" })).toBeVisible({ timeout: LIVE_TIMEOUT });

  await guest.goBack();
  await expect(guest.getByRole("button", { name: "Join the session" })).toBeVisible();
  await expect(guest.getByRole("button", { name: "Leave the session" })).toHaveCount(0);
});

test("back after joining stays in the session", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  const newcomer = await openAsGuest(link);
  await join(newcomer, "Noe");

  await newcomer.goBack();
  // Never the join form again, which would offer a second seat.
  await expect(newcomer.getByText("Sam is preparing the topics, and you can suggest some. What comes next will show up here automatically.")).toBeVisible();
  await expect(newcomer.getByRole("button", { name: "Join the session" })).toHaveCount(0);
});

test("back after creating a session goes home, and forward comes back to it", async ({ page }) => {
  await createRoom(page, { name: "Friday night", host: "Sam" });
  await page.goBack();
  await expect(page.getByRole("button", { name: "Create the session" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { level: 1, name: "Friday night" })).toBeVisible();
});

test("a link to another step leads to the current one", async ({ page, openAsGuest }) => {
  const { link, guest } = await guestFollowedToIdeas(page, openAsGuest);
  for (const step of ["themes", "recap", ""]) {
    await guest.goto(`${link}/${step}`);
    await expect(guest).toHaveURL(/\/ideas$/);
  }
  await setPhase(link, "RECAP");
  for (const step of ["themes", "ideas"]) {
    await guest.goto(`${link}/${step}`);
    await expect(guest).toHaveURL(/\/recap$/);
  }
});

test("a link to a step that does not exist shows the not-found page", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  const response = await page.goto(`${link}/votes`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Session not found" })).toBeVisible();
});
