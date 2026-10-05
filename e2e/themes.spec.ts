import type { Page } from "@playwright/test";

import {
  addTopic,
  clickAndConfirm,
  createRoom,
  expect,
  idea,
  join,
  LIVE_TIMEOUT,
  pick,
  startIdeas,
  suggestIdea,
  test,
  vote,
} from "./helpers";

/** Sam hosts "Friday night" and Lea has joined, with no topic yet. */
async function setUpEmpty(page: Page, openAsGuest: (link: string) => Promise<Page>) {
  const link = await createRoom(page, { name: "Friday night", host: "Sam" });
  const guest = await openAsGuest(link);
  await join(guest, "Lea");
  return guest;
}

/** A topic row on the host's topics page. */
const topic = (page: Page, title: string) => page.getByRole("listitem").filter({ hasText: title });

test("a guest suggests topics: the host adds one and sets the other aside, without knowing who", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);
  const suggest = async (title: string) => {
    await guest.getByLabel("Topic", { exact: true }).fill(title);
    await guest.getByRole("button", { name: "Suggest", exact: true }).click();
    await expect(guest.getByRole("listitem").filter({ hasText: title })).toBeVisible();
  };
  await suggest("Who drives?");
  await suggest("Saturday menu");
  await expect(guest.getByText("Waiting", { exact: true })).toHaveCount(2);

  // The same title again is refused.
  await guest.getByLabel("Topic", { exact: true }).fill("who drives? ");
  await guest.getByRole("button", { name: "Suggest", exact: true }).click();
  await expect(guest.getByText("This topic is already in the list or already suggested.")).toBeVisible();

  const card = page.locator("[data-slot=card]").filter({ hasText: "Suggested topics" });
  const suggested = card.getByRole("listitem").filter({ hasText: "Who drives?" });
  await expect(suggested).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(card).not.toContainText("Lea");
  await suggested.getByRole("button", { name: "Add" }).click();
  await page.getByRole("listitem").filter({ hasText: "Saturday menu" }).getByRole("button", { name: "Set aside" }).click();
  await expect(page.getByText("Suggested topics")).toHaveCount(0, { timeout: LIVE_TIMEOUT });
  await expect(topic(page, "Who drives?").getByRole("button", { name: "Edit" })).toBeVisible();

  // On the guest's side: the topic is in the list, nothing is waiting anymore.
  await expect(guest.getByText("Your suggestions")).toHaveCount(0, { timeout: LIVE_TIMEOUT });
  await expect(guest.getByRole("listitem").filter({ hasText: "Who drives?" })).toBeVisible();
});

test("the ideas cannot start without a topic", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);

  await expect(page.getByRole("heading", { name: "What do we need to decide?" })).toBeVisible();
  await expect(page.getByText("No topics yet.")).toBeVisible();
  await expect(page.getByText("Add at least one topic to get started.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start the ideas" })).toBeDisabled();

  // The guest can only suggest: no editor, no start.
  await expect(guest.getByText("Sam is preparing the topics, and you can suggest some. What comes next will show up here automatically.")).toBeVisible();
  await expect(guest.getByText("No topics yet.")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Add the topic" })).toHaveCount(0);
  await expect(guest.getByRole("button", { name: "Start the ideas" })).toHaveCount(0);
});

test("a topic with details and an answer type shows up for the guest", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);

  await page.getByLabel("Topic", { exact: true }).fill("When do we leave?");
  await page.getByLabel("Details (optional)").fill("Long weekend in May");
  await pick(page, "Period");
  await expect(page.getByText("Everyone suggests a period: from… to…")).toBeVisible();
  await page.getByRole("button", { name: "Add the topic" }).click();

  // The form is emptied for the next topic.
  await expect(topic(page, "When do we leave?")).toBeVisible();
  await expect(page.getByLabel("Topic", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Start the ideas" })).toBeEnabled();

  const row = topic(guest, "When do we leave?");
  await expect(row).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(row.getByText("Long weekend in May")).toBeVisible();
  await expect(row.getByText("Period")).toBeVisible();
});

test("a suggested topic is added in one tap", async ({ page, openAsGuest }) => {
  await setUpEmpty(page, openAsGuest);
  const suggestions = page.getByRole("list", { name: "Topic ideas" });

  await suggestions.getByRole("button", { name: "Budget" }).click();

  const row = topic(page, "Budget");
  await expect(row.getByText("How much are we ready to spend?")).toBeVisible();
  await expect(row.getByText("Range")).toBeVisible();
  // A suggestion already used is no longer offered.
  await expect(suggestions.getByRole("button", { name: "Budget" })).toHaveCount(0);
  await expect(suggestions.getByRole("button", { name: "Dates" })).toBeVisible();
});

