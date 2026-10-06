import type { Page } from "@playwright/test";

import {
  expect,
  idea,
  LIVE_TIMEOUT,
  seeRecap,
  setUpSession,
  startIdeas,
  suggestIdea,
  suggestPizzaAndSushi,
  test,
  vote,
} from "./helpers";

test("the guest follows the host into the ideas phase", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await expect(guest.getByText("Dinner")).toBeVisible({ timeout: LIVE_TIMEOUT });

  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(guest.getByRole("heading", { name: "The ideas" })).toBeVisible();
  await expect(guest.getByText("No ideas here yet. Who goes first?")).toBeVisible();
});

test("ideas are shared with the group, and only their author can remove them", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });

  await suggestIdea(guest, "Sushi");
  await expect(idea(guest, "Sushi").getByText("Your idea")).toBeVisible();

  // The host sees it, without knowing who suggested it, and cannot remove it.
  await expect(idea(page, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(idea(page, "Sushi").getByText("Your idea")).toHaveCount(0);
  await expect(idea(page, "Sushi").getByRole("button", { name: "Remove my idea" })).toHaveCount(0);

  // Its votes would go with it: asked first.
  await idea(guest, "Sushi").getByRole("button", { name: "Remove my idea" }).click();
  await expect(guest.getByRole("alertdialog").getByText("The votes already cast on it go with it.")).toBeVisible();
  await guest.getByRole("alertdialog").getByRole("button", { name: "Remove my idea" }).click();
  await expect(idea(guest, "Sushi")).toHaveCount(0);
  await expect(idea(page, "Sushi")).toHaveCount(0, { timeout: LIVE_TIMEOUT });
});

test("the same idea cannot be suggested twice in a topic", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });

  await suggestIdea(guest, "pizza");
  await expect(guest.getByText("This idea is already suggested in this topic: you can vote for it.")).toBeVisible();
  await expect(idea(guest, "Pizza")).toHaveCount(1);
});

test("votes stay secret during the ideas phase and decide the recap", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);

  const myVotes = (p: Page) => p.getByRole("progressbar", { name: "Ideas you voted on" });
  const groupVotes = page.getByRole("progressbar", { name: "Participants who voted" });
  await expect(myVotes(page)).toHaveAttribute("aria-valuetext", "2 ideas left without your vote");
  await expect(groupVotes).toHaveAttribute("aria-valuetext", "Nobody has voted yet");

  // Sam: for both ideas (voting on your own is allowed by default).
  await vote(page, "Pizza", "For");
  await vote(page, "Sushi", "For");
  await expect(myVotes(page)).toHaveAttribute("aria-valuetext", "You voted on every idea");
  await expect(groupVotes).toHaveAttribute("aria-valuetext", "1 person out of 2 has voted");

  // Lea: against Pizza, then changes her mind on Sushi (against → for).
  await vote(guest, "Pizza", "Against");
  await vote(guest, "Sushi", "Against");
  await vote(guest, "Sushi", "For");
  await expect(idea(guest, "Sushi").getByRole("button", { name: "Against" })).toHaveAttribute("aria-pressed", "false");
  await expect(groupVotes).toHaveAttribute("aria-valuetext", "Everyone has voted", { timeout: LIVE_TIMEOUT });

  // No score is visible while ideas are open, to anyone.
  for (const p of [page, guest]) await expect(p.getByText(/\d+ (for|against)/)).toHaveCount(0);

  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });

  // Kept: more "for" than "against". Sushi 2–0 is kept, Pizza 1–1 is dropped.
  await expect(guest.getByText("1 of 2 ideas kept")).toBeVisible();
  await expect(idea(guest, "Sushi").getByText("Kept")).toBeVisible();
  // Scores stay folded until you tap the idea.
  await idea(guest, "Sushi").getByRole("button", { expanded: false }).click();
  await expect(idea(guest, "Sushi").getByText("2 for")).toBeVisible();
  await expect(idea(guest, "Sushi").getByText("0 against")).toBeVisible();
  await expect(idea(guest, "Pizza").getByText("Dropped")).toBeVisible();
});

test("with self-voting turned off, nobody can vote on their own idea", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  const selfVote = page.getByRole("switch", { name: "Vote on your own ideas" });
  await selfVote.click();
  await expect(selfVote).not.toBeChecked();
  await suggestPizzaAndSushi(page, guest);

  await expect(idea(page, "Pizza").getByRole("button", { name: "For" })).toBeDisabled();
  await expect(idea(page, "Sushi").getByRole("button", { name: "For" })).toBeEnabled();
  await expect(idea(guest, "Sushi").getByRole("button", { name: "Against" })).toBeDisabled();
  // Only the other person's idea counts towards your progress.
  await expect(guest.getByRole("progressbar", { name: "Ideas you voted on" })).toHaveAttribute(
    "aria-valuetext",
    "1 idea left without your vote",
    { timeout: LIVE_TIMEOUT },
  );
});
