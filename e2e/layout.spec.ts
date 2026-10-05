import type { Page } from "@playwright/test";

import { LIMITS } from "../src/lib/config";
import { createRoom, expect, join, seeRecap, startIdeas, suggestIdea, test, vote, addTopic } from "./helpers";

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

      const link = await createRoom(page, { name: NAME, host: PSEUDO });
      await expectNoSideScroll(page, "topics, empty");
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
