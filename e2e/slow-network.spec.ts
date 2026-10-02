import type { Page } from "@playwright/test";

import { POLL_INTERVAL_MS } from "../src/lib/config";
import type { OpenAsGuest } from "./helpers";
import { countRooms, expect, idea, LIVE_TIMEOUT, seeRecap, setUpSession, startIdeas, suggestIdea, test } from "./helpers";

// A poor mobile connection: each request takes longer than the polling interval, so updates
// overlap and actions wait behind them. Nothing may be lost, doubled or shown out of order.

// Above the polling interval, the worst case: several updates are under way at once.
const LATENCY = POLL_INTERVAL_MS + 1000;
// A few round trips at that latency.
const SLOW_TIMEOUT = 30_000;

/** Emulates the slow connection for this page only (Chromium, through CDP). */
async function slowNetwork(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: LATENCY,
    downloadThroughput: 50_000,
    uploadThroughput: 20_000,
  });
}

/** Sam hosts, Lea follows into the ideas phase with "Pizza" and "Sushi" suggested, on a slow phone. */
async function slowGuestInIdeas(page: Page, openAsGuest: OpenAsGuest) {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await suggestIdea(page, "Sushi");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await slowNetwork(guest);
  // Updates pile up before anything else happens.
  await guest.waitForTimeout(POLL_INTERVAL_MS * 2);
  return guest;
}

test.beforeEach(() => test.slow());

test("the page keeps up with the group on a connection slower than the polling", async ({ page, openAsGuest }) => {
  const guest = await slowGuestInIdeas(page, openAsGuest);
  // Each update takes longer than the polling interval: were a new one to replace the one under
  // way, none would ever land.
  for (const content of ["Burger", "Tacos"]) {
    await suggestIdea(page, content);
    await expect(idea(guest, content)).toBeVisible({ timeout: SLOW_TIMEOUT });
  }
});

test("a vote shows at once and stays as cast, even changed in a hurry", async ({ page, openAsGuest }) => {
  const guest = await slowGuestInIdeas(page, openAsGuest);
  const upvote = idea(guest, "Pizza").getByRole("button", { name: "For" });
  const downvote = idea(guest, "Pizza").getByRole("button", { name: "Against" });

  // Every state the buttons go through, recorded in the page while updates sent before the
  // votes keep arriving.
  await idea(guest, "Pizza").evaluate((item) => {
    const buttons = [...item.querySelectorAll("button[aria-pressed]")];
    const states: string[] = [];
    const record = () => {
      const state = buttons.map((b) => b.getAttribute("aria-pressed")).join("/");
      if (states.at(-1) !== state) states.push(state);
    };
    new MutationObserver(record).observe(item, { attributes: true, subtree: true, attributeFilter: ["aria-pressed"] });
    Object.assign(window, { voteStates: states });
  });
  await upvote.click();
  await expect(upvote).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  await downvote.click();
  await expect(downvote).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  await guest.waitForTimeout(LATENCY * 4);
  const states = await guest.evaluate(() => (window as unknown as { voteStates: string[] }).voteStates);

  // No flicker back to an earlier vote: For, then Against, then nothing else.
  expect(states.filter((state) => state !== "false/false")).toEqual(["true/false", "false/true"]);
  await guest.reload({ timeout: SLOW_TIMEOUT });
  await expect(idea(guest, "Pizza").getByRole("button", { name: "Against" })).toHaveAttribute("aria-pressed", "true", {
    timeout: SLOW_TIMEOUT,
  });
});

test("a double tap on a slow phone suggests the idea once", async ({ page, openAsGuest }) => {
  const guest = await slowGuestInIdeas(page, openAsGuest);
  await guest.getByLabel("Your idea…").fill("Tacos");
  const add = guest.getByRole("button", { name: "Add", exact: true });
  await add.click();
  // The button waits for the answer: the second tap does nothing.
  await expect(add).toBeDisabled();
  await add.click({ force: true });

  await expect(idea(guest, "Tacos")).toBeVisible({ timeout: SLOW_TIMEOUT });
  await expect(idea(page, "Tacos")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await guest.waitForTimeout(LATENCY * 2);
  await expect(idea(page, "Tacos")).toHaveCount(1);
});

test("a double tap on Create the session creates a single session", async ({ page }) => {
  // Unique to this run: the database keeps the sessions of earlier tests and repeats.
  const name = `Slow club ${Date.now()}`;
  await page.goto("/");
  const create = page.getByRole("button", { name: "Create the session" });
  await expect(async () => {
    await page.getByLabel("Session name").fill(name);
    await page.getByLabel("Your first name").fill("Sam");
    await expect(create).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await slowNetwork(page);

  await create.click();
  await expect(create).toBeDisabled();
  await create.click({ force: true });
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: SLOW_TIMEOUT });
  expect(await countRooms(name)).toBe(1);
});

test("a step change reaches a slow phone and never goes back", async ({ page, openAsGuest }) => {
  const guest = await slowGuestInIdeas(page, openAsGuest);
  const visited: string[] = [];
  guest.on("framenavigated", (frame) => frame === guest.mainFrame() && visited.push(new URL(frame.url()).pathname));

  await seeRecap(page);
  await expect(guest.getByRole("heading", { name: "The recap" })).toBeVisible({ timeout: SLOW_TIMEOUT });
  // Updates sent before the change keep arriving: none may take the page back to the ideas.
  await guest.waitForTimeout(LATENCY * 3);
  const firstRecap = visited.findIndex((path) => path.endsWith("/recap"));
  expect(firstRecap).toBeGreaterThanOrEqual(0);
  expect(visited.slice(firstRecap).every((path) => path.endsWith("/recap"))).toBe(true);
  await expect(guest).toHaveURL(/\/recap$/);
});
