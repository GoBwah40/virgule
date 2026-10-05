import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import {
  addTopic,
  choose,
  clickAndConfirm,
  createRoom,
  elapseTimer,
  expect,
  expireRoom,
  idea,
  join,
  LIVE_TIMEOUT,
  openPresentation,
  pick,
  seeRecap,
  setPhase,
  setUpSession,
  startIdeas,
  suggestIdea,
  suggestPizzaAndSushi,
  test,
  vote,
  voteAndSeeRecap,
} from "./helpers";

// WCAG 2.0, 2.1 and 2.2 at level AA, including the 24 px minimum target size (2.5.8).
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Runs axe once the page has settled; reports each violation with the elements involved. */
async function expectAccessible(page: Page, screen: string) {
  // Elements fading in are measured mid-way (faint colours): wait until nothing moves.
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
  // Next.js streams the page title in: on a busy machine, axe could run before it lands.
  await expect(page).toHaveTitle(/./);
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

      await page.goto("/present");
      await expect(page.getByRole("button", { name: "Show the session" })).toBeVisible();
      await expectAccessible(page, "screen pairing");

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

    test("the room screen passes axe at every step", async ({ page, openAsGuest }) => {
      test.slow();
      const link = await createRoom(page, { name: "Friday night", host: "Sam" });
      const screen = await openPresentation(page);
      await screen.emulateMedia({ colorScheme });
      await settle(page, screen);
      await expect(screen.getByRole("img", { name: "QR code for the invite link" })).toBeVisible();
      await expectAccessible(screen, "room screen, waiting");

      const guest = await openAsGuest(link);
      await join(guest, "Lea");
      await addTopic(page, "Dinner");
      await expect(screen.getByRole("heading", { name: "Dinner" })).toBeVisible({ timeout: LIVE_TIMEOUT });
      await expectAccessible(screen, "room screen, topics");

      await pick(page, "5 min");
      await startIdeas(page);
      await suggestIdea(page, "Pizza");
      await expect(screen.getByRole("timer")).toBeVisible({ timeout: LIVE_TIMEOUT });
      await expect(screen.getByRole("region", { name: "Dinner" })).toContainText("Pizza", { timeout: LIVE_TIMEOUT });
      await expectAccessible(screen, "room screen, ideas");

      await elapseTimer(link);
      await expect(screen.getByRole("timer")).toHaveText("Time's up", { timeout: LIVE_TIMEOUT });
      await expectAccessible(screen, "room screen, time's up");

      await vote(page, "Pizza", "For");
      await seeRecap(page);
      await expect(screen.getByText("Kept by the group")).toBeVisible({ timeout: LIVE_TIMEOUT });
      await expectAccessible(screen, "room screen, recap");

      await clickAndConfirm(page, "End the session");
      await expect(screen.getByText(/^It's decided/)).toBeVisible({ timeout: LIVE_TIMEOUT });
      await expectAccessible(screen, "room screen, session over");
    });

    test("dialogs and menus pass axe", async ({ page, openAsGuest }) => {
      await settle(page);
      await setUpSession(page, openAsGuest);

      await page.getByRole("button", { name: "Invite with a QR code" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page, "invite dialog");
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Show on a big screen" }).click();
      await expect(page.getByRole("dialog").locator("p").filter({ hasText: /^Pairing code / })).toHaveText(/[2-9A-Z]{6}$/);
      await expectAccessible(page, "big screen dialog");
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

    // From the top of the page: the release notes, then the two fields, the group size, then the button.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Session name")).toBeFocused();
    expect(await focusRingShown(page)).toBe(true);
    await page.keyboard.type("Keyboard club");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Your first name")).toBeFocused();
    await page.keyboard.type("Sam");
    // One stop for the whole size group, on the selected size; the arrows pick another one.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("radio", { name: "6 people" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "8 people" })).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Create the session" })).toBeFocused();
    expect(await focusRingShown(page)).toBe(true);
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { level: 1, name: "Keyboard club" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("list", { name: "1 participant out of 8" })).toBeVisible();
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

/** Mobile first (CLAUDE.md): anything touchable offers at least 44 × 44 px. */
const MIN_SIZE = 44;

type Undersized = { element: string; width: number; height: number };

/**
 * Measures the touch area of every visible button, link, field and focusable element of the
 * page: the area where a tap lands on the element, found by hit-testing outward from its centre
 * along both axes. It counts invisible hit areas (pseudo-elements) and leaves out what a
 * neighbour covers, which a bounding box would not. A visually hidden radio or checkbox is
 * replaced by its label, the pill people actually tap.
 */
async function undersizedTargets(page: Page): Promise<Undersized[]> {
  return page.evaluate((min) => {
    // A disabled button does not take taps (`pointer-events: none`), but keeps the size it has
    // once enabled: hit-test it as if enabled.
    const style = document.createElement("style");
    style.textContent = ':disabled, [aria-disabled="true"], [data-disabled] { pointer-events: auto !important; }';
    document.head.append(style);

    const selector = [
      "a[href]",
      "button",
      "input:not([type=hidden])",
      "select",
      "textarea",
      "summary",
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="switch"]',
      '[role="tab"]',
      '[role="menuitem"]',
    ].join(", ");

    const describe = (el: Element) => {
      const labelledBy = el.getAttribute("aria-labelledby");
      const label = el.getAttribute("aria-label") || (labelledBy && document.getElementById(labelledBy)?.textContent) || el.textContent;
      const name = label?.trim().replace(/\s+/g, " ").slice(0, 40) ?? "";
      return `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}> "${name}"`;
    };

    const targets = new Set<Element>();
    for (const el of document.querySelectorAll(selector)) {
      if (el.closest('[aria-hidden="true"], [inert]') || !el.checkVisibility({ visibilityProperty: true })) continue;
      const { width, height } = el.getBoundingClientRect();
      const visuallyHidden = width <= 1 || height <= 1;
      if (!visuallyHidden) {
        targets.add(el);
        continue;
      }
      // Visually hidden radio or checkbox: its label is the touch target. Anything else
      // visually hidden (a skip link before it gets focus…) is not on screen.
      const label = el instanceof HTMLInputElement ? el.labels?.[0] : undefined;
      if (label) targets.add(label);
    }

    const undersized: Undersized[] = [];
    for (const el of targets) {
      el.scrollIntoView({ block: "center", inline: "center" });
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const owns = (x: number, y: number) => {
        const hit = document.elementFromPoint(x, y);
        return !!hit && (el.contains(hit) || hit.closest("label")?.control === el);
      };
      // Furthest point still on the element, by half-pixel steps, in a direction.
      const reach = (dx: number, dy: number) => {
        let d = 0;
        while (d < min && owns(cx + dx * (d + 0.5), cy + dy * (d + 0.5))) d += 0.5;
        return d;
      };
      const width = owns(cx, cy) ? reach(-1, 0) + reach(1, 0) : 0;
      const height = owns(cx, cy) ? reach(0, -1) + reach(0, 1) : 0;
      // Half a pixel of rounding on each side.
      if (width < min - 1 || height < min - 1) undersized.push({ element: describe(el), width, height });
    }
    style.remove();
    return undersized;
  }, MIN_SIZE);
}

/** Polled: while a step transition runs, its snapshot covers the page and takes every tap. */
async function expectTouchTargets(page: Page) {
  await expect.poll(() => undersizedTargets(page), { message: `touch areas under ${MIN_SIZE} × ${MIN_SIZE} px` }).toEqual([]);
}


test.describe(`touch targets of at least ${MIN_SIZE} px`, () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await expectTouchTargets(page);
  });

  test("join form", async ({ page, openAsGuest }) => {
    const link = await createRoom(page, { name: "Friday night", host: "Sam" });
    const guest = await openAsGuest(link);
    await expect(guest.getByRole("button", { name: "Join the session" })).toBeVisible();
    await expectTouchTargets(guest);
  });

  test("topics, for the host and a guest", async ({ page, openAsGuest }) => {
    // Empty list first: the one-tap suggestions only show while there are few topics.
    const link = await createRoom(page, { name: "Friday night", host: "Sam" });
    await expectTouchTargets(page);

    const guest = await openAsGuest(link);
    await join(guest, "Lea");
    await addTopic(page, "Dinner");
    await expectTouchTargets(page);
    await expectTouchTargets(guest);
  });

  test("ideas, for the host and a guest", async ({ page, openAsGuest }) => {
    const { guest } = await setUpSession(page, openAsGuest);
    await suggestPizzaAndSushi(page, guest);
    await expectTouchTargets(page);
    await expectTouchTargets(guest);
  });

  test("recap, for the host and a guest", async ({ page, openAsGuest }) => {
    const { guest } = await setUpSession(page, openAsGuest);
    await voteAndSeeRecap(page, guest);
    await expectTouchTargets(page);
    await expectTouchTargets(guest);
  });
});
