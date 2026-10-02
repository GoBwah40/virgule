import type { Page } from "@playwright/test";

import { POLL_INTERVAL_MS } from "../src/lib/config";
import type { OpenAsGuest } from "./helpers";
import { expect, fillAndSubmit, idea, LIVE_TIMEOUT, seeRecap, setUpSession, startIdeas, suggestIdea, test } from "./helpers";

// No service worker: the app does not work offline. These tests check that a dropped connection
// (a tunnel, a lift) neither loses the page nor anything the person typed, and that the page
// catches up once the connection is back, including a page cut off while loading.

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

test.describe("while loading", () => {
  /** The page arrives, then the network drops before its scripts and styles: they all fail. */
  async function loadWithoutAssets(page: Page, url: string) {
    await page.route("**/_next/static/**", (route) => route.abort("internetdisconnected"));
    await page.goto(url);
    await page.context().setOffline(true);
    await page.unroute("**/_next/static/**");
  }

  /** Styles from globals.css give the page its background colour. */
  const styled = (page: Page) =>
    page
      .evaluate(() => getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)")
      // Mid-reload, the page being read goes away.
      .catch(() => false);

  test("a session page cut off while loading reloads by itself once back online", async ({ page, openAsGuest }) => {
    const guest = await guestGoesOffline(page, openAsGuest);
    await backOnline(guest);
    await loadWithoutAssets(guest, guest.url());
    // Server-rendered HTML only (the skeleton or the list, depending on when the network
    // dropped): unstyled, and nothing reacts.
    expect(await styled(guest)).toBe(false);
    const upvote = idea(guest, "Pizza").getByRole("button", { name: "For" });
    await upvote.click();
    await expect(upvote).toHaveAttribute("aria-pressed", "false");

    await backOnline(guest);
    await expect.poll(() => styled(guest), { timeout: LIVE_TIMEOUT }).toBe(true);
    // The page works again: Lea can vote.
    // A click before the reloaded page hydrates is lost: click again until it counts (never twice
    // on a vote already taken, which would remove it).
    await expect(async () => {
      if ((await upvote.getAttribute("aria-pressed")) !== "true") await upvote.click();
      await expect(upvote).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass({ timeout: LIVE_TIMEOUT });
    await guest.reload();
    await expect(idea(guest, "Pizza").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");
  });

  test("the home page cut off while loading reloads too, and a session can be created", async ({ page }) => {
    await loadWithoutAssets(page, "/");
    expect(await styled(page)).toBe(false);

    await page.context().setOffline(false);
    await expect.poll(() => styled(page), { timeout: LIVE_TIMEOUT }).toBe(true);
    // On the reloaded page, without navigating again.
    await fillAndSubmit(
      [
        [page.getByLabel("Session name"), "Back online"],
        [page.getByLabel("Your first name"), "Sam"],
      ],
      page.getByRole("button", { name: "Create the session" }),
    );
    await expect(page.getByRole("heading", { level: 1, name: "Back online" })).toBeVisible({ timeout: LIVE_TIMEOUT });
  });

  test("with no network at all, the browser shows its own offline page (no service worker)", async ({ page }) => {
    await page.context().setOffline(true);
    await expect(page.goto("/")).rejects.toThrow("ERR_INTERNET_DISCONNECTED");
  });
});
