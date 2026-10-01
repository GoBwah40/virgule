import path from "node:path";

import { createClient } from "@libsql/client";
import { type BrowserContext, test as base, expect, type Page } from "@playwright/test";

// Server action then redirect: slower than a plain render under `next dev` with several workers.
const REDIRECT_TIMEOUT = 15_000;

/** Changes made by someone else reach a page by polling (every 3 s, no Pusher in tests). */
export const LIVE_TIMEOUT = 10_000;

/** Database of the app started by playwright.config.ts (spec files are loaded as CommonJS). */
const db = createClient({ url: `file:${path.join(__dirname, "../e2e.db")}` });

/** Creates a session from the home page and returns its share link. */
export async function createRoom(page: Page, { name, host }: { name: string; host: string }) {
  await page.goto("/");
  await page.getByLabel("Session name").fill(name);
  await page.getByLabel("Your first name").fill(host);
  await page.getByRole("button", { name: "Create the session" }).click();
  await expect(page).toHaveURL(/\/r\/[^/]+\/themes$/, { timeout: REDIRECT_TIMEOUT });
  return page.url().replace(/\/themes$/, "");
}

export { expect };

export const test = base.extend<{
  /** Opens the share link as a new person (fresh browser context, so no participation cookie). */
  openAsGuest: (link: string) => Promise<Page>;
}>({
  // Closed at the end of each test: an open session page keeps polling the server every 3 s,
  // and leftover guests would slow down the next tests of the worker.
  // `provide` rather than `use`: the React Hooks lint rule would take it for `React.use`.
  openAsGuest: async ({ browser }, provide) => {
    const contexts: BrowserContext[] = [];
    await provide(async (link) => {
      const context = await browser.newContext({ locale: "en-US" });
      contexts.push(context);
      const page = await context.newPage();
      await page.goto(link);
      return page;
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});

/** Fills in the join form and waits for the first step. */
export async function join(page: Page, pseudo: string) {
  await page.getByLabel("What's your first name?").fill(pseudo);
  await page.getByRole("button", { name: "Join the session" }).click();
  await expect(page).toHaveURL(/\/r\/[^/]+\/themes$/, { timeout: REDIRECT_TIMEOUT });
}

/** Host: adds a free-text topic from the topics page. */
export async function addTopic(page: Page, title: string) {
  await page.getByLabel("Topic", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Add the topic" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: title })).toBeVisible();
}

/** Host: starts the ideas phase; the guests' pages follow by themselves. */
export async function startIdeas(page: Page) {
  await page.getByRole("button", { name: "Start the ideas" }).click();
  await expect(page).toHaveURL(/\/ideas$/, { timeout: REDIRECT_TIMEOUT });
}

/** Suggests a text idea in the only topic of the page. */
export async function suggestIdea(page: Page, content: string) {
  await page.getByLabel("Your idea…").fill(content);
  await page.getByRole("button", { name: "Add", exact: true }).click();
}

/** An idea in the voting list, to read or vote on. */
export const idea = (page: Page, content: string) => page.getByRole("listitem").filter({ hasText: content });

const slugOf = (link: string) => new URL(link).pathname.split("/")[2];

/** States the UI cannot reach quickly: written straight to the database. */
export async function closeRoom(link: string) {
  await db.execute({ sql: "UPDATE Room SET phase = 'CLOSED' WHERE slug = ?", args: [slugOf(link)] });
}

export async function expireRoom(link: string) {
  // `createdAt` is in the past and stored in the same format as `expiresAt`.
  await db.execute({ sql: "UPDATE Room SET expiresAt = createdAt WHERE slug = ?", args: [slugOf(link)] });
}
