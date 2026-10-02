import type { Page } from "@playwright/test";

import { POLL_INTERVAL_MS } from "../src/lib/config";
import type { OpenAsGuest } from "./helpers";
import {
  choose,
  clickAndConfirm,
  createRoom,
  expect,
  idea,
  LIVE_TIMEOUT,
  setUpSession,
  startIdeas,
  suggestIdea,
  test,
  vote,
} from "./helpers";

// The same person with the session open in several tabs: one browser context, so the same
// cookies (one per session). Every tab must end up showing the same thing.

/** A second tab for whoever is on `page`, on the same link. */
async function secondTab(page: Page) {
  const tab = await page.context().newPage();
  await tab.goto(page.url());
  return tab;
}

/** Sam hosts, Lea follows into the ideas phase with "Pizza" suggested, in two tabs. */
async function leaInTwoTabs(page: Page, openAsGuest: OpenAsGuest) {
  const { link, guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  const other = await secondTab(guest);
  await expect(idea(other, "Pizza")).toBeVisible();
  return { link, tab: guest, other };
}

const pressed = (page: Page, content: string, choice: "For" | "Against") =>
  idea(page, content).getByRole("button", { name: choice });

test("a vote cast in one tab shows in the other", async ({ page, openAsGuest }) => {
  const { tab, other } = await leaInTwoTabs(page, openAsGuest);
  await vote(tab, "Pizza", "For");
  await expect(pressed(other, "Pizza", "For")).toHaveAttribute("aria-pressed", "true", { timeout: LIVE_TIMEOUT });
});

test("votes changed in both tabs at once end the same in both", async ({ page, openAsGuest }) => {
  const { tab, other } = await leaInTwoTabs(page, openAsGuest);
  await pressed(tab, "Pizza", "For").click();
  await pressed(other, "Pizza", "Against").click();

  // The last vote sent wins, in both tabs and after a reload.
  for (const p of [tab, other]) {
    await expect(pressed(p, "Pizza", "Against")).toHaveAttribute("aria-pressed", "true", { timeout: LIVE_TIMEOUT });
    await expect(pressed(p, "Pizza", "For")).toHaveAttribute("aria-pressed", "false");
  }
  await tab.reload();
  await expect(pressed(tab, "Pizza", "Against")).toHaveAttribute("aria-pressed", "true");
});

test("an idea suggested in one tab shows in the other as one's own", async ({ page, openAsGuest }) => {
  const { tab, other } = await leaInTwoTabs(page, openAsGuest);
  await suggestIdea(tab, "Tacos");
  const tacos = idea(other, "Tacos");
  await expect(tacos).toBeVisible({ timeout: LIVE_TIMEOUT });
  // Lea's own idea in the other tab too: marked, removable, no vote on it.
  await expect(tacos.getByText("Your idea")).toBeVisible();
  await expect(tacos.getByRole("button", { name: "Remove my idea" })).toBeVisible();

  // Removed from the other tab, gone from the first.
  await tacos.getByRole("button", { name: "Remove my idea" }).click();
  await expect(idea(tab, "Tacos")).toHaveCount(0, { timeout: LIVE_TIMEOUT });
});

test("leaving in one tab sends the other back to the join screen", async ({ page, openAsGuest }) => {
  const { tab, other } = await leaInTwoTabs(page, openAsGuest);
  await clickAndConfirm(tab, "Leave the session");

  await expect(other.getByRole("button", { name: "Join the session" })).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(idea(other, "Pizza")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "1 participant out of 6" })).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("handing over hosting in one tab takes the host controls from the other", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  const hostTab = await secondTab(page);
  await expect(hostTab.getByRole("button", { name: "Start the ideas" })).toBeVisible();

  await page.getByRole("button", { name: "Lea's seat: options" }).click();
  await page.getByRole("menuitem", { name: "Hand over hosting" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Hand over hosting" }).click();

  await expect(hostTab.getByRole("button", { name: "Start the ideas" })).toHaveCount(0, { timeout: LIVE_TIMEOUT });
  await expect(hostTab.getByLabel("Lea · is hosting")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Start the ideas" })).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("two sessions in two tabs keep each their own seat", async ({ page, openAsGuest }) => {
  const { link, tab } = await leaInTwoTabs(page, openAsGuest);
  // Lea starts her own session in another tab of the same browser.
  const own = await tab.context().newPage();
  await createRoom(own, { name: "Saturday brunch", host: "Lea" });
  await expect(own.getByRole("button", { name: "Start the ideas" })).toBeVisible();

  // Still a guest in Sam's session, with her seat.
  await tab.goto(link);
  await expect(tab).toHaveURL(/\/ideas$/);
  await expect(tab.getByRole("button", { name: "See the recap" })).toHaveCount(0);
  await vote(tab, "Pizza", "For");
  await own.reload();
  await expect(own.getByRole("heading", { level: 1, name: "Saturday brunch" })).toBeVisible();
  await expect(own.getByRole("button", { name: "Start the ideas" })).toBeVisible();
});

test("the theme and language picked in one tab follow in the others", async ({ page, openAsGuest }) => {
  const { tab, other } = await leaInTwoTabs(page, openAsGuest);
  await choose(tab, "Theme", "Dark");
  await choose(tab, "Language", "Français");

  // On the other tab's next update.
  await expect(other.locator("html")).toHaveAttribute("data-theme", "dark", { timeout: LIVE_TIMEOUT });
  await expect(other.locator("html")).toHaveAttribute("lang", "fr", { timeout: LIVE_TIMEOUT });
  await expect(other.getByRole("heading", { name: "Les idées" })).toBeVisible();
});

test("a tab in the background stays quiet, then catches up once shown", async ({ page, openAsGuest }) => {
  const { tab, other } = await leaInTwoTabs(page, openAsGuest);
  // Headless tabs all count as visible: tell `other` it went to the background, as the browser
  // would when Lea switches to `tab`.
  const setVisibility = (state: DocumentVisibilityState) =>
    other.evaluate((state) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
      document.dispatchEvent(new Event("visibilitychange"));
    }, state);
  await setVisibility("hidden");
  // Session updates only (the step, then the page): Next.js may still prefetch a link.
  let updates = 0;
  other.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/r/")) updates++;
  });

  await suggestIdea(page, "Burger");
  await expect(idea(tab, "Burger")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await other.waitForTimeout(POLL_INTERVAL_MS * 2);
  expect(updates).toBe(0);

  // Back to that tab: up to date before the next polling round.
  await setVisibility("visible");
  await expect(idea(other, "Burger")).toBeVisible({ timeout: POLL_INTERVAL_MS - 1000 });
});
