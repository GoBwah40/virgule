import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { type BrowserContext, test as base, expect, type Locator, type Page } from "@playwright/test";

// Server action then redirect: leaves room for a busy CI runner.
const REDIRECT_TIMEOUT = 15_000;

/** Changes made by someone else reach a page by polling (every 3 s, no Pusher in tests). */
export const LIVE_TIMEOUT = 10_000;

/** Database of the app started by playwright.config.ts (spec files are loaded as CommonJS). */
// The server writes to the same file: wait for its lock instead of failing at once (SQLITE_BUSY).
// `timeout` applies to every connection of the client's pool, unlike a `PRAGMA busy_timeout`.
const db = createClient({ url: `file:${path.join(__dirname, "../e2e.db")}`, timeout: 5000 });

async function write(sql: string, args: string[]) {
  await db.execute({ sql, args });
}

/** What must never reach a browser: every participant's secret token and id in the session. */
export async function participantSecrets(link: string) {
  const { rows } = await db.execute({
    sql: 'SELECT p.token, p.id, p.pseudo FROM "Participant" p JOIN "Room" r ON r.id = p."roomId" WHERE r.slug = ?',
    args: [slugOf(link)],
  });
  return rows.map((row) => ({ token: String(row.token), id: String(row.id), pseudo: String(row.pseudo) }));
}

/** Sessions with this name in the test database. */
export async function countRooms(name: string) {
  const { rows } = await db.execute({ sql: 'SELECT COUNT(*) AS n FROM "Room" WHERE name = ?', args: [name] });
  return Number(rows[0].n);
}

/**
 * Fills in a form, then submits it. Typed before React has hydrated the page, a value shows in
 * the field but not in the component state, and the button stays disabled: type it again until
 * the button is enabled. A person cannot type that fast after the page loads; Playwright can.
 */
export async function fillAndSubmit(fields: [Locator, string][], submit: Locator) {
  await expect(async () => {
    for (const [field, value] of fields) await field.fill(value);
    await expect(submit).toBeEnabled({ timeout: 1_000 });
  }).toPass({ timeout: REDIRECT_TIMEOUT });
  await submit.click();
}

