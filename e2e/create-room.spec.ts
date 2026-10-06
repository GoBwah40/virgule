import { createRoom, expect, test } from "./helpers";

test("the host creates a session and a guest opens its link", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Lea's birthday", host: "Sam" });

  // The host lands on the first step, with the session name in the header.
  await expect(page.getByRole("heading", { level: 1, name: "Lea's birthday" })).toBeVisible();

  // A guest (no participation cookie) opening the share link is asked for a first name.
  const guest = await openAsGuest(link);
  await expect(guest.getByRole("heading", { level: 1, name: "Sam invites you to “Lea's birthday”" })).toBeVisible();
  await expect(guest.getByRole("button", { name: "Join the session" })).toBeVisible();
});
