import path from "node:path";

import { createClient } from "@libsql/client";
import { type Browser, expect, type Page } from "@playwright/test";

// Server action then redirect: slower than a plain render under `next dev` with several workers.
const REDIRECT_TIMEOUT = 15_000;

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

/** Opens the share link as a new person (fresh browser context, so no participation cookie). */
export async function openAsGuest(browser: Browser, link: string) {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  await page.goto(link);
  return page;
}

/** Fills in the join form and waits for the first step. */
export async function join(page: Page, pseudo: string) {
  await page.getByLabel("What's your first name?").fill(pseudo);
  await page.getByRole("button", { name: "Join the session" }).click();
  await expect(page).toHaveURL(/\/r\/[^/]+\/themes$/, { timeout: REDIRECT_TIMEOUT });
}

const slugOf = (link: string) => new URL(link).pathname.split("/")[2];

/** States the UI cannot reach quickly: written straight to the database. */
export async function closeRoom(link: string) {
  await db.execute({ sql: "UPDATE Room SET phase = 'CLOSED' WHERE slug = ?", args: [slugOf(link)] });
}

export async function expireRoom(link: string) {
  // `createdAt` is in the past and stored in the same format as `expiresAt`.
  await db.execute({ sql: "UPDATE Room SET expiresAt = createdAt WHERE slug = ?", args: [slugOf(link)] });
}
