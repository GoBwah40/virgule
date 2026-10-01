import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { type BrowserContext, test as base, expect, type Locator, type Page } from "@playwright/test";

// Server action then redirect: leaves room for a busy CI runner.
const REDIRECT_TIMEOUT = 15_000;

/** Changes made by someone else reach a page by polling (every 3 s, no Pusher in tests). */
export const LIVE_TIMEOUT = 10_000;

/** Database of the app started by playwright.config.ts (spec files are loaded as CommonJS). */
const db = createClient({ url: `file:${path.join(__dirname, "../e2e.db")}` });
// The server writes to the same file: wait for its lock instead of failing at once (SQLITE_BUSY).
const ready = db.execute("PRAGMA busy_timeout = 5000");

async function write(sql: string, args: string[]) {
  await ready;
  await db.execute({ sql, args });
}

/**
 * Fills in a form, then submits it. Typed before React has hydrated the page, a value shows in
 * the field but not in the component state, and the button stays disabled: type it again until
 * the button is enabled. A person cannot type that fast after the page loads; Playwright can.
 */
async function fillAndSubmit(fields: [Locator, string][], submit: Locator) {
  await expect(async () => {
    for (const [field, value] of fields) await field.fill(value);
    await expect(submit).toBeEnabled({ timeout: 1_000 });
  }).toPass({ timeout: REDIRECT_TIMEOUT });
  await submit.click();
}

/** Creates a session from the home page and returns its share link. */
export async function createRoom(page: Page, { name, host }: { name: string; host: string }) {
  await page.goto("/");
  await fillAndSubmit(
    [
      [page.getByLabel("Session name"), name],
      [page.getByLabel("Your first name"), host],
    ],
    page.getByRole("button", { name: "Create the session" }),
  );
  await expect(page).toHaveURL(/\/r\/[^/]+\/themes$/, { timeout: REDIRECT_TIMEOUT });
  return page.url().replace(/\/themes$/, "");
}

export { expect };

/** Opens the share link as a new person (fresh browser context, so no participation cookie). */
type OpenAsGuest = (link: string, options?: { locale?: string }) => Promise<Page>;

