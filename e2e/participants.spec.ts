import type { Page } from "@playwright/test";

import {
  expect,
  idea,
  join,
  LIVE_TIMEOUT,
  seeRecap,
  setUpSession,
  suggestPizzaAndSushi,
  test,
  vote,
} from "./helpers";

const seats = (page: Page, count: number) =>
  page.getByRole("list", { name: `${count} ${count === 1 ? "participant" : "participants"} out of 6` });

test("the host hands over hosting and stays as a participant", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);

  await page.getByRole("button", { name: "Lea's seat: options" }).click();
  await page.getByRole("menuitem", { name: "Hand over hosting" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText("Hand over hosting to Lea?")).toBeVisible();
  await expect(dialog.getByText("Lea will run the steps. You stay in the session as a participant.")).toBeVisible();
  await dialog.getByRole("button", { name: "Hand over hosting" }).click();

  // Sam now waits like a guest, and may leave.
  await expect(page.getByText("Lea is preparing the topics. What comes next will show up here automatically.")).toBeVisible();
  await expect(page.getByLabel("Lea · is hosting")).toBeVisible();
  await expect(page.getByRole("button", { name: "Leave the session" })).toBeVisible();

  // Lea gets the topic editor and the seat options.
  await expect(guest.getByLabel("Topic", { exact: true })).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(guest.getByRole("button", { name: "Start the ideas" })).toBeEnabled();
  await expect(guest.getByRole("button", { name: "Sam's seat: options" })).toBeVisible();
  await expect(guest.getByRole("button", { name: "Leave the session" })).toHaveCount(0);
});

test("a removed participant loses their ideas and can come back with the link", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);

  await page.getByRole("button", { name: "Lea's seat: options" }).click();
  await page.getByRole("menuitem", { name: "Remove from the session" }).click();
  await expect(
    page.getByText("Their ideas and votes are deleted. Lea can come back with the link if a seat is still free."),
  ).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove from the session" }).click();

  await expect(seats(page, 1)).toBeVisible();
  await expect(idea(page, "Sushi")).toHaveCount(0);
  await expect(idea(page, "Pizza")).toBeVisible();

  // Lea's page sends her back to the join form, from which she can take a seat again.
  await expect(guest.getByText("Sam invites you to “Friday night”")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await join(guest, "Lea");
  await expect(guest).toHaveURL(/\/ideas$/);
  await expect(seats(page, 2)).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("a guest leaves the session and frees their seat", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  // Whoever is hosting hands over hosting first: no way out for them.
  await expect(page.getByRole("button", { name: "Leave the session" })).toHaveCount(0);

  await guest.getByRole("button", { name: "Leave the session" }).click();
  await expect(guest.getByText("Your ideas and votes are deleted and your seat is freed.", { exact: false })).toBeVisible();
  await guest.getByRole("alertdialog").getByRole("button", { name: "Leave the session" }).click();

  await expect(guest.getByRole("button", { name: "Create the session" })).toBeVisible();
  await expect(seats(page, 1)).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(idea(page, "Sushi")).toHaveCount(0);
});

test("from the first recap on, seats are frozen so the results stay as voted", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  await vote(guest, "Pizza", "For");
  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });

  // The host can still hand over hosting, but no longer remove anyone.
  await page.getByRole("button", { name: "Lea's seat: options" }).click();
  await expect(page.getByRole("menuitem", { name: "Hand over hosting" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Remove from the session" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  // Nor can the guest leave: their seat has no options any more.
  await expect(guest.getByRole("button", { name: "Leave the session" })).toHaveCount(0);
  await expect(guest.getByRole("button", { name: "Lea's seat: options" })).toHaveCount(0);
  await expect(guest.getByLabel("Lea · you")).toBeVisible();
});

test("the invite link can be copied or scanned", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const clipboard = () => page.evaluate(() => navigator.clipboard.readText());

  await page.getByRole("button", { name: "Copy the invite link", exact: true }).click();
  await expect(page.getByText("Link copied, you can share it with the group")).toBeVisible();
  expect(await clipboard()).toBe(link);

  // A free seat copies the same link.
  await page.evaluate(() => navigator.clipboard.writeText(""));
  await page.getByRole("button", { name: "Free seat: tap to copy the invite link" }).first().click();
  await expect.poll(clipboard).toBe(link);

  await page.getByRole("button", { name: "Invite with a QR code" }).click();
  const dialog = page.getByRole("dialog", { name: "Invite the group" });
  await expect(dialog.getByText("4 seats left. Scan the QR code or send the link.")).toBeVisible();
  await expect(dialog.getByRole("img", { name: "QR code for the invite link" })).toBeVisible();
});

test("the invite dialog says when every seat is taken", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  for (const pseudo of ["Noe", "Ines", "Tom", "Zoe"]) {
    const guest = await openAsGuest(link);
    await join(guest, pseudo);
    await guest.context().close();
  }
  await expect(seats(page, 6)).toBeVisible({ timeout: LIVE_TIMEOUT });

  await page.getByRole("button", { name: "Invite with a QR code" }).click();
  await expect(page.getByText("All seats are taken: nobody else can join the session.")).toBeVisible();
});
