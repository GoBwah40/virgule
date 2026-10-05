import {
  addTopic,
  createRoom,
  expect,
  expireScreenCode,
  idea,
  join,
  LIVE_TIMEOUT,
  openPresentation,
  pairScreen,
  pick,
  screenCode,
  typeScreenCode,
  seeRecap,
  setUpSession,
  startIdeas,
  suggestIdea,
  test,
  vote,
} from "./helpers";

// The room screen (TV, projector): opened by the host from their own device, it follows the
// session by itself, step after step, as the phones do.

test("the host's room screen follows the session, step after step", async ({ page, openAsGuest }) => {
  test.slow();
  const link = await createRoom(page, { name: "Friday night", host: "Sam" });
  const screen = await openPresentation(page);

  // Waiting: the name, the code to join and the seats.
  await expect(screen.getByRole("heading", { level: 1, name: "Friday night" })).toBeAttached();
  await expect(screen.getByRole("main").getByText("Friday night")).toBeVisible();
  await expect(screen.getByText("Sam is preparing the topics. Scan the code to join.")).toBeVisible();
  await expect(screen.getByRole("img", { name: "QR code for the invite link" })).toBeVisible();
  await expect(screen.getByText("1 seat out of 6 taken")).toBeVisible();
  await expect(screen.getByRole("list", { name: "Session steps" }).getByText("Topics")).toHaveAttribute("aria-current", "step");

  // Someone joins, the host adds a topic: the screen shows it without being touched.
  const guest = await openAsGuest(link);
  await join(guest, "Lea");
  await expect(screen.getByText("2 seats out of 6 taken")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await addTopic(page, "Dinner");
  await expect(screen.getByRole("heading", { name: "What we need to decide" })).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(screen.getByRole("heading", { name: "Dinner" })).toBeVisible();
  // Latecomers can still scan the code, in a corner.
  await expect(screen.getByRole("img", { name: "QR code for the invite link" })).toBeVisible();

  // Ideas arrive live, with how many people have voted.
  await startIdeas(page);
  const dinner = screen.getByRole("region", { name: "Dinner" });
  await expect(dinner).toContainText("Waiting for the first idea", { timeout: LIVE_TIMEOUT });
  await expect(screen.getByRole("list", { name: "Session steps" }).getByText("Ideas")).toHaveAttribute("aria-current", "step");
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestIdea(guest, "Sushi");
  await expect(dinner.getByRole("listitem")).toHaveText(["Sushi", "Pizza"], { timeout: LIVE_TIMEOUT });
  await expect(dinner).toContainText("2 ideas");
  await expect(screen.getByRole("progressbar", { name: "Participants who voted" })).toHaveText("Nobody has voted yet");

  await vote(page, "Pizza", "For");
  await vote(page, "Sushi", "For");
  await vote(guest, "Pizza", "Against");
  await expect(idea(guest, "Pizza").getByRole("button", { name: "Against" })).toHaveAttribute("aria-pressed", "true");
  await vote(guest, "Sushi", "For");
  await expect(screen.getByRole("progressbar")).toHaveText("Everyone has voted", { timeout: LIVE_TIMEOUT });

  // Recap: the kept idea in large, then the votes.
  await seeRecap(page);
  await expect(screen.getByRole("heading", { name: "Dinner" })).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(screen.getByText("Kept by the group")).toBeVisible();
  await expect(screen.getByRole("listitem").filter({ hasText: "Sushi" }).first()).toBeVisible();
  await expect(screen.getByRole("listitem").filter({ hasText: "Pizza" })).toContainText("1 for, 1 against");
  await expect(screen.getByText("Nobody knows who voted what")).toBeVisible();
  // Still the room screen: it never left for the host's own pages.
  await expect(screen).toHaveURL(/\/present$/);
});

test("only the host can open the room screen", async ({ page, openAsGuest }) => {
  const { link, guest } = await setUpSession(page, openAsGuest);
  await expect(page.getByRole("button", { name: "Show on a big screen" })).toBeVisible();
  await expect(guest.getByRole("button", { name: "Show on a big screen" })).toHaveCount(0);

  // A guest typing the address goes back to their step.
  await guest.goto(`${link}/present`);
  await expect(guest).toHaveURL(/\/themes$/);
  await expect(guest.getByRole("heading", { name: "What we need to decide" })).toHaveCount(0);

  // Someone with the link who has not joined: the join form, nothing of the session's content.
  const stranger = await openAsGuest(`${link}/present`);
  await expect(stranger.getByRole("button", { name: "Join the session" })).toBeVisible();
  await expect(stranger.getByText("Dinner")).toHaveCount(0);

  const unknown = await stranger.goto("/r/doesnotexist/present");
  expect(unknown?.status()).toBe(404);
});

test("the room screen goes back to the session once hosting is handed over", async ({ page, openAsGuest }) => {
  await setUpSession(page, openAsGuest);
  const screen = await openPresentation(page);
  await expect(screen.getByRole("heading", { name: "Dinner" })).toBeVisible();

  await page.getByRole("button", { name: "Lea's seat: options" }).click();
  await page.getByRole("menuitem", { name: "Hand over hosting" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Hand over hosting" }).click();
  // Sam is now a guest: the screen leaves for his own page instead of showing the session.
  await expect(screen).toHaveURL(/\/themes$/, { timeout: LIVE_TIMEOUT });
});

// Pairing a TV with the host's phone: a one-time code shown on the phone, typed on the screen.
// The screen takes no seat and is no participant; the host keeps the controls on their phone.

test("the host pairs a TV with a code from their phone, without giving it a seat", async ({ page, openAsGuest }) => {
  const { link, guest } = await setUpSession(page, openAsGuest);
  const code = await screenCode(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(`${new URL(link).host}/present`);
  await expect(dialog.getByRole("timer", { name: "Code valid for" })).toBeVisible();

  const tv = await openAsGuest(`${new URL(link).origin}/present`);
  await expect(tv.getByRole("heading", { level: 1, name: "Show a session on this screen" })).toBeVisible();
  // Typed as people do: lowercase, with a space in the middle.
  await typeScreenCode(tv, `${code.slice(0, 3).toLowerCase()} ${code.slice(3).toLowerCase()}`);
  await expect(tv).toHaveURL(`${link}/present`);
  await expect(tv.getByRole("heading", { name: "Dinner" })).toBeVisible();
  await expect(tv.getByText("2 seats out of 6 taken")).toBeVisible();
  await expect(dialog).toContainText("A screen is showing the session", { timeout: LIVE_TIMEOUT });

  // The host drives from the phone, the TV follows.
  await page.keyboard.press("Escape");
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(tv.getByRole("region", { name: "Dinner" })).toContainText("Pizza", { timeout: LIVE_TIMEOUT });
  // The guests see no change: still two seats, the TV is nobody's.
  await expect(guest.getByRole("list", { name: "2 participants out of 6" })).toBeVisible({ timeout: LIVE_TIMEOUT });

  // The TV is no participant: the session's own pages offer it to join, nothing more.
  await tv.goto(link);
  await expect(tv.getByRole("button", { name: "Join the session" })).toBeVisible();
});

test("a pairing code works once, and not once it has expired", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  const pairing = `${new URL(link).origin}/present`;

  const wrong = await openAsGuest(pairing);
  await typeScreenCode(wrong, "ABC 234");
  await expect(wrong.getByText("This code doesn't work: it may have expired. Ask for a new one.")).toBeVisible();
  await expect(wrong).toHaveURL(pairing);

  const code = await screenCode(page);
  const first = await openAsGuest(pairing);
  await typeScreenCode(first, code);
  await expect(first).toHaveURL(`${link}/present`);
  const second = await openAsGuest(pairing);
  await typeScreenCode(second, code);
  await expect(second.getByText(/^This code doesn't work/)).toBeVisible();
  await expect(second).toHaveURL(pairing);

  // A new code from the phone, left too long.
  await page.getByRole("button", { name: "Disconnect the screen" }).click();
  const late = await screenCode(page);
  await expireScreenCode(link);
  const third = await openAsGuest(pairing);
  await typeScreenCode(third, late);
  await expect(third.getByText(/^This code doesn't work/)).toBeVisible();
});

test("the host disconnects the TV: it goes back to pairing", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  const tv = await pairScreen(page, openAsGuest);
  expect((await tv.request.get(`${link}/phase`)).status()).toBe(200);

  await page.getByRole("button", { name: "Show on a big screen" }).click();
  await page.getByRole("button", { name: "Disconnect the screen" }).click();
  // A new code at once, for another screen.
  await expect(page.getByRole("dialog").locator("p").filter({ hasText: /^Pairing code / })).toHaveText(/[2-9A-Z]{6}$/);

  await expect(tv).toHaveURL(/\/present$/, { timeout: LIVE_TIMEOUT });
  await expect(tv).not.toHaveURL(/\/r\//);
  await expect(tv.getByRole("heading", { name: "Show a session on this screen" })).toBeVisible();
  expect((await tv.request.get(`${link}/phase`)).status()).toBe(404);
});

test("the room screen counts the seats of the session's own size", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Big family", host: "Sam", size: 12 });
  const screen = await openPresentation(page);
  await expect(screen.getByText("1 seat out of 12 taken")).toBeVisible();
  // The row of seats sits next to its label, at the bottom of the screen.
  await expect(screen.getByText("1 seat out of 12 taken").locator("..").locator("li")).toHaveCount(12);

  // Down to 4 while preparing: the screen follows, and says when the room is full.
  await pick(page, "4");
  await expect(screen.getByText("1 seat out of 4 taken")).toBeVisible({ timeout: LIVE_TIMEOUT });
  for (const name of ["Lea", "Noah", "Ines"]) await join(await openAsGuest(link), name);
  await expect(screen.getByText("All seats are taken")).toBeVisible({ timeout: LIVE_TIMEOUT });
  // Nobody else can join: the code to scan is gone.
  await expect(screen.getByRole("img", { name: "QR code for the invite link" })).toHaveCount(0);
});