/** Creates a session from the home page (default size unless `size` is given) and returns its share link. */
export async function createRoom(page: Page, { name, host, size }: { name: string; host: string; size?: number }) {
  await page.goto("/");
  if (size) {
    const option = page.getByRole("radio", { name: `${size} people` });
    // The radio is visually hidden inside its pill: clicking the pill picks it.
    await expect(async () => {
      await page.getByText(`${size} people`, { exact: true }).click();
      await expect(option).toBeChecked({ timeout: 1000 });
    }).toPass();
  }
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
export type OpenAsGuest = (link: string, options?: { locale?: string }) => Promise<Page>;

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

/** Sets what `document.visibilityState` reports and tells the page, as the browser would. */
export const setVisibility = (page: Page, state: DocumentVisibilityState) =>
  page.evaluate((state) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => state === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);

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

/** Host, on the topics page: turns on comments on ideas (off by default). */
export async function turnOnComments(page: Page) {
  const setting = page.getByRole("switch", { name: "Comments on ideas" });
  await setting.click();
  await expect(setting).toBeChecked();
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

/** Host: opens the room screen on their own device, in a tab of its own (a second display). */
export async function openPresentation(page: Page) {
  await page.getByRole("button", { name: "Show on a big screen" }).click();
  const [screen] = await Promise.all([page.waitForEvent("popup"), page.getByRole("link", { name: "Open on this device instead" }).click()]);
  await expect(screen).toHaveURL(/\/present$/, { timeout: REDIRECT_TIMEOUT });
  await page.keyboard.press("Escape");
  return screen;
}

/** Host: the pairing code shown on their phone, from the "Show on a big screen" dialog. */
export async function screenCode(page: Page) {
  const dialog = page.getByRole("dialog");
  if (!(await dialog.isVisible())) await page.getByRole("button", { name: "Show on a big screen" }).click();
  const code = dialog.locator("p").filter({ hasText: /^Pairing code / });
  await expect(code).toHaveText(/[2-9A-Z]{6}$/, { timeout: REDIRECT_TIMEOUT });
  return (await code.textContent())!.slice(-6);
}

/** On a TV (a fresh browser, no seat): types the code on the pairing page. */
export async function typeScreenCode(tv: Page, code: string) {
  await fillAndSubmit([[tv.getByLabel("Code", { exact: true }), code]], tv.getByRole("button", { name: "Show the session" }));
}

/** Host pairs a TV with the code from their phone; returns the TV's page, on the room screen. */
export async function pairScreen(page: Page, openAsGuest: OpenAsGuest) {
  const code = await screenCode(page);
  const tv = await openAsGuest(`${new URL(page.url()).origin}/present`);
  await typeScreenCode(tv, code);
  await expect(tv).toHaveURL(/\/r\/[^/]+\/present$/, { timeout: REDIRECT_TIMEOUT });
  await expect(page.getByRole("dialog")).toContainText("A screen is showing the session", { timeout: LIVE_TIMEOUT });
  await page.keyboard.press("Escape");
  return tv;
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

/** Every idea of the session suggested long ago: past the window to change it. */
export async function ageIdeas(link: string) {
  await write('UPDATE Idea SET "createdAt" = ? WHERE roomId = (SELECT id FROM Room WHERE slug = ?)', [
    "2000-01-01T00:00:00.000+00:00",
    slugOf(link),
  ]);
}

/** The paired room screen's secret, as stored (null without a screen). */
export async function screenSecret(link: string) {
  const { rows } = await db.execute({ sql: 'SELECT "screenToken" FROM "Room" WHERE slug = ?', args: [slugOf(link)] });
  return rows[0].screenToken === null ? null : String(rows[0].screenToken);
}

/** Pairing code shown on the host's phone already run out (see `elapseTimer`). */
export async function expireScreenCode(link: string) {
  await write('UPDATE Room SET "screenCodeExpiresAt" = createdAt WHERE slug = ?', [slugOf(link)]);
}

/** Comments of the session as stored, with their author: what must never reach a browser. */
export async function commentRows(link: string) {
  const { rows } = await db.execute({
    sql: 'SELECT c.id, c."authorId", c.content FROM "Comment" c JOIN "Room" r ON r.id = c."roomId" WHERE r.slug = ?',
    args: [slugOf(link)],
  });
  return rows.map((row) => ({ id: String(row.id), authorId: String(row.authorId), content: String(row.content) }));
}

/** `count` comments by the host on the session's first idea, written straight to the database. */
export async function fillComments(link: string, count: number) {
  for (let i = 0; i < count; i++) {
    await write(
      `INSERT INTO "Comment" (id, "roomId", "ideaId", "authorId", content, "createdAt")
       SELECT ?, r.id, (SELECT i.id FROM "Idea" i WHERE i."roomId" = r.id ORDER BY i."createdAt" LIMIT 1),
              (SELECT p.id FROM "Participant" p WHERE p."roomId" = r.id AND p."isHost" = 1), ?, ?
       FROM "Room" r WHERE r.slug = ?`,
      [`filler-${slugOf(link)}-${i}`, `Filler ${i}`, new Date().toISOString().replace("Z", "+00:00"), slugOf(link)],
    );
  }
}

export async function expireRoom(link: string) {
  // `createdAt` is in the past and stored in the same format as `expiresAt`.
  await write("UPDATE Room SET expiresAt = createdAt WHERE slug = ?", [slugOf(link)]);
}

/** The host's last reminder to vote sent long ago: past the wait before the next one. */
export async function ageNudge(link: string) {
  await write('UPDATE Room SET "nudgedAt" = ? WHERE slug = ?', ["2000-01-01T00:00:00.000+00:00", slugOf(link)]);
}
