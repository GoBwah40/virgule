import { addTopic, createRoom, expect, LIVE_TIMEOUT, setPhase, setTopicKind, test } from "./helpers";

// Real server errors, without any test hook in the app: the database is given a value the app
// does not know (Prisma refuses to read it), then put back to test "Try again".

test("a failing step keeps the session header and recovers with Try again", async ({ page }) => {
  const link = await createRoom(page, { name: "Friday night", host: "Sam" });
  await addTopic(page, "Dinner");

  await setTopicKind(link, "UNKNOWN_KIND");
  await page.reload();

  await expect(page.getByRole("heading", { name: "This step couldn't be displayed" })).toBeVisible();
  await expect(page.getByText("Ideas already suggested and votes already cast are saved.")).toBeVisible();
  // Below the header, which still works: name and seats stay in place.
  await expect(page.getByRole("heading", { level: 1, name: "Friday night" })).toBeVisible();
  await expect(page.getByRole("list", { name: "1 participant out of 6" })).toBeVisible();
  // A code to quote, never the error itself.
  await expect(page.getByText(/^Error code: \w+/)).toBeVisible();
  await expect(page.getByText(/UNKNOWN_KIND|Prisma|enum/)).toHaveCount(0);

  // Once the cause is gone, Try again loads the data again, without a full reload.
  await setTopicKind(link, "TEXT");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Dinner" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This step couldn't be displayed" })).toHaveCount(0);
});

test("an error outside a step shows the general error page", async ({ page }) => {
  const link = await createRoom(page, { name: "Friday night", host: "Sam" });

  // Unknown phase: the session layout itself fails, header included.
  await setPhase(link, "UNKNOWN_PHASE");
  await page.reload();

  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  await expect(page.getByText("The page couldn't be displayed. Try again: most of the time, that's enough.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Friday night" })).toHaveCount(0);
  await expect(page.getByText(/^Error code: \w+/)).toBeVisible();
  await expect(page.getByText(/UNKNOWN_PHASE|Prisma|enum/)).toHaveCount(0);
  // The root layout is unaffected: footer and its settings remain.
  await expect(page.getByRole("button", { name: "Language, English" })).toBeVisible();

  await setPhase(link, "THEMES");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Friday night" })).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("the error page leads back home with a full reload", async ({ page }) => {
  const link = await createRoom(page, { name: "Friday night", host: "Sam" });
  await setPhase(link, "UNKNOWN_PHASE");
  await page.reload();

  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Create the session" })).toBeVisible();
});

test("the error page is in the reader's language", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Friday night", host: "Sam" });
  await setPhase(link, "UNKNOWN_PHASE");

  const french = await openAsGuest(link, { locale: "fr-FR" });
  await expect(french.getByRole("heading", { name: "Quelque chose n'a pas marché" })).toBeVisible();
  await expect(french.getByRole("button", { name: "Réessayer" })).toBeVisible();
  await expect(french.getByRole("button", { name: "Retour à l'accueil" })).toBeVisible();
});
