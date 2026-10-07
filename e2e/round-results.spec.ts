import type { Page } from "@playwright/test";

import {
  clickAndConfirm,
  downloadExport,
  expect,
  idea,
  LIVE_TIMEOUT,
  seeRecap,
  setUpSession,
  suggestIdea,
  suggestPizzaAndSushi,
  test,
  vote,
} from "./helpers";

// A recap the group has seen stays as it was: a later round never rewrites it.

/** Opens the recap tab of round 1 and checks Tacos is still kept there, next to the tied ideas. */
async function expectRound1Unchanged(page: Page) {
  await page.getByRole("tab", { name: "Round 1" }).click();
  await expect(page.getByRole("tab", { name: "Round 1", selected: true })).toBeVisible();
  await expect(idea(page, "Tacos").getByText("Kept")).toBeVisible();
  await expect(idea(page, "Pizza").getByText("Tied")).toBeVisible();
  await expect(idea(page, "Sushi").getByText("Tied")).toBeVisible();
}

test("a tiebreak keeps the recap, the exports and the shared recap of the round before", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  await suggestIdea(page, "Tacos");
  await expect(idea(guest, "Tacos")).toBeVisible({ timeout: LIVE_TIMEOUT });
  // Pizza 2–0 and Sushi 2–0 tied for first, Tacos 1–0 kept without leading.
  await vote(page, "Pizza", "For");
  await vote(page, "Sushi", "For");
  await vote(guest, "Pizza", "For");
  await vote(guest, "Sushi", "For");
  await vote(guest, "Tacos", "For");
  await seeRecap(page);
  await expect(page.getByText("3 of 3 ideas kept")).toBeVisible();
  await expect(idea(page, "Tacos").getByText("Kept")).toBeVisible();

  // The tiebreak only takes Pizza and Sushi to round 2.
  await clickAndConfirm(page, "Break the ties");
  await expect(page).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(page, "Tacos")).toHaveCount(0);
  await vote(page, "Pizza", "For");
  await seeRecap(page);
  await expect(page.getByRole("tab", { name: "Round 2", selected: true })).toBeVisible();
  await expect(page.getByText("1 of 2 ideas kept")).toBeVisible();

  // Round 1 reads as the group saw it, for everyone.
  await expectRound1Unchanged(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
  await expectRound1Unchanged(guest);

  const markdown = await downloadExport(page, /Markdown/);
  expect(markdown.content).toContain("## Round 1\n\n3 of 3 ideas kept");
  expect(markdown.content).toContain("| Tacos | 1 | 0 | 1 | ✅ Kept |");
  expect(markdown.content).toContain("| Pizza | 2 | 0 | 2 | ✅ Kept |");
  const csv = await downloadExport(page, /CSV/);
  expect(csv.content).toContain("1,Dinner,Tacos,1,0,1,,Kept");
  expect(csv.content).toContain("1,Dinner,Sushi,2,0,2,,Kept");
  expect(csv.content).toContain("2,Dinner,Sushi,0,0,0,,Dropped");

  // The read-only recap for people who were not there.
  await page.getByRole("button", { name: "Share the recap" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Create the link" }).click();
  const shared = dialog.getByText(/\/recap\/[\w-]+$/);
  await expect(shared).toBeVisible();
  const visitor = await openAsGuest((await shared.innerText()).trim());
  await expectRound1Unchanged(visitor);
});