export const test = base.extend<{ openAsGuest: OpenAsGuest }>({
  // Closed at the end of each test: an open session page keeps polling the server every 3 s,
  // and leftover guests would slow down the next tests of the worker.
  // `provide` rather than `use`: the React Hooks lint rule would take it for `React.use`.
  openAsGuest: async ({ browser }, provide) => {
    const contexts: BrowserContext[] = [];
    await provide(async (link, { locale = "en-US" } = {}) => {
      const context = await browser.newContext({ locale });
      contexts.push(context);
      const page = await context.newPage();
      await page.goto(link);
      return page;
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});

/** Fills in the join form and waits for the current step of the session. */
export async function join(page: Page, pseudo: string) {
  await fillAndSubmit([[page.getByLabel("What's your first name?"), pseudo]], page.getByRole("button", { name: "Join the session" }));
  await expect(page).toHaveURL(/\/r\/[^/]+\/(themes|ideas|recap)$/, { timeout: REDIRECT_TIMEOUT });
}

/** Host: adds a free-text topic from the topics page. */
export async function addTopic(page: Page, title: string) {
  await fillAndSubmit([[page.getByLabel("Topic", { exact: true }), title]], page.getByRole("button", { name: "Add the topic" }));
  await expect(page.getByRole("listitem").filter({ hasText: title })).toBeVisible();
}

/** Picks an option of a segmented control: the radio itself is visually hidden, people tap its pill. */
export async function pick(page: Page, name: string) {
  const radio = page.getByRole("radio", { name, exact: true });
  await page.locator("label", { has: radio }).click();
  await expect(radio).toBeChecked();
}

/** Host: starts the ideas phase; the guests' pages follow by themselves. */
export async function startIdeas(page: Page) {
  await page.getByRole("button", { name: "Start the ideas" }).click();
  await expect(page).toHaveURL(/\/ideas$/, { timeout: REDIRECT_TIMEOUT });
}

/** Suggests a text idea in the only topic of the page. */
export async function suggestIdea(page: Page, content: string) {
  await fillAndSubmit([[page.getByLabel("Your idea…"), content]], page.getByRole("button", { name: "Add", exact: true }));
}

/** An idea in the voting list or the recap, to read or vote on. */
export const idea = (page: Page, content: string) => page.getByRole("listitem").filter({ hasText: content });

/** Sam hosts "Friday night", Lea has joined, one "Dinner" topic. Both stay on the topics page. */
export async function setUpSession(page: Page, openAsGuest: OpenAsGuest) {
  const link = await createRoom(page, { name: "Friday night", host: "Sam" });
  const guest = await openAsGuest(link);
  await join(guest, "Lea");
  await addTopic(page, "Dinner");
  return { link, guest };
}

/** From the topics page: ideas started, Sam suggests "Pizza", Lea "Sushi", both see both. */
export async function suggestPizzaAndSushi(page: Page, guest: Page) {
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestIdea(guest, "Sushi");
  await expect(idea(page, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });
}

/** Votes on an idea and waits for the vote to be recorded. */
export async function vote(page: Page, content: string, choice: "For" | "Against") {
  const button = idea(page, content).getByRole("button", { name: choice });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
}

/** From the topics page: Sam votes for both ideas, Lea against Pizza and for Sushi, then the recap.
 * Sushi 2–0 is kept, Pizza 1–1 is dropped. */
export async function voteAndSeeRecap(page: Page, guest: Page) {
  await suggestPizzaAndSushi(page, guest);
  await vote(page, "Pizza", "For");
  await vote(page, "Sushi", "For");
  await vote(guest, "Pizza", "Against");
  await vote(guest, "Sushi", "For");
  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
}

/** Downloads an export from the recap menu ("Export" button, "Markdown" or "CSV" item). */
export async function downloadExport(page: Page, format: RegExp, button = "Export") {
  await page.getByRole("button", { name: button, exact: true }).click();
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: format }).click()]);
  return { name: file.suggestedFilename(), content: await readFile(await file.path(), "utf8") };
}

/** Picks a choice in one of the footer menus ("Theme, Same as device", "Language, English"…). */
export async function choose(page: Page, menu: string, option: string) {
  await page.getByRole("button", { name: new RegExp(`^${menu}, `) }).click();
  await page.getByRole("menuitemradio", { name: option }).click();
}

/** Clicks a button that asks for confirmation, then confirms (the dialog repeats its label). */
export async function clickAndConfirm(page: Page, name: string) {
  await page.getByRole("button", { name }).click();
  await page.getByRole("alertdialog").getByRole("button", { name }).click();
}

/** Host: closes voting; everyone's page moves to the recap. */
export async function seeRecap(page: Page) {
  await clickAndConfirm(page, "See the recap");
  await expect(page).toHaveURL(/\/recap$/, { timeout: REDIRECT_TIMEOUT });
}

const slugOf = (link: string) => new URL(link).pathname.split("/")[2];

/**
 * States the UI cannot reach quickly, written straight to the database. Any text is accepted:
 * a value the app does not know (an unknown phase…) makes it fail for real, to test errors.
 */
export async function setPhase(link: string, phase: string) {
  await write("UPDATE Room SET phase = ? WHERE slug = ?", [phase, slugOf(link)]);
}

export const closeRoom = (link: string) => setPhase(link, "CLOSED");

/** Answer type of every topic of the session (see `setPhase`). */
export async function setTopicKind(link: string, kind: string) {
  await write("UPDATE Theme SET kind = ? WHERE roomId = (SELECT id FROM Room WHERE slug = ?)", [kind, slugOf(link)]);
}

/** Ideas timer already run out (`createdAt` is in the past, in the same format as `phaseEndsAt`). */
export async function elapseTimer(link: string) {
  await write("UPDATE Room SET phaseEndsAt = createdAt WHERE slug = ?", [slugOf(link)]);
}

export async function expireRoom(link: string) {
  // `createdAt` is in the past and stored in the same format as `expiresAt`.
  await write("UPDATE Room SET expiresAt = createdAt WHERE slug = ?", [slugOf(link)]);
}
