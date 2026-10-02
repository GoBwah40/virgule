import type { Page, Route } from "@playwright/test";

import { POLL_INTERVAL_MS } from "../src/lib/config";
import type { OpenAsGuest } from "./helpers";
import { expect, idea, LIVE_TIMEOUT, seeRecap, setUpSession, startIdeas, suggestIdea, test } from "./helpers";

// The network is fine, the server is not: overloaded (an error page instead of the app's
// answer), stuck on a request, or slow on its actions. Slow connections are in slow-network.spec.ts.

/** Sam hosts, Lea follows into the ideas phase with "Pizza" suggested. */
async function inIdeas(page: Page, openAsGuest: OpenAsGuest) {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });
  return guest;
}

/** What an overloaded server or its proxy sends back. */
const overloaded = (route: Route) =>
  route.fulfill({ status: 503, contentType: "text/html", body: "<h1>503 Service Unavailable</h1>" });

/** The page's requests matching `which` get the overloaded answer; returns the way back. */
async function overload(page: Page, which: (route: Route) => boolean = () => true) {
  const app = new URL(page.url()).origin + "/**";
  await page.route(app, (route) => (which(route) ? overloaded(route) : route.fallback()));
  return () => page.unroute(app);
}

const isAction = (route: Route) => route.request().method() === "POST";

const toast = (page: Page, text: string) => page.getByRole("region", { name: /Notifications/ }).getByText(text);

test("an overloaded server leaves the page as is, then it catches up", async ({ page, openAsGuest }) => {
  const guest = await inIdeas(page, openAsGuest);
  const restore = await overload(guest);
  await suggestIdea(page, "Burger");

  // Several polling rounds get the error page: none may replace the session with it.
  await guest.waitForTimeout(POLL_INTERVAL_MS * 2);
  await expect(guest.getByRole("heading", { name: "The ideas" })).toBeVisible();
  await expect(idea(guest, "Pizza")).toBeVisible();

  await restore();
  await expect(idea(guest, "Burger")).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("a vote the overloaded server cannot take says so, and the step stays", async ({ page, openAsGuest }) => {
  const guest = await inIdeas(page, openAsGuest);
  const upvote = idea(guest, "Pizza").getByRole("button", { name: "For" });

  const restore = await overload(guest, isAction);
  await upvote.click();
  await expect(toast(guest, "Something went wrong. Try again in a moment.")).toBeVisible();
  // Not the step's error page: the ideas stay, and the vote goes back.
  await expect(guest.getByRole("heading", { name: "The ideas" })).toBeVisible();
  await expect(upvote).toHaveAttribute("aria-pressed", "false");

  await restore();
  await upvote.click();
  await expect(upvote).toHaveAttribute("aria-pressed", "true");
  await guest.reload();
  await expect(idea(guest, "Pizza").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");
});

test("a request the server never answers holds the updates back for 30 s at most", async ({ page, openAsGuest }) => {
  test.slow();
  const guest = await inIdeas(page, openAsGuest);
  // The next page update never gets an answer (and is never cancelled by the server).
  let stuck = false;
  await guest.route(new URL(guest.url()).origin + "/**", (route) => {
    if (stuck || !route.request().headers()["rsc"]) return route.fallback();
    stuck = true;
  });
  await suggestIdea(page, "Burger");
  await expect.poll(() => stuck).toBe(true);

  // Updates wait behind the stuck one, then go on without it.
  await expect(idea(guest, "Burger")).toBeVisible({ timeout: 30_000 + LIVE_TIMEOUT });
});

test("a slow action keeps its buttons busy and goes through once", async ({ page, openAsGuest }) => {
  const guest = await inIdeas(page, openAsGuest);
  // Every action of the host takes 5 s on the server.
  await page.route(new URL(page.url()).origin + "/**", async (route) => {
    if (isAction(route)) await new Promise((resolve) => setTimeout(resolve, 5000));
    await route.fallback();
  });

  await page.getByRole("button", { name: "See the recap" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "See the recap" }).click();
  // The dialog has closed; the button that opened it waits for the answer.
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "See the recap" })).toBeDisabled();

  await expect(page).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
  await expect(page.getByRole("region", { name: /Notifications/ }).getByRole("listitem")).toHaveCount(0);
});

test("a vote shows at once while the server takes its time, and is kept", async ({ page, openAsGuest }) => {
  const guest = await inIdeas(page, openAsGuest);
  await guest.route(new URL(guest.url()).origin + "/**", async (route) => {
    if (isAction(route)) await new Promise((resolve) => setTimeout(resolve, 5000));
    await route.fallback();
  });
  const upvote = idea(guest, "Pizza").getByRole("button", { name: "For" });

  await upvote.click();
  await expect(upvote).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  // Still shown once the slow answer has come.
  await guest.waitForTimeout(6000);
  await expect(upvote).toHaveAttribute("aria-pressed", "true");
  await guest.reload();
  await expect(idea(guest, "Pizza").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");
});

test("a step change reaches Lea despite a slow server", async ({ page, openAsGuest }) => {
  const guest = await inIdeas(page, openAsGuest);
  // Each page update of Lea's takes 3 s on the server.
  await guest.route(new URL(guest.url()).origin + "/**", async (route) => {
    if (route.request().headers()["rsc"]) await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.fallback();
  });
  await seeRecap(page);
  // Through the step change itself, or through a refresh of the ideas page that the server sends
  // on to the recap, whichever lands first: the loading state only shows in the first case.
  await expect(guest.getByRole("heading", { name: "The recap" })).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(guest).toHaveURL(/\/recap$/);
});