test("the host edits, reorders and deletes topics", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);
  await addTopic(page, "Dinner");
  await addTopic(page, "Music");

  // The first topic cannot move up, the last one cannot move down.
  await expect(topic(page, "Dinner").getByRole("button", { name: "Move up" })).toBeDisabled();
  await topic(page, "Music").getByRole("button", { name: "Move up" }).click();
  await expect(topic(page, "Music").getByRole("button", { name: "Move up" })).toBeDisabled();
  await expect(topic(page, "Dinner").getByRole("button", { name: "Move down" })).toBeDisabled();

  await topic(page, "Dinner").getByRole("button", { name: "Edit" }).click();
  // While editing, the row holds a second "Topic" field: the one already filled in.
  const editTitle = page.locator("li").getByLabel("Topic", { exact: true });
  await expect(editTitle).toHaveValue("Dinner");
  await editTitle.fill("Dinner place");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(topic(page, "Dinner place")).toBeVisible();

  // No idea yet: deleting needs no confirmation.
  await topic(page, "Music").getByRole("button", { name: "Delete" }).click();
  await expect(topic(page, "Music")).toHaveCount(0);

  await expect(topic(guest, "Dinner place")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(topic(guest, "Music")).toHaveCount(0);
});

test("a list topic turns its options into ideas to vote on", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);

  await page.getByLabel("Topic", { exact: true }).fill("Where to?");
  await pick(page, "List");
  const option = page.getByPlaceholder("E.g. Seaside");
  const addTopicButton = page.getByRole("button", { name: "Add the topic" });
  await option.fill("Seaside");
  await option.press("Enter");
  // At least 2 options.
  await expect(addTopicButton).toBeDisabled();
  await option.fill("Mountain");
  await page.getByRole("button", { name: "Add the option" }).click();
  await expect(page.getByRole("button", { name: "Remove the option “Mountain”" })).toBeVisible();
  await addTopicButton.click();
  await expect(topic(page, "Where to?").getByText("List")).toBeVisible();

  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  for (const p of [page, guest]) {
    await expect(idea(p, "Seaside")).toBeVisible();
    await expect(idea(p, "Mountain")).toBeVisible();
  }
  // Closed list: only the host's options, no other suggestion.
  await expect(guest.getByText("Options set by Sam.")).toBeVisible();
  await expect(guest.getByLabel("Your idea…")).toHaveCount(0);
  await vote(guest, "Seaside", "For");
});

test("a topic can cap the “for” votes, except a single-answer list", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);
  const limit = page.getByRole("group", { name: "“For” votes per person" });

  // A single-answer list is already a limit of one: the setting goes away.
  await page.getByLabel("Topic", { exact: true }).fill("Yes or no?");
  await pick(page, "List");
  await expect(limit).toBeVisible();
  await page.getByRole("switch", { name: "One answer per person" }).click();
  await expect(limit).toHaveCount(0);
  await page.getByRole("switch", { name: "One answer per person" }).click();
  await expect(limit).toBeVisible();
  await pick(page, "Text");

  await page.getByLabel("Topic", { exact: true }).fill("Dinner");
  await limit.locator("label", { has: page.getByRole("radio", { name: "1", exact: true }) }).click();
  await page.getByRole("button", { name: "Add the topic" }).click();
  await expect(topic(page, "Dinner").getByText("1 vote per person")).toBeVisible();

  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await suggestIdea(page, "Sushi");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(guest.getByText("1 “for” vote left out of 1")).toBeVisible();

  await vote(guest, "Pizza", "For");
  await expect(guest.getByText("All your “for” votes are used")).toBeVisible();
  await expect(idea(guest, "Sushi").getByRole("button", { name: "For" })).toBeDisabled();
  // "Against" stays open, and the topic counts as done.
  await expect(idea(guest, "Sushi").getByRole("button", { name: "Against" })).toBeEnabled();
  await expect(guest.getByText("2/2 voted")).toBeVisible();
});

test("going back to the topics keeps the ideas, and locks their answer type", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);
  await addTopic(page, "Dinner");
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await expect(idea(page, "Pizza")).toBeVisible();

  await clickAndConfirm(page, "Edit the topics");
  await expect(page).toHaveURL(/\/themes$/, { timeout: LIVE_TIMEOUT });
  await expect(guest).toHaveURL(/\/themes$/, { timeout: LIVE_TIMEOUT });

  // Ideas exist: the answer type can no longer change, and deleting asks first.
  await topic(page, "Dinner").getByRole("button", { name: "Edit" }).click();
  await expect(page.getByText("Ideas have already been suggested: the answer type can no longer change.")).toBeVisible();
  await expect(page.locator("li").getByRole("radio", { name: "Date", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel" }).click();

  await topic(page, "Dinner").getByRole("button", { name: "Delete" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText("Delete “Dinner”?")).toBeVisible();
  await expect(dialog.getByText("1 idea suggested on this topic will be deleted along with its votes.")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Resume the ideas" }).click();
  await expect(page).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(idea(page, "Pizza")).toBeVisible();
  await expect(idea(guest, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });
});
