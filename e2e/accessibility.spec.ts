import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import {
  choose,
  clickAndConfirm,
  elapseTimer,
  expect,
  expireRoom,
  idea,
  LIVE_TIMEOUT,
  pick,
  seeRecap,
  setPhase,
  setUpSession,
  startIdeas,
  suggestIdea,
  test,
  vote,
} from "./helpers";

// WCAG 2.0, 2.1 and 2.2 at level AA, including the 24 px minimum target size (2.5.8).
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Runs axe once the page has settled; reports each violation with the elements involved. */
async function expectAccessible(page: Page, screen: string) {
  // Elements fading in are measured mid-way (faint colours): wait until nothing moves.
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const found = violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
  expect(found, `accessibility violations on ${screen}`).toEqual([]);
}

/** Pages are checked as people who asked their device to reduce motion see them, guests included. */
async function settle(...pages: Page[]) {
  for (const p of pages) await p.emulateMedia({ reducedMotion: "reduce" });
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test("home and status pages pass axe", async ({ page, openAsGuest }) => {
      await settle(page);
      await page.goto("/");
      await expectAccessible(page, "home");

      await page.goto("/r/doesnotexist");
      await expectAccessible(page, "not found");

      const { link } = await setUpSession(page, openAsGuest);
      await setPhase(link, "UNKNOWN_PHASE");
      await page.goto(link);
      await expectAccessible(page, "error page");

      await setPhase(link, "THEMES");
      await expireRoom(link);
      await page.goto(link);
      await expectAccessible(page, "expired session");

      await page.goto("/");
      await choose(page, "Language", "Français");
      await expect(page.getByRole("button", { name: "Créer la séance" })).toBeVisible();
      await expectAccessible(page, "home in French");
    });

    test("a whole session passes axe, for the host and a guest", async ({ page, openAsGuest }) => {
      test.slow();
      const { link, guest } = await setUpSession(page, openAsGuest);
      await guest.emulateMedia({ colorScheme });
      await settle(page, guest);
      await expectAccessible(page, "topics, host");
      await expectAccessible(guest, "topics, guest");

      const newcomer = await openAsGuest(link);
      await newcomer.emulateMedia({ colorScheme });
      await settle(newcomer);
      await expectAccessible(newcomer, "join form");

      await pick(page, "5 min");
      await startIdeas(page);
      await suggestIdea(page, "Pizza");
      await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
      await suggestIdea(guest, "Sushi");
      await expect(idea(page, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
      await vote(page, "Pizza", "For");
      await expectAccessible(page, "ideas, host");
      await expectAccessible(guest, "ideas, guest");

      await elapseTimer(link);
      await page.reload();
      await expectAccessible(page, "ideas, time's up");

      await seeRecap(page);
      await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
      await expectAccessible(page, "recap, host");
      await expectAccessible(guest, "recap, guest");

      await clickAndConfirm(page, "End the session");
      await expect(page.getByRole("heading", { name: "It's decided" })).toBeVisible();
      await expectAccessible(page, "session over");
    });

    test("dialogs and menus pass axe", async ({ page, openAsGuest }) => {
      await settle(page);
      await setUpSession(page, openAsGuest);

      await page.getByRole("button", { name: "Invite with a QR code" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page, "invite dialog");
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Lea's seat: options" }).click();
      await expect(page.getByRole("menu")).toBeVisible();
      await expectAccessible(page, "seat menu");
      await page.getByRole("menuitem", { name: "Remove from the session" }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await expectAccessible(page, "confirm dialog");
    });
  });
}

test("every page has a title", async ({ page, openAsGuest }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Virgule");

  const { link } = await setUpSession(page, openAsGuest);
  await expect(page).toHaveTitle("Friday night · Virgule");

  await page.goto("/r/doesnotexist");
  await expect(page).toHaveTitle("Session not found · Virgule");

  await setPhase(link, "UNKNOWN_PHASE");
  await page.goto(link);
  await expect(page).toHaveTitle("Something went wrong · Virgule");

  await setPhase(link, "THEMES");
  await expireRoom(link);
  await page.goto(link);
  await expect(page).toHaveTitle("This session is no longer available · Virgule");
});

test.describe("keyboard", () => {
  /** The focused element shows a focus ring (outline or box-shadow ring). */
  const focusRingShown = (page: Page) =>
    page.evaluate(() => {
      const style = getComputedStyle(document.activeElement!);
      return style.boxShadow !== "none" || (style.outlineStyle !== "none" && style.outlineWidth !== "0px");
    });

  test("a session can be created with the keyboard alone, focus always visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Create the session" })).toBeVisible();

    // From the top of the page: the release notes, then the two fields, then the button.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Session name")).toBeFocused();
    expect(await focusRingShown(page)).toBe(true);
    await page.keyboard.type("Keyboard club");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Your first name")).toBeFocused();
    await page.keyboard.type("Sam");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Create the session" })).toBeFocused();
    expect(await focusRingShown(page)).toBe(true);
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { level: 1, name: "Keyboard club" })).toBeVisible({ timeout: 15_000 });
  });

  test("votes work with the keyboard", async ({ page, openAsGuest }) => {
    const { guest } = await setUpSession(page, openAsGuest);
    await startIdeas(page);
    await suggestIdea(page, "Pizza");
    await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });

    // Reached with the keyboard (Shift+Tab from Against), so the browser shows the focus ring.
    const upvote = idea(guest, "Pizza").getByRole("button", { name: "For" });
    await idea(guest, "Pizza").getByRole("button", { name: "Against" }).focus();
    await guest.keyboard.press("Shift+Tab");
    await expect(upvote).toBeFocused();
    expect(await focusRingShown(guest)).toBe(true);
    await guest.keyboard.press("Space");
    await expect(upvote).toHaveAttribute("aria-pressed", "true");
    // Space again removes the vote.
    await guest.keyboard.press("Space");
    await expect(upvote).toHaveAttribute("aria-pressed", "false");
  });

  test("a confirmation keeps focus inside, closes with Escape and gives focus back", async ({ page, openAsGuest }) => {
    const { guest } = await setUpSession(page, openAsGuest);
    const leave = guest.getByRole("button", { name: "Leave the session" });
    await leave.focus();
    await guest.keyboard.press("Enter");

    const dialog = guest.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    // Focus starts on the safe choice, then Tab cycles through the dialog's two buttons only
    // (Base UI's focus guards send it back asynchronously, hence the polling).
    const cancel = dialog.getByRole("button", { name: "Cancel" });
    const confirm = dialog.getByRole("button", { name: "Leave the session" });
    await expect(cancel).toBeFocused();
    for (const expected of [confirm, cancel, confirm, cancel]) {
      await guest.keyboard.press("Tab");
      await expect(expected).toBeFocused();
    }
    await guest.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(leave).toBeFocused();
    // Nothing happened: still in the session.
    await expect(guest).toHaveURL(/\/themes$/);
  });
});

test.describe("reduced motion", () => {
  /** CSS animation of the For button once pressed (it bounces when motion is allowed). */
  async function voteAnimation(page: Page) {
    await vote(page, "Pizza", "For");
    return idea(page, "Pizza")
      .getByRole("button", { name: "For" })
      .evaluate((element) => getComputedStyle(element).animationName);
  }

  test("animations play by default", async ({ page, openAsGuest }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await setUpSession(page, openAsGuest);
    await pick(page, "5 min");
    await startIdeas(page);
    await suggestIdea(page, "Pizza");
    expect(await voteAnimation(page)).not.toBe("none");
    const hourglass = page.getByRole("timer").locator("svg");
    expect(await hourglass.evaluate((element) => getComputedStyle(element).animationName)).not.toBe("none");
  });

  test("the app's animations stop when the device asks to reduce motion", async ({ page, openAsGuest }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await setUpSession(page, openAsGuest);
    await pick(page, "5 min");
    await startIdeas(page);
    await suggestIdea(page, "Pizza");
    expect(await voteAnimation(page)).toBe("none");
    // The countdown's hourglass stops pulsing too.
    const hourglass = page.getByRole("timer").locator("svg");
    expect(await hourglass.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  });
});
