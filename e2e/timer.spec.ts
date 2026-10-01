import type { Page } from "@playwright/test";

import {
  clickAndConfirm,
  elapseTimer,
  expect,
  idea,
  LIVE_TIMEOUT,
  pick,
  seeRecap,
  setUpSession,
  startIdeas,
  suggestIdea,
  test,
  vote,
} from "./helpers";

// The countdown is computed in each browser from the end time the server sends. To make time
// pass, the end is moved into the past in the database (server and browsers stay in step),
// or the browser clock is moved forward when only the display matters.

const timer = (page: Page) => page.getByRole("timer", { name: "Time left for ideas" });

// The display rounds the end up and the current time down: up to one second more than the length.
const ROUNDING = 1;

/** Seconds left on the countdown ("4:58" → 298). */
async function secondsLeft(page: Page) {
  const [minutes, seconds] = (await timer(page).locator(".font-mono").innerText()).split(":").map(Number);
  return minutes * 60 + seconds;
}

/** Sam hosts with a 5-minute ideas timer, Lea has joined; both are on the ideas page. */
async function startWithTimer(page: Page, openAsGuest: (link: string) => Promise<Page>) {
  const { link, guest } = await setUpSession(page, openAsGuest);
  await pick(page, "5 min");
  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  return { link, guest };
}

test("there is no timer unless the host sets one", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await expect(page.getByRole("radio", { name: "None" })).toBeChecked();
  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });

  for (const p of [page, guest]) await expect(timer(p)).toHaveCount(0);
});

test("the countdown runs down for everyone, from the chosen length", async ({ page, openAsGuest }) => {
  const { guest } = await startWithTimer(page, openAsGuest);

  for (const p of [page, guest]) {
    await expect(timer(p)).toBeVisible();
    expect(await secondsLeft(p)).toBeGreaterThan(4 * 60);
    expect(await secondsLeft(p)).toBeLessThanOrEqual(5 * 60 + ROUNDING);
  }
  const before = await secondsLeft(guest);
  await expect.poll(() => secondsLeft(guest)).toBeLessThan(before);
});

test("only the host adds time or stops the timer", async ({ page, openAsGuest }) => {
  const { guest } = await startWithTimer(page, openAsGuest);
  await expect(guest.getByRole("button", { name: "+2 min" })).toHaveCount(0);
  await expect(guest.getByRole("button", { name: "Stop the timer" })).toHaveCount(0);

  // +2 min on a running timer: added to what is left.
  await page.getByRole("button", { name: "+2 min" }).click();
  await expect.poll(() => secondsLeft(page)).toBeGreaterThan(6 * 60);
  await expect.poll(() => secondsLeft(guest), { timeout: LIVE_TIMEOUT }).toBeGreaterThan(6 * 60);

  await page.getByRole("button", { name: "Stop the timer" }).click();
  await expect(timer(page)).toHaveCount(0);
  await expect(timer(guest)).toHaveCount(0, { timeout: LIVE_TIMEOUT });
  // Stopped for good: no controls left either.
  await expect(page.getByRole("button", { name: "+2 min" })).toHaveCount(0);
});

test("when time is up, nothing is locked", async ({ page, openAsGuest }) => {
  const { link, guest } = await startWithTimer(page, openAsGuest);
  await elapseTimer(link);
  await page.reload();
  await guest.reload();

  for (const p of [page, guest]) await expect(timer(p)).toHaveText("Time's up");
  // A cue to keep the pace, not a lock: ideas and votes still go in.
  await suggestIdea(guest, "Sushi");
  await expect(idea(page, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await vote(page, "Sushi", "For");

  // Time added after the end starts again from now.
  await page.getByRole("button", { name: "+2 min" }).click();
  await expect.poll(() => secondsLeft(page)).toBeGreaterThan(60);
  expect(await secondsLeft(page)).toBeLessThanOrEqual(2 * 60 + ROUNDING);
  await expect(timer(guest)).not.toHaveText("Time's up", { timeout: LIVE_TIMEOUT });
});

test("the last minute stands out, then the countdown ends by itself", async ({ page, openAsGuest }) => {
  await page.clock.install();
  await startWithTimer(page, openAsGuest);
  await expect(timer(page)).not.toHaveClass(/bg-highlight-soft/);

  await page.clock.fastForward("04:15");
  await expect(timer(page)).toHaveClass(/bg-highlight-soft/);
  expect(await secondsLeft(page)).toBeLessThanOrEqual(60);

  await page.clock.fastForward("01:00");
  await expect(timer(page)).toHaveText("Time's up");
});

test("the timer stops at the recap and starts again with the vote", async ({ page, openAsGuest }) => {
  const { guest } = await startWithTimer(page, openAsGuest);
  await seeRecap(page);
  await expect(timer(page)).toHaveCount(0);

  // Reopening the vote, or a new round, gives the full time again.
  await page.getByRole("button", { name: "Reopen voting" }).click();
  await expect(page).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect.poll(() => secondsLeft(page)).toBeGreaterThan(4 * 60 + 50);

  await seeRecap(page);
  await clickAndConfirm(page, "Go for another round");
  await expect(page).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  for (const p of [page, guest]) await expect.poll(() => secondsLeft(p)).toBeGreaterThan(4 * 60 + 50);

  // Back to the topics: no countdown while they are edited.
  await clickAndConfirm(page, "Edit the topics");
  await expect(page).toHaveURL(/\/themes$/, { timeout: LIVE_TIMEOUT });
  await expect(timer(page)).toHaveCount(0);
});
