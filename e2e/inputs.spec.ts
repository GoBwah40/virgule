import type { Page } from "@playwright/test";

import { LIMITS, MAX_THEMES } from "../src/lib/config";
import { MAX_OPTION_LENGTH } from "../src/lib/idea-value";
import {
  addTopic,
  createRoom,
  expect,
  fillAndSubmit,
  idea,
  join,
  LIVE_TIMEOUT,
  pick,
  startIdeas,
  suggestIdea,
  test,
} from "./helpers";

// What people type: shown exactly as written (never run as code), within the lengths the
// server accepts, without stray spaces, accents and emoji included.

/** Fails the test if the page ever opens a dialog (what injected code would do first). */
const noDialogs = (page: Page) =>
  page.on("dialog", (dialog) => {
    throw new Error(`Unexpected dialog: ${dialog.message()}`);
  });

test("text that looks like code is shown as written, and never runs", async ({ page, openAsGuest }) => {
  noDialogs(page);
  const name = `<b>Club</b> & "friends" <script>alert(1)</script>`;
  const link = await createRoom(page, { name, host: "<img src=x onerror=alert(2)>" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.locator("h1 b, img[src='x']")).toHaveCount(0);

  const guest = await openAsGuest(link);
  noDialogs(guest);
  await expect(guest.getByRole("heading", { level: 1, name: `<img src=x onerror=alert(2)> invites you to “${name}”` })).toBeVisible();
  await join(guest, "Lea");
  await addTopic(page, "<i>Dinner</i>");
  await startIdeas(page);
  await suggestIdea(page, "**Pizza** _tonight_ [link](javascript:alert(3))");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(guest.getByText("<i>Dinner</i>")).toBeVisible();
  await expect(idea(guest, "**Pizza** _tonight_ [link](javascript:alert(3))")).toBeVisible();
  await expect(guest.locator("main i, main strong, main a[href^='javascript']")).toHaveCount(0);
});

test("each field stops at the length the server accepts", async ({ page, openAsGuest }) => {
  await page.goto("/");
  await expect(page.getByLabel("Session name")).toHaveAttribute("maxlength", String(LIMITS.roomName));
  await expect(page.getByLabel("Your first name")).toHaveAttribute("maxlength", String(LIMITS.pseudo));

  const link = await createRoom(page, { name: "x".repeat(LIMITS.roomName), host: "y".repeat(LIMITS.pseudo) });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("x".repeat(LIMITS.roomName));
  await expect(page.getByLabel("Topic", { exact: true })).toHaveAttribute("maxlength", String(LIMITS.themeTitle));
  await expect(page.getByLabel("Details (optional)")).toHaveAttribute("maxlength", String(LIMITS.themeDescription));
  await pick(page, "List");
  await expect(page.getByPlaceholder("E.g. Seaside")).toHaveAttribute("maxlength", String(MAX_OPTION_LENGTH));
  await pick(page, "Text");

  const guest = await openAsGuest(link);
  await expect(guest.getByLabel("What's your first name?")).toHaveAttribute("maxlength", String(LIMITS.pseudo));
  await join(guest, "Lea");
  await addTopic(page, "Dinner");
  await startIdeas(page);
  await expect(page.getByLabel("Your idea…")).toHaveAttribute("maxlength", String(LIMITS.idea));
  // The longest idea goes through, in full.
  await suggestIdea(page, "z".repeat(LIMITS.idea));
  await expect(idea(guest, "z".repeat(LIMITS.idea))).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("spaces alone cannot be sent, and spaces around a name are dropped", async ({ page }) => {
  await page.goto("/");
  const create = page.getByRole("button", { name: "Create the session" });
  await expect(async () => {
    await page.getByLabel("Session name").fill("   ");
    await page.getByLabel("Your first name").fill("Sam");
    // Hydrated: the button reacts to what is typed.
    await page.getByLabel("Session name").fill("ok");
    await expect(create).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await page.getByLabel("Session name").fill("   ");
  await expect(create).toBeDisabled();
  await page.getByLabel("Session name").fill("Friday night");
  await page.getByLabel("Your first name").fill(" \t ");
  await expect(create).toBeDisabled();

  await fillAndSubmit(
    [
      [page.getByLabel("Session name"), "   Friday night  "],
      [page.getByLabel("Your first name"), "  Sam "],
    ],
    create,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Friday night", { timeout: LIVE_TIMEOUT });
  await expect(page.getByLabel("Sam · you · is hosting")).toBeVisible();
});

test("accents and emoji are kept as typed", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Été 🌞 à Noël", host: "Zoé" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Été 🌞 à Noël");
  const guest = await openAsGuest(link);
  await join(guest, "Ægir 🐙");
  await expect(page.getByLabel("Ægir 🐙's seat: options")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await addTopic(page, "Où dîner ? 🍽️");
  await startIdeas(page);
  await suggestIdea(guest, "Crêperie « Chez Zoé » 🥞");
  await expect(idea(page, "Crêperie « Chez Zoé » 🥞")).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test(`a session holds ${MAX_THEMES} topics at most`, async ({ page }) => {
  test.slow();
  await createRoom(page, { name: "Big plans", host: "Sam" });
  for (let n = 1; n <= MAX_THEMES; n++) await addTopic(page, `Topic ${n}`);

  // One more: refused by the server, with a word on why, and nothing added.
  await page.getByLabel("Topic", { exact: true }).fill("One too many");
  await page.getByRole("button", { name: "Add the topic" }).click();
  await expect(
    page.getByRole("region", { name: /Notifications/ }).getByText("You've reached the maximum number of topics."),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: /^Topic \d+/ })).toHaveCount(MAX_THEMES);
  await expect(page.getByRole("listitem").filter({ hasText: "One too many" })).toHaveCount(0);
});
