import type { Page } from "@playwright/test";

import {
  expect,
  idea,
  LIVE_TIMEOUT,
  openPresentation,
  pairScreen,
  participantSecrets,
  screenSecret,
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

// The room screen is seen by the whole room: it must not even say what the host's own page says
// to the host ("Your idea"), nor show any vote while ideas are open.

test("the room screen never receives who suggested an idea, nor anyone's token", async ({ page, openAsGuest }) => {
  test.slow();
  const { link, guest } = await setUpSession(page, openAsGuest);
  const screen = await openPresentation(page);
  const screenAnswers = await recordAnswers(screen);
  const hostAnswers = await recordAnswers(page);

  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestIdea(guest, "Sushi");
  const dinner = screen.getByRole("region", { name: "Dinner" });
  await expect(dinner.getByRole("listitem")).toHaveText(["Sushi", "Pizza"], { timeout: LIVE_TIMEOUT });
  // Nothing on screen tells Sam's idea from Lea's.
  await expect(screen.getByText("Your idea")).toHaveCount(0);
  await expect(screen.getByRole("button")).toHaveCount(0);
  await vote(page, "Sushi", "For");
  await vote(guest, "Pizza", "Against");
  await seeRecap(page);
  await expect(screen.getByText("Nobody knows who voted what")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await screen.reload();
  await page.reload();
  // The recording does see what the screen gets.
  expect(containing(screenAnswers, "Pizza").length).toBeGreaterThan(0);
  expect(containing(screenAnswers, "Sushi").length).toBeGreaterThan(0);

  for (const { token, id, pseudo } of await participantSecrets(link)) {
    expect(containing(screenAnswers, token), `${pseudo}'s token on the room screen`).toEqual([]);
    // Participant ids only go with the seats, never with an idea: no idea field carries one.
    expect(containing(screenAnswers, `"authorId":"${id}"`), `${pseudo}'s ideas on the room screen`).toEqual([]);
  }
  // Not even whether an idea is the host's: the host's own page says so, the screen never does.
  for (const field of ['"isMine"', '"canDelete"', '"myVote"', '"authorId"', '"token"']) {
    expect(containing(screenAnswers, field), field).toEqual([]);
  }
  expect(containing(hostAnswers, '"isMine"').length, "witness: the host's page does say it").toBeGreaterThan(0);
});

test("during the ideas phase, a vote changes nothing on the room screen", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestIdea(guest, "Sushi");
  await expect(idea(page, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
  // Everyone has voted once: from now on, the number of people who voted cannot move.
  await vote(page, "Sushi", "For");
  await vote(guest, "Pizza", "For");

  const screen = await openPresentation(page);
  await expect(screen.getByRole("progressbar")).toHaveText("Everyone has voted");
  const updates = await recordAnswers(screen, /\/present\?_rsc=/);
  await expect.poll(() => updates.length, { timeout: LIVE_TIMEOUT }).toBeGreaterThanOrEqual(2);
  const [before, again] = updates.slice(-2).map((update) => steady(update.body));
  expect(again).toBe(before);

  // New votes and a vote changed: nothing of it reaches the screen, not even a count.
  await vote(page, "Pizza", "Against");
  await vote(guest, "Pizza", "Against");
  await vote(guest, "Sushi", "For");
  const seen = updates.length;
  await expect.poll(() => updates.length, { timeout: LIVE_TIMEOUT }).toBeGreaterThanOrEqual(seen + 2);
  expect(steady(updates.at(-1)!.body)).toBe(before);
  await expect(screen.getByText(/\d+ (for|against)/)).toHaveCount(0);

  // Whereas a new idea does show: the comparison does see changes.
  await suggestIdea(guest, "Tacos");
  const afterIdea = updates.length;
  await expect.poll(() => updates.length, { timeout: LIVE_TIMEOUT }).toBeGreaterThanOrEqual(afterIdea + 1);
  await expect.poll(() => steady(updates.at(-1)!.body), { timeout: LIVE_TIMEOUT }).not.toBe(before);
  await expect(screen.getByRole("region", { name: "Dinner" })).toContainText("Tacos");
});

test("a TV paired by the host never receives anyone's token, nor its own secret", async ({ page, openAsGuest }) => {
  const { link, guest } = await setUpSession(page, openAsGuest);
  const hostAnswers = await recordAnswers(page);
  const guestAnswers = await recordAnswers(guest);
  const tv = await pairScreen(page, openAsGuest);
  const tvAnswers = await recordAnswers(tv);

  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(tv.getByRole("region", { name: "Dinner" })).toContainText("Pizza", { timeout: LIVE_TIMEOUT });
  await expect(tv.getByText("Your idea")).toHaveCount(0);
  await tv.reload();
  expect(containing(tvAnswers, "Pizza").length).toBeGreaterThan(0);

  const secret = await screenSecret(link);
  expect(secret).not.toBeNull();
  // The screen's secret lives in its httpOnly cookie only.
  for (const [who, answers] of [["the TV", tvAnswers], ["Sam", hostAnswers], ["Lea", guestAnswers]] as const) {
    expect(containing(answers, secret!), `the screen's secret in ${who}'s pages`).toEqual([]);
  }
  for (const { token, pseudo } of await participantSecrets(link)) {
    expect(containing(tvAnswers, token), `${pseudo}'s token on the TV`).toEqual([]);
  }
  for (const field of ['"isMine"', '"canDelete"', '"myVote"', '"authorId"', '"token"', '"screenToken"']) {
    expect(containing(tvAnswers, field), field).toEqual([]);
  }
});
