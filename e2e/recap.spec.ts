import {
  clickAndConfirm,
  expect,
  idea,
  LIVE_TIMEOUT,
  seeRecap,
  setUpSession,
  suggestPizzaAndSushi,
  test,
  vote,
  voteAndSeeRecap,
} from "./helpers";

test("everyone sees the decision, only the host decides what comes next", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);

  for (const p of [page, guest]) {
    await expect(p.getByRole("heading", { name: "The recap" })).toBeVisible();
    await expect(p.getByText("1 of 2 ideas kept")).toBeVisible();
    await expect(idea(p, "Sushi").getByText("Kept")).toBeVisible();
    await expect(idea(p, "Pizza").getByText("Dropped")).toBeVisible();
  }
  // Recap rows show who suggested what only to its author.
  await expect(idea(guest, "Sushi").getByText("Your idea")).toBeVisible();
  await expect(idea(page, "Sushi").getByText("Your idea")).toHaveCount(0);

  await expect(page.getByText("What's next")).toBeVisible();
  await expect(guest.getByText("Sam is choosing what's next: a new round, or we stop here.")).toBeVisible();
  await expect(guest.getByRole("button", { name: "End the session" })).toHaveCount(0);
});

test("turning off the positive score rule keeps every idea with a vote for", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);

  const rule = page.getByRole("switch", { name: "Require a positive score" });
  await expect(rule).toBeChecked();
  await rule.click();
  await expect(rule).not.toBeChecked();

  // Pizza (1 for, 1 against) now qualifies, for the guest too.
  await expect(page.getByText("2 of 2 ideas kept")).toBeVisible();
  await expect(idea(guest, "Pizza").getByText("Kept")).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("another round keeps the ideas kept, with votes starting from zero", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);
  await expect(page.getByText("1 idea kept goes back to the vote, and everyone can suggest new ones.")).toBeVisible();

  await clickAndConfirm(page, "Go for another round");
  for (const p of [page, guest]) {
    await expect(p).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
    await expect(p.getByText("Round 2: we vote again on the ideas we kept, and you can suggest new ones.")).toBeVisible();
    await expect(idea(p, "Sushi").getByText("Kept from the previous round")).toBeVisible();
    await expect(idea(p, "Sushi").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "false");
    await expect(idea(p, "Pizza")).toHaveCount(0);
  }
  await expect(page.getByLabel("Your idea…")).toBeVisible();

  await vote(page, "Sushi", "For");
  await seeRecap(page);

  // One tab per round, the latest one open.
  await expect(page.getByRole("tab", { name: "Round 2", selected: true })).toBeVisible();
  await expect(page.getByText("1 of 1 idea kept")).toBeVisible();
  await page.getByRole("tab", { name: "Round 1" }).click();
  await expect(idea(page, "Pizza").getByText("Dropped")).toBeVisible();
});

test("a tie can be broken by voting again on the tied ideas only", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  // Pizza 1–0, Sushi 1–0: both tied for first.
  await vote(page, "Pizza", "For");
  await vote(guest, "Sushi", "For");
  await seeRecap(page);

  await expect(page.getByText("1 topic has ideas tied for first.")).toBeVisible();
  await expect(idea(page, "Pizza").getByText("Tied")).toBeVisible();
  await expect(idea(page, "Sushi").getByText("Tied")).toBeVisible();

  await clickAndConfirm(page, "Break the ties");
  for (const p of [page, guest]) {
    await expect(p).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
    await expect(p.getByText(/^Round 2, tiebreak:/)).toBeVisible();
    await expect(idea(p, "Pizza")).toBeVisible();
    await expect(idea(p, "Sushi")).toBeVisible();
    // No new ideas during a tiebreak.
    await expect(p.getByText("Tiebreak round: no new ideas.")).toBeVisible();
    await expect(p.getByLabel("Your idea…")).toHaveCount(0);
  }
});

test("reopening the vote brings everyone back with their votes", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);

  await clickAndConfirm(page, "Reopen voting");
  await expect(page).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(guest.getByRole("heading", { name: "The ideas" })).toBeVisible();
  await expect(idea(guest, "Pizza").getByRole("button", { name: "Against" })).toHaveAttribute("aria-pressed", "true");
  await expect(idea(page, "Pizza").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");
});

test("ending the session freezes the recap for everyone", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);

  await clickAndConfirm(page, "End the session");
  for (const p of [page, guest]) {
    await expect(p.getByRole("heading", { name: "It's decided" })).toBeVisible({ timeout: LIVE_TIMEOUT });
    await expect(p.getByText("The session is over. You can review and export the recap while it stays online.")).toBeVisible();
    await expect(idea(p, "Sushi").getByText("Kept")).toBeVisible();
  }
  await expect(page.getByText("What's next")).toHaveCount(0);

  await guest.getByRole("button", { name: "Start a new session" }).click();
  await expect(guest.getByRole("button", { name: "Create the session" })).toBeVisible();
});

test("a session that is over starts again with the same topics, hosted by whoever asks", async ({ page, openAsGuest }) => {
  const { link, guest } = await setUpSession(page, openAsGuest);
  // A setting of the topic that must come along: at most 2 "for" votes.
  await page.getByRole("listitem").filter({ hasText: "Dinner" }).getByRole("button", { name: "Edit" }).click();
  const limit = page.getByRole("group", { name: "“For” votes per person" }).first();
  await limit.locator("label", { has: page.getByRole("radio", { name: "2", exact: true }) }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("2 votes per person")).toBeVisible();
  await voteAndSeeRecap(page, guest);
  await clickAndConfirm(page, "End the session");
  await expect(guest.getByRole("heading", { name: "It's decided" })).toBeVisible({ timeout: LIVE_TIMEOUT });

  // Lea starts it again: she hosts the new session, alone, with the same topic and no ideas.
  await clickAndConfirm(guest, "Start again with these topics");
  await expect(guest).toHaveURL(/\/r\/[^/]+\/themes$/, { timeout: LIVE_TIMEOUT });
  expect(guest.url()).not.toContain(new URL(link).pathname);
  await expect(guest.getByRole("button", { name: "Add the topic" })).toBeVisible();
  await expect(guest.getByRole("listitem").filter({ hasText: "Dinner" }).getByText("2 votes per person")).toBeVisible();
  await expect(guest.getByRole("list", { name: "1 participant out of 6" })).toBeVisible();

  // The session that is over stays as it was.
  await page.reload();
  await expect(idea(page, "Sushi").getByText("Kept")).toBeVisible();
});
