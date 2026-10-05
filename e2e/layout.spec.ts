import type { Page } from "@playwright/test";

import { LIMITS } from "../src/lib/config";
import { createRoom, expect, join, LIVE_TIMEOUT, openPresentation, seeRecap, startIdeas, suggestIdea, test, vote, addTopic } from "./helpers";

// Long words (a name, a link pasted as an idea) on the narrowest phone and on a computer: the
// page never scrolls sideways, whatever the step.

// The longest names allowed, without a space to break them.
const NAME = "W".repeat(LIMITS.roomName);
const PSEUDO = "M".repeat(LIMITS.pseudo);
const IDEA = `https://example.com/${"a".repeat(200)}`;

/** Nothing wider than the screen: no sideways scrolling. */
async function expectNoSideScroll(page: Page, screen: string) {
  // The elements sticking out, named in the failure.
  const sticking = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= width) return [];
    return [...document.querySelectorAll("body *")]
      .filter((element) => element.getBoundingClientRect().right > width + 1)
      .map((element) => `<${element.tagName.toLowerCase()} class="${element.getAttribute("class") ?? ""}"> ${element.textContent?.slice(0, 30)}`)
      .slice(-3);
  });
  expect(sticking, `sideways scrolling on ${screen}`).toEqual([]);
}

for (const [label, viewport, isMobile] of [
  ["the narrowest phone", { width: 320, height: 640 }, true],
  ["a computer", { width: 1280, height: 800 }, false],
] as const) {
  test.describe(`on ${label}`, () => {
    test.use({ viewport, isMobile, hasTouch: isMobile });

    test("long names and ideas never make the page scroll sideways", async ({ page, openAsGuest }) => {
      await page.goto("/");
      await expectNoSideScroll(page, "home");
      await page.goto("/present");
      await expectNoSideScroll(page, "screen pairing");

      const link = await createRoom(page, { name: NAME, host: PSEUDO });
      await expectNoSideScroll(page, "topics, empty");
      await page.getByRole("button", { name: "Show on a big screen" }).click();
      await expect(page.getByRole("dialog").locator("p").filter({ hasText: /^Pairing code / })).toHaveText(/[2-9A-Z]{6}$/);
      await expectNoSideScroll(page, "big screen dialog");
      await page.keyboard.press("Escape");
      const guest = await openAsGuest(link);
      await guest.setViewportSize(viewport);
      await expectNoSideScroll(guest, "join form");
      await join(guest, "L".repeat(LIMITS.pseudo));
      await addTopic(page, "T".repeat(LIMITS.themeTitle));
      await expectNoSideScroll(page, "topics");
      await expectNoSideScroll(guest, "topics, guest");

      await startIdeas(page);
      await suggestIdea(page, IDEA);
      await expect(guest).toHaveURL(/\/ideas$/, { timeout: 10_000 });
      await vote(guest, IDEA, "For");
      await expectNoSideScroll(page, "ideas");
      await expectNoSideScroll(guest, "ideas, guest");

      await seeRecap(page);
      await expectNoSideScroll(page, "recap");
    });
  });
}

/** The room screen fits the window: nothing cut off at the bottom, no page to scroll. */
async function expectWholeScreen(page: Page, screen: string) {
  const overflow = await page.evaluate(() => {
    const stage = document.querySelector("[data-presentation]")!;
    return {
      page: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      stage: stage.scrollHeight - stage.clientHeight,
    };
  });
  expect(overflow, `content cut off or scrolling on ${screen}`).toEqual({ page: 0, stage: 0 });
}

// The room screen: on a TV, everything fits the window; on the narrowest phone (a host trying it
// out), it may scroll down, never sideways.
for (const [label, viewport, isMobile] of [
  ["the narrowest phone", { width: 320, height: 640 }, true],
  ["a TV", { width: 1920, height: 1080 }, false],
] as const) {
  test.describe(`room screen on ${label}`, () => {
    test.use({ viewport, isMobile, hasTouch: isMobile });

    test("long names and ideas never overflow the room screen", async ({ page, openAsGuest }) => {
      test.slow();
      const link = await createRoom(page, { name: NAME, host: PSEUDO });
      const screen = await openPresentation(page);
      await screen.setViewportSize(viewport);
      const check = async (step: string) => {
        await expectNoSideScroll(screen, step);
        if (!isMobile) await expectWholeScreen(screen, step);
      };
      await check("room screen, waiting");

      const guest = await openAsGuest(link);
      await join(guest, "L".repeat(LIMITS.pseudo));
      await addTopic(page, "T".repeat(LIMITS.themeTitle));
      await expect(screen.getByRole("heading", { name: "T".repeat(LIMITS.themeTitle) })).toBeVisible({ timeout: LIVE_TIMEOUT });
      await check("room screen, topics");

      await startIdeas(page);
      await suggestIdea(page, IDEA);
      await expect(screen.getByText(IDEA)).toBeVisible({ timeout: LIVE_TIMEOUT });
      await check("room screen, ideas");

      await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
      await vote(guest, IDEA, "For");
      await seeRecap(page);
      await expect(screen.getByText("Kept by the group")).toBeVisible({ timeout: LIVE_TIMEOUT });
      await check("room screen, recap");
    });
  });
}
