import type { Page } from "@playwright/test";

import {
  clickAndConfirm,
  downloadExport,
  expect,
  fillAndSubmit,
  LIVE_TIMEOUT,
  openPresentation,
  setUpSession,
  test,
  voteAndSeeRecap,
} from "./helpers";

// The host renames the session from the pencil next to its name, until it is over; everyone
// sees the new name wherever it shows.

const renameButton = (page: Page) => page.getByRole("button", { name: "Rename the session" });
const title = (page: Page, name: string) => page.getByRole("banner").getByRole("heading", { level: 1, name });

async function rename(page: Page, name: string) {
  await renameButton(page).click();
  const dialog = page.getByRole("dialog");
  await fillAndSubmit([[dialog.getByLabel("Session name"), name]], dialog.getByRole("button", { name: "Rename" }));
  await expect(dialog).toHaveCount(0);
  await expect(title(page, name)).toBeVisible();
}

test("the host renames the session and everyone sees the new name, the room screen too", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  const screen = await openPresentation(page);
  // The room screen's title is visually hidden once the topics show, but still read out.
  const screenTitle = (name: string) => screen.getByRole("heading", { level: 1, name });
  await expect(screenTitle("Friday night")).toBeAttached();

  // Only the host gets the pencil.
  await expect(title(guest, "Friday night")).toBeVisible();
  await expect(renameButton(guest)).toHaveCount(0);

  // The dialog starts from the current name; the new one is trimmed.
  await renameButton(page).click();
  await expect(page.getByRole("dialog").getByLabel("Session name")).toHaveValue("Friday night");
  await page.keyboard.press("Escape");
  await rename(page, "  Saturday lunch  ");

  await expect(title(guest, "Saturday lunch")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(screenTitle("Saturday lunch")).toBeAttached({ timeout: LIVE_TIMEOUT });
  await expect(page).toHaveTitle(/Saturday lunch/);
});

test("the recap and its exports follow the new name, and the pencil goes once the session is over", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);

  await rename(page, "Saturday lunch");
  expect((await downloadExport(page, /Markdown/)).content).toContain("# Recap — Saturday lunch");
  await expect(title(guest, "Saturday lunch")).toBeVisible({ timeout: LIVE_TIMEOUT });

  // Over, the session is read-only: no more renaming.
  await clickAndConfirm(page, "End the session");
  await expect(page.getByRole("heading", { name: "It's decided" })).toBeVisible();
  await expect(renameButton(page)).toHaveCount(0);
  await page.reload();
  await expect(title(page, "Saturday lunch")).toBeVisible();
  await expect(renameButton(page)).toHaveCount(0);

  // Starting again copies the name; the host lands on the topics step, where they can rename it.
  await clickAndConfirm(page, "Start again with these topics");
  await expect(page).toHaveURL(/\/r\/[^/]+\/themes$/, { timeout: LIVE_TIMEOUT });
  await expect(title(page, "Saturday lunch")).toBeVisible();
  await rename(page, "Sunday brunch");
});
