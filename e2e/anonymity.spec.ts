import type { Page } from "@playwright/test";

import {
  expect,
  idea,
  LIVE_TIMEOUT,
  participantSecrets,
  seeRecap,
  setUpSession,
  startIdeas,
  suggestIdea,
  test,
  vote,
} from "./helpers";

// No accounts, anonymous votes: nothing that tells who is who may reach a browser. The answers a
// participant's page receives (pages, page updates, the step endpoint) are read here, as anyone
// could in their browser's developer tools. Read on the way (route.fetch): the browser does not
// keep every body for later.

/** Every answer from the app to this page matching `url`, from now on, as text. */
async function recordAnswers(page: Page, url: RegExp = /./) {
  const answers: { url: string; body: string }[] = [];
  const origin = new URL(page.url()).origin;
  await page.route(
    (target) => target.origin === origin && !target.pathname.startsWith("/_next/static/") && url.test(target.href),
    async (route) => {
      const response = await route.fetch();
      answers.push({ url: new URL(route.request().url()).pathname, body: await response.text() });
      await route.fulfill({ response });
    },
  );
  return answers;
}

const containing = (answers: { url: string; body: string }[], needle: string) =>
  answers.filter((answer) => answer.body.includes(needle)).map((answer) => answer.url);

/** A page update without what Next.js draws at random for each answer. */
const steady = (body: string) => body.replace(/[\w-]{21}(?=[a-z]")/g, "<id>");

test("no page ever receives a participant's token or who suggested an idea", async ({ page, openAsGuest }) => {
  test.slow();
  const { link, guest } = await setUpSession(page, openAsGuest);
  const guestAnswers = await recordAnswers(guest);
  const hostAnswers = await recordAnswers(page);

  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestIdea(guest, "Sushi");
  await expect(idea(page, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await vote(page, "Sushi", "For");
  await vote(guest, "Pizza", "Against");
  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
  await guest.reload();
  await page.reload();
  // The recording does see what the pages get: both ideas are there.
  expect(containing(guestAnswers, "Pizza").length).toBeGreaterThan(0);
  expect(containing(guestAnswers, "Sushi").length).toBeGreaterThan(0);

  const secrets = await participantSecrets(link);
  expect(secrets).toHaveLength(2);
  for (const { token, pseudo } of secrets) {
    // Tokens live in an httpOnly cookie only, never in a page, including one's own.
    expect(containing(guestAnswers, token), `${pseudo}'s token in Lea's pages`).toEqual([]);
    expect(containing(hostAnswers, token), `${pseudo}'s token in Sam's pages`).toEqual([]);
  }
  // Ideas say whether they are one's own, never whose they are.
  for (const field of ['"authorId"', '"participantId"', '"token"']) {
    expect(containing(guestAnswers, field), field).toEqual([]);
    expect(containing(hostAnswers, field), field).toEqual([]);
  }
});

test("during the ideas phase, another person's vote changes nothing in Lea's page", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestIdea(guest, "Sushi");
  await expect(idea(page, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });

  // Lea's page updates itself every few seconds: two in a row are alike, which makes the check
  // below meaningful.
  const updates = await recordAnswers(guest, /\/ideas\?_rsc=/);
  await expect.poll(() => updates.length, { timeout: LIVE_TIMEOUT }).toBeGreaterThanOrEqual(2);
  const [before, again] = updates.slice(-2).map((update) => steady(update.body));
  expect(again).toBe(before);

  // Sam votes on Lea's idea: nothing of it may reach her during the phase, not even a count.
  await vote(page, "Sushi", "For");
  const seen = updates.length;
  await expect.poll(() => updates.length, { timeout: LIVE_TIMEOUT }).toBeGreaterThanOrEqual(seen + 2);
  expect(steady(updates.at(-1)!.body)).toBe(before);

  // Whereas her own vote does show in her updates: the comparison does see changes.
  await vote(guest, "Pizza", "For");
  const afterOwn = updates.length;
  await expect.poll(() => updates.length, { timeout: LIVE_TIMEOUT }).toBeGreaterThanOrEqual(afterOwn + 1);
  expect(steady(updates.at(-1)!.body)).not.toBe(before);
});

test("the step endpoint answers participants only", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  // Sam's page, with his cookie: the current step, and nothing else.
  const own = await page.request.get(`${link}/phase`);
  expect(own.status()).toBe(200);
  expect(await own.json()).toEqual({ phase: "THEMES" });

  // Someone with the link who has not joined: nothing to learn, not even that the session exists.
  const stranger = await openAsGuest(link);
  const theirs = await stranger.request.get(`${link}/phase`);
  expect(theirs.status()).toBe(404);
  const unknown = await stranger.request.get(`${new URL(link).origin}/r/doesnotexist/phase`);
  expect(unknown.status()).toBe(404);
});
