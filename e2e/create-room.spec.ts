import { expect, test } from "@playwright/test";

test("the host creates a session and a guest opens its link", async ({ page, browser }) => {
  await page.goto("/");
  await page.getByLabel("Session name").fill("Lea's birthday");
  await page.getByLabel("Your first name").fill("Sam");
  await page.getByRole("button", { name: "Create the session" }).click();

  // The host lands on the first step, with the session name in the header.
  await expect(page).toHaveURL(/\/r\/[^/]+\/themes$/);
  await expect(page.getByRole("heading", { level: 1, name: "Lea's birthday" })).toBeVisible();

  // A guest (no participation cookie) opening the share link is asked for a first name.
  const shareLink = page.url().replace(/\/themes$/, "");
  const guest = await browser.newContext({ locale: "en-US" });
  const guestPage = await guest.newPage();
  await guestPage.goto(shareLink);
  await expect(guestPage.getByText("Sam invites you to “Lea's birthday”")).toBeVisible();
  await expect(guestPage.getByRole("button", { name: "Join the session" })).toBeVisible();
  await guest.close();
});
