import AxeBuilder from "@axe-core/playwright";

import { createRoom, expect, join, test } from "./helpers";

test.use({ hostTour: true });

test("the first time on the topics page, the host is offered a tour they can take step by step", async ({ page }) => {
  await createRoom(page, { name: "Friday night", host: "Sam" });
  const offer = page.getByRole("dialog", { name: "First time hosting?" });
  await expect(offer).toBeVisible();
  await offer.getByRole("button", { name: "Take the tour" }).click();

  // The suggestions only show in the advanced form: the tour skips them in the simple one.
  const steps = ["Invite the group", "Add your topics", "Simple or advanced", "Set the rules", "Move on to ideas"];
  for (const [i, title] of steps.entries()) {
    const card = page.getByRole("dialog", { name: title });
    await expect(card).toContainText(`Step ${i + 1} of ${steps.length}`);
    await expect(page.getByTestId("tour-ring")).toBeVisible();
    if (i === 1) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
    }
    await card.getByRole("button", { name: i === steps.length - 1 ? "Got it" : "Next" }).click();
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Answered once on this device: no offer on the next visit, but the tour can be taken again.
  await page.reload();
  await expect(page.getByRole("button", { name: "Take the tour of this page" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the host can turn the tour down, and guests are never offered it", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Friday night", host: "Sam" });
  await page.getByRole("dialog", { name: "First time hosting?" }).getByRole("button", { name: "Not now" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Take the tour of this page" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const guest = await openAsGuest(link);
  await join(guest, "Lea");
  await expect(guest.getByRole("button", { name: "Take the tour of this page" })).toHaveCount(0);
  await expect(guest.getByRole("dialog")).toHaveCount(0);
});
