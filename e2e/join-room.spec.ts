import { closeRoom, createRoom, expect, expireRoom, join, LIVE_TIMEOUT, test } from "./helpers";

test("a guest joins the session and the host sees them arrive", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Weekend away", host: "Sam" });

  const guest = await openAsGuest(link);
  await expect(guest.getByText("1 participant out of 6")).toBeVisible();
  await expect(guest.getByRole("heading", { level: 1 })).toContainText("Weekend away");
  await join(guest, "Lea");

  await expect(guest.getByRole("heading", { level: 1, name: "Weekend away" })).toBeVisible();
  // Lea's own seat opens a menu (to leave the session); Sam's seat is labelled as hosting.
  await expect(guest.getByRole("button", { name: "Lea's seat: options" })).toBeVisible();
  await expect(guest.getByLabel("Sam · is hosting")).toBeVisible();

  await expect(page.getByRole("list", { name: "2 participants out of 6" })).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("a guest who has joined goes straight back to the session", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Team dinner", host: "Sam" });
  const guest = await openAsGuest(link);
  await join(guest, "Lea");

  await guest.goto(link);
  await expect(guest).toHaveURL(/\/themes$/);
  await expect(guest.getByRole("button", { name: "Leave the session" })).toBeVisible();
});

test("a first name already taken in the group is refused", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Book club", host: "Sam" });

  const guest = await openAsGuest(link);
  // Case-insensitive: "sam" clashes with the host's "Sam".
  await guest.getByLabel("What's your first name?").fill("sam");
  await guest.getByRole("button", { name: "Join the session" }).click();

  await expect(guest.getByText("This first name is already taken in the group.")).toBeVisible();
  await expect(guest).not.toHaveURL(/\/themes$/);
});

test("nobody can join once the 6 seats are taken", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Road trip", host: "Sam" });
  // Each guest leaves once seated: their page would otherwise keep polling the shared SQLite file.
  for (const pseudo of ["Lea", "Noe", "Ines", "Tom", "Zoe"]) {
    const guest = await openAsGuest(link);
    await join(guest, pseudo);
    await guest.context().close();
  }

  const late = await openAsGuest(link);
  await expect(late.getByText("6 participants out of 6")).toBeVisible();
  await expect(late.getByText("All 6 seats are taken. Ask Sam whether someone can give you theirs.")).toBeVisible();
  await expect(late.getByRole("button", { name: "Join the session" })).toHaveCount(0);
});

test("a session created for 4 is full with 4 people, and the host can make room", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Small group", host: "Sam", size: 4 });
  await expect(page.getByRole("list", { name: "1 participant out of 4" })).toBeVisible();
  for (const pseudo of ["Lea", "Noe", "Ines"]) {
    const guest = await openAsGuest(link);
    await join(guest, pseudo);
    await guest.context().close();
  }

  const late = await openAsGuest(link);
  await expect(late.getByText("All 4 seats are taken. Ask Sam whether someone can give you theirs.")).toBeVisible();

  // The host gives 4 more seats from the topic settings.
  await page.reload();
  await expect(page.getByRole("radio", { name: "4" })).toBeChecked();
  await page.getByText("8", { exact: true }).click();
  await expect(page.getByRole("list", { name: "4 participants out of 8" })).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(late.getByRole("button", { name: "Join the session" })).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("nobody can join a session that is over", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Housewarming", host: "Sam" });
  await closeRoom(link);

  const guest = await openAsGuest(link);
  await expect(guest.getByText("This session is over: everything is decided.")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Join the session" })).toHaveCount(0);
});

test("an expired session can no longer be opened", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Old plans", host: "Sam" });
  await expireRoom(link);

  const guest = await openAsGuest(link);
  await expect(guest.getByRole("heading", { name: "This session is no longer available" })).toBeVisible();
  await guest.getByRole("button", { name: "Create a new session" }).click();
  await expect(guest).toHaveURL(/\/$/);
});

test("an unknown link shows the not-found page", async ({ page }) => {
  await page.goto("/r/doesnotexist");
  await expect(page.getByRole("heading", { name: "Session not found" })).toBeVisible();
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.getByRole("button", { name: "Create the session" })).toBeVisible();
});
