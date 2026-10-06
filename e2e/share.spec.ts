import type { Page } from "@playwright/test";

import {
  clickAndConfirm,
  expect,
  idea,
  LIVE_TIMEOUT,
  participantSecrets,
  setUpSession,
  test,
  voteAndSeeRecap,
} from "./helpers";

// The host shares a read-only recap with people who were not there: no seat, no names.

/** Host, on the recap: opens the dialog, turns the link on if asked, and reads it. */
async function shareLink(page: Page, { create = true } = {}) {
  await page.getByRole("button", { name: "Share the recap" }).click();
  const dialog = page.getByRole("dialog");
  if (create) await dialog.getByRole("button", { name: "Create the link" }).click();
  const shown = dialog.getByText(/\/recap\/[\w-]+$/);
  await expect(shown).toBeVisible();
  return (await shown.innerText()).trim();
}

test("someone who was not there reads the recap from the host's link, without a seat", async ({ page, openAsGuest }) => {
  const { link, guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);
  // Only the host shares it.
  await expect(guest.getByRole("button", { name: "Share the recap" })).toHaveCount(0);

  const shared = await shareLink(page);
  const visitor = await openAsGuest(shared);
  await expect(visitor.getByRole("heading", { level: 1, name: "Friday night" })).toBeVisible();
  await expect(visitor.getByText("Read-only: the recap as the group voted it")).toBeVisible();
  await expect(visitor.getByText(/^Shared by Sam/)).toBeVisible();
  await expect(idea(visitor, "Sushi")).toContainText("Kept");
  await expect(idea(visitor, "Pizza")).toContainText("Dropped");

  // Nothing to join or change, no names but the host's, and no seat taken.
  await expect(visitor.getByRole("button", { name: "Join the session" })).toHaveCount(0);
  await expect(visitor.getByText("Lea")).toHaveCount(0);
  await expect(visitor.getByText("Your idea")).toHaveCount(0);
  expect(await participantSecrets(link)).toHaveLength(2);
  expect((await visitor.request.get(`${link}/export?format=md`)).status()).toBe(403);

  // The same link while it stays on; turned off, it no longer opens.
  await page.reload();
  expect(await shareLink(page, { create: false })).toBe(shared);
  await clickAndConfirm(page, "Turn off the link");
  await expect(page.getByRole("dialog").getByRole("button", { name: "Create the link" })).toBeVisible();
  await visitor.reload();
  await expect(visitor.getByRole("heading", { name: "Session not found" })).toBeVisible();
});

test("while the group votes again, the link waits for the next recap", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);
  const visitor = await openAsGuest(await shareLink(page));
  await expect(idea(visitor, "Sushi")).toBeVisible();

  await page.keyboard.press("Escape");
  await clickAndConfirm(page, "Reopen voting");
  await expect(page).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await visitor.reload();
  await expect(visitor.getByRole("heading", { name: "Not decided yet" })).toBeVisible();
  await expect(visitor.getByText("The recap shows up here once Sam shows it to the group.")).toBeVisible();
  await expect(idea(visitor, "Sushi")).toHaveCount(0);
});
