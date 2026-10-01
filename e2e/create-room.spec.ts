import { expect, test } from "@playwright/test";

import { createRoom, openAsGuest } from "./helpers";

test("the host creates a session and a guest opens its link", async ({ page, browser }) => {
  const link = await createRoom(page, { name: "Lea's birthday", host: "Sam" });

  // The host lands on the first step, with the session name in the header.
  await expect(page.getByRole("heading", { level: 1, name: "Lea's birthday" })).toBeVisible();

  // A guest (no participation cookie) opening the share link is asked for a first name.
  const guest = await openAsGuest(browser, link);
  await expect(guest.getByText("Sam invites you to “Lea's birthday”")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Join the session" })).toBeVisible();
});
