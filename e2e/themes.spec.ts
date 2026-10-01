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

test("the ideas cannot start without a topic", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);

  await expect(page.getByRole("heading", { name: "What do we need to decide?" })).toBeVisible();
  await expect(page.getByText("No topics yet.")).toBeVisible();
  await expect(page.getByText("Add at least one topic to get started.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start the ideas" })).toBeDisabled();

  // The guest only watches: no editor.
  await expect(guest.getByText("Sam is preparing the topics. What comes next will show up here automatically.")).toBeVisible();
  await expect(guest.getByText("No topics yet.")).toBeVisible();
  await expect(guest.getByLabel("Topic", { exact: true })).toHaveCount(0);
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

test("the ideas timer runs for everyone and the host can stop it", async ({ page, openAsGuest }) => {
  const guest = await setUpEmpty(page, openAsGuest);
  await addTopic(page, "Dinner");
  await pick(page, "5 min");

  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  for (const p of [page, guest]) await expect(p.getByRole("timer", { name: "Time left for ideas" })).toBeVisible();
  await expect(guest.getByRole("button", { name: "Stop the timer" })).toHaveCount(0);

  await page.getByRole("button", { name: "Stop the timer" }).click();
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(guest.getByRole("timer")).toHaveCount(0, { timeout: LIVE_TIMEOUT });
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
