import type { Page } from "@playwright/test";

import {
  clickAndConfirm,
  expect,
  fillAndSubmit,
  fillComments,
  idea,
  LIVE_TIMEOUT,
  openPresentation,
  seeRecap,
  setUpSession,
  suggestIdea,
  suggestPizzaAndSushi,
  test,
} from "./helpers";

// Short anonymous comments on ideas, while ideas are open: everyone sees them, nobody knows
// whose they are, except their author.

/** The button under an idea that shows its comment count and opens them. */
const toggle = (page: Page, content: string) =>
  idea(page, content).first().getByRole("button", { name: /^(Comment|\d+ comments?)$/ });

const comments = (page: Page, content: string) => page.getByRole("list", { name: `Comments on “${content}”` });

const comment = (page: Page, content: string, text: string) => comments(page, content).getByRole("listitem").filter({ hasText: text });

/** Opens the comments of an idea, if they are not open yet. */
async function openComments(page: Page, content: string) {
  const button = toggle(page, content);
  if ((await button.getAttribute("aria-expanded")) !== "true") await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
}

async function addComment(page: Page, content: string, text: string) {
  await openComments(page, content);
  const row = idea(page, content).first();
  await fillAndSubmit([[row.getByLabel("Your comment on this idea"), text]], row.getByRole("button", { name: "Send" }));
  await expect(comment(page, content, text)).toBeVisible();
}

test("a comment shows to everyone without its author, who alone can remove it", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);

  await addComment(page, "Sushi", "Is it far from the station?");
  await expect(comment(page, "Sushi", "Is it far from the station?")).toContainText("Your comment");
  await expect(idea(page, "Sushi").getByLabel("Your comment on this idea")).toHaveAttribute("maxlength", "140");

  // Lea sees the count, then the comment, with nothing saying it is Sam's.
  await expect(toggle(guest, "Sushi")).toHaveText("1 comment", { timeout: LIVE_TIMEOUT });
  await openComments(guest, "Sushi");
  const seen = comment(guest, "Sushi", "Is it far from the station?");
  await expect(seen).toBeVisible();
  await expect(seen).not.toContainText("Your comment");
  await expect(seen.getByRole("button")).toHaveCount(0);

  // Sam removes his own comment, with no confirmation: it goes for Lea too.
  await comment(page, "Sushi", "Is it far from the station?").getByRole("button", { name: "Remove my comment" }).click();
  await expect(comment(page, "Sushi", "Is it far from the station?")).toHaveCount(0);
  await expect(toggle(guest, "Sushi")).toHaveText("Comment", { timeout: LIVE_TIMEOUT });
  await expect(seen).toHaveCount(0);
});

test("the host removes someone else's comment, after confirming", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  await addComment(guest, "Pizza", "Too heavy for a weeknight");
  await addComment(page, "Pizza", "Thin crust then");
  // Lea cannot remove Sam's.
  await expect(comment(guest, "Pizza", "Thin crust then")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(comment(guest, "Pizza", "Thin crust then").getByRole("button")).toHaveCount(0);

  await openComments(page, "Pizza");
  const theirs = comment(page, "Pizza", "Too heavy for a weeknight");
  await expect(theirs).not.toContainText("Your comment");
  await theirs.getByRole("button", { name: "Remove this comment" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove this comment" }).click();
  await expect(theirs).toHaveCount(0);
  await expect(comment(guest, "Pizza", "Too heavy for a weeknight")).toHaveCount(0, { timeout: LIVE_TIMEOUT });
  await expect(comment(guest, "Pizza", "Thin crust then")).toBeVisible();
});

test("three comments per person on an idea, fifty in a session", async ({ page, openAsGuest }) => {
  const { link, guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  for (const text of ["First thought", "Second thought", "Third thought"]) await addComment(guest, "Sushi", text);
  const field = idea(guest, "Sushi").getByLabel("Your comment on this idea");
  await expect(field).toBeDisabled();
  await expect(idea(guest, "Sushi")).toContainText("You've left 3 comments on this idea, the most you can.");
  // On another idea, she still can.
  await addComment(guest, "Pizza", "Fourth thought");

  // 4 so far: 46 more make the session's 50, after which nobody can add one.
  await fillComments(link, 46);
  await page.reload();
  await openComments(page, "Sushi");
  const row = idea(page, "Sushi").first();
  await fillAndSubmit([[row.getByLabel("Your comment on this idea"), "One too many"]], row.getByRole("button", { name: "Send" }));
  await expect(page.getByText("This session has reached its maximum number of comments.")).toBeVisible();
  await expect(comment(page, "Sushi", "One too many")).toHaveCount(0);
});

test("comments stay in the session's recap, read-only, and nowhere else", async ({ page, openAsGuest }) => {
  test.slow();
  const { link, guest } = await setUpSession(page, openAsGuest);
  const screen = await openPresentation(page);
  await suggestPizzaAndSushi(page, guest);
  await addComment(guest, "Sushi", "They deliver too");

  // Never on the room screen: a later idea shows there, the comment does not.
  await suggestIdea(page, "Tacos");
  await expect(screen.getByRole("region", { name: "Dinner" })).toContainText("Tacos", { timeout: LIVE_TIMEOUT });
  await expect(screen.getByText("They deliver too")).toHaveCount(0);
  expect(await screen.content()).not.toContain("They deliver too");

  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
  // In the recap, under the idea's votes: still anonymous, nothing to add or remove.
  for (const [who, mine] of [[guest, true], [page, false]] as const) {
    await idea(who, "Sushi").first().getByRole("button", { name: /Sushi/ }).click();
    const kept = comment(who, "Sushi", "They deliver too");
    await expect(kept).toBeVisible();
    if (mine) await expect(kept).toContainText("Your comment");
    else await expect(kept).not.toContainText("Your comment");
    await expect(kept.getByRole("button")).toHaveCount(0);
    await expect(who.getByLabel("Your comment on this idea")).toHaveCount(0);
  }
  await expect(screen.getByText("They deliver too")).toHaveCount(0);

  // Nor in the exports, nor behind the shared link.
  const markdown = await page.request.get(`${link}/export?format=md`);
  expect(await markdown.text()).not.toContain("They deliver too");
  const csv = await page.request.get(`${link}/export?format=csv`);
  expect(await csv.text()).not.toContain("They deliver too");
  await page.getByRole("button", { name: "Share the recap" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Create the link" }).click();
  const shown = dialog.getByText(/\/recap\/[\w-]+$/);
  await expect(shown).toBeVisible();
  const visitor = await openAsGuest((await shown.innerText()).trim());
  await expect(idea(visitor, "Sushi")).toBeVisible();
  await idea(visitor, "Sushi").getByRole("button", { name: /Sushi/ }).click();
  await expect(visitor.getByText("They deliver too")).toHaveCount(0);
  expect(await visitor.content()).not.toContain("They deliver too");
});

test("comments are kept when voting reopens", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  await addComment(guest, "Pizza", "With a salad");
  await seeRecap(page);
  await clickAndConfirm(page, "Reopen voting");
  await expect(page).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(toggle(page, "Pizza")).toHaveText("1 comment");
});
