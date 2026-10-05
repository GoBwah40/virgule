import {
  addTopic,
  createRoom,
  expect,
  idea,
  join,
  LIVE_TIMEOUT,
  openPresentation,
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
  await expect(page.getByRole("link", { name: "Show on a big screen" })).toBeVisible();
  await expect(guest.getByRole("link", { name: "Show on a big screen" })).toHaveCount(0);

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
