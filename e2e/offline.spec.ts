import type { Page } from "@playwright/test";

import { POLL_INTERVAL_MS } from "../src/lib/config";
import type { OpenAsGuest } from "./helpers";
import { expect, idea, LIVE_TIMEOUT, seeRecap, setUpSession, startIdeas, suggestIdea, test } from "./helpers";

// No service worker: the app does not work offline. These tests check that a dropped connection
// (a tunnel, a lift) neither loses the page nor anything the person typed, and that the page
// catches up once the connection is back.

/** Sam hosts, Lea follows into the ideas phase with "Pizza" suggested, then Lea's phone loses the network. */
async function guestGoesOffline(page: Page, openAsGuest: OpenAsGuest) {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await guest.context().setOffline(true);
  return guest;
}

const backOnline = (guest: Page) => guest.context().setOffline(false);

const toast = (page: Page, text: string) => page.getByRole("region", { name: /Notifications/ }).getByText(text);

const OFFLINE = "You're offline. Check your connection and try again.";

test("the page stays on screen while offline, then catches up with the group", async ({ page, openAsGuest }) => {
  const guest = await guestGoesOffline(page, openAsGuest);
  await suggestIdea(page, "Burger");

  // Several polling rounds go by: a refresh attempted offline would have swapped the page for
  // the browser's own offline page, for good.
  await guest.waitForTimeout(POLL_INTERVAL_MS * 2);
  await expect(guest).toHaveURL(/\/ideas$/);
  await expect(idea(guest, "Pizza")).toBeVisible();
  await expect(idea(guest, "Burger")).toHaveCount(0);

  await backOnline(guest);
  await expect(idea(guest, "Burger")).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("a vote cast offline says so and is not counted", async ({ page, openAsGuest }) => {
  const guest = await guestGoesOffline(page, openAsGuest);
  const upvote = idea(guest, "Pizza").getByRole("button", { name: "For" });

  await upvote.click();
  await expect(toast(guest, OFFLINE)).toBeVisible();
  // The optimistic vote goes back: nothing was sent.
  await expect(upvote).toHaveAttribute("aria-pressed", "false");

  await backOnline(guest);
  await upvote.click();
  await expect(upvote).toHaveAttribute("aria-pressed", "true");
  await guest.reload();
  await expect(idea(guest, "Pizza").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");
});

test("an idea suggested offline keeps its text for another try", async ({ page, openAsGuest }) => {
  const guest = await guestGoesOffline(page, openAsGuest);
  const field = guest.getByLabel("Your idea…");

  await field.fill("Tacos");
  await guest.getByRole("button", { name: "Add", exact: true }).click();
  await expect(toast(guest, OFFLINE)).toBeVisible();
  await expect(field).toHaveValue("Tacos");
  await expect(idea(guest, "Tacos")).toHaveCount(0);

  await backOnline(guest);
  await guest.getByRole("button", { name: "Add", exact: true }).click();
  await expect(idea(guest, "Tacos")).toBeVisible();
  await expect(field).toHaveValue("");
  await expect(idea(page, "Tacos")).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("a step change made while offline is followed once back online", async ({ page, openAsGuest }) => {
  const guest = await guestGoesOffline(page, openAsGuest);
  await seeRecap(page);

  await guest.waitForTimeout(POLL_INTERVAL_MS * 2);
  await expect(guest).toHaveURL(/\/ideas$/);

  await backOnline(guest);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
});

test("the offline message follows the language", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  const guest = await openAsGuest(link, { locale: "fr-FR" });
  await guest.context().setOffline(true);
  await guest.getByLabel("C'est quoi ton prénom ?").fill("Noe");
  await guest.getByRole("button", { name: "Rejoindre la séance" }).click();
  await expect(toast(guest, "Tu es hors ligne. Vérifie ta connexion et réessaie.")).toBeVisible();
});
