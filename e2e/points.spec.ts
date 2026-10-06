import type { Page } from "@playwright/test";

import {
  clickAndConfirm,
  createRoom,
  downloadExport,
  expect,
  idea,
  join,
  LIVE_TIMEOUT,
  pick,
  seeRecap,
  startIdeas,
  suggestIdea,
  test,
} from "./helpers";

/** The − / count / + of an idea in a points topic. */
const stepper = (page: Page, content: string) => idea(page, content).getByRole("group", { name: "Your points for this idea" });

/** Gives one more point to an idea and waits for the count to show it. */
async function addPoint(page: Page, content: string, expected: string) {
  await stepper(page, content).getByRole("button", { name: "One point more" }).click();
  await expect(stepper(page, content).getByLabel(expected, { exact: true })).toBeVisible();
}

/** Sam hosts "Weekend", Lea has joined, Sam adds a "Where to?" topic voted with 3 points each. */
async function setUpPointsTopic(page: Page, openAsGuest: (link: string) => Promise<Page>) {
  const link = await createRoom(page, { name: "Weekend", host: "Sam" });
  const guest = await openAsGuest(link);
  await join(guest, "Lea");

  const limit = page.getByRole("group", { name: "“For” votes per person" });
  const budget = page.getByRole("group", { name: "Points per person" });
  await page.getByLabel("Topic", { exact: true }).fill("Where to?");
  // Points leave no room for a single answer nor a "for" vote limit.
  await pick(page, "List");
  await expect(page.getByRole("switch", { name: "One answer per person" })).toBeVisible();
  await pick(page, "Points");
  await expect(page.getByRole("switch", { name: "One answer per person" })).toHaveCount(0);
  await expect(limit).toHaveCount(0);
  await pick(page, "Text");
  await expect(budget.getByRole("radio", { name: "5", exact: true })).toBeChecked();
  await pick(page, "3");
  await page.getByRole("button", { name: "Add the topic" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Where to?" }).getByText("3 points per person")).toBeVisible();
  return { link, guest };
}

test("people spread their points within the budget, the recap ranks the totals", async ({ page, openAsGuest }) => {
  test.slow();
  const { link, guest } = await setUpPointsTopic(page, openAsGuest);

  await startIdeas(page);
  await suggestIdea(page, "Annecy");
  await suggestIdea(page, "Paris");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestIdea(guest, "Lyon");
  await expect(idea(page, "Lyon")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Paris")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(page.getByText("3 points left out of 3")).toBeVisible();

  // Sam: two points on the same idea, the last one elsewhere. Then the budget is spent.
  await addPoint(page, "Annecy", "1 point");
  await addPoint(page, "Annecy", "2 points");
  await expect(page.getByText("1 point left out of 3")).toBeVisible();
  await addPoint(page, "Lyon", "1 point");
  await expect(page.getByText("All your points are given")).toBeVisible();
  await expect(stepper(page, "Paris").getByRole("button", { name: "One point more" })).toBeDisabled();
  await expect(page.getByText("You voted on every idea")).toBeVisible();
  // One back, one elsewhere: points move freely within the budget.
  await stepper(page, "Annecy").getByRole("button", { name: "One point less" }).click();
  await expect(stepper(page, "Annecy").getByLabel("1 point", { exact: true })).toBeVisible();
  await addPoint(page, "Annecy", "2 points");

  // Lea opens a second tab that stops following the session: it still shows 3 points left.
  const stale = await guest.context().newPage();
  await stale.route("**/phase", (route) => route.abort("internetdisconnected"));
  await stale.goto(guest.url());
  await expect(stale.getByText("3 points left out of 3")).toBeVisible();

  // Lea puts all her points on Lyon, so nothing is left for another idea.
  await addPoint(guest, "Lyon", "1 point");
  await addPoint(guest, "Lyon", "2 points");
  await addPoint(guest, "Lyon", "3 points");
  await expect(guest.getByText("All your points are given")).toBeVisible();

  // From the stale tab, one more point goes past the budget: the server refuses it.
  await stepper(stale, "Paris").getByRole("button", { name: "One point more" }).click();
  await expect(stale.getByText("You've given all your points in this topic: take one back to give it to another idea.")).toBeVisible();
  await stale.close();

  // Nobody sees anyone else's points before the recap.
  await page.reload();
  await expect(stepper(page, "Lyon").getByLabel("1 point", { exact: true })).toBeVisible();
  await expect(page.getByText(/4 points/)).toHaveCount(0);
  expect((await page.request.get(`${link}/export?format=csv`)).status()).toBe(409);

  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
  // Lyon 1 + 3, Annecy 2, Paris none: ranked by total, kept with at least one point.
  const rows = page.getByRole("listitem").filter({ hasText: /Lyon|Annecy|Paris/ });
  await expect(rows.nth(0)).toContainText("Lyon");
  await expect(rows.nth(1)).toContainText("Annecy");
  await expect(idea(page, "Lyon")).toContainText("Kept");
  await expect(idea(page, "Annecy")).toContainText("Kept");
  await expect(idea(page, "Paris")).toContainText("Dropped");
  await idea(page, "Lyon").getByRole("button").click();
  await expect(idea(page, "Lyon").getByText("4 points")).toBeVisible();
  await expect(idea(page, "Lyon").getByText(/against/)).toHaveCount(0);

  const csv = await downloadExport(page, /CSV/);
  expect(csv.content).toContain("Round,Topic,Idea,For,Against,Score,Points,Status");
  expect(csv.content).toContain("1,Where to?,Lyon,,,,4,Kept");
  expect(csv.content).toContain("1,Where to?,Annecy,,,,2,Kept");
  expect(csv.content).toContain("1,Where to?,Paris,,,,0,Dropped");
  const markdown = await downloadExport(page, /Markdown/);
  expect(markdown.content).toContain("| Lyon | 4 | ✅ Kept |");
});

test("points stay off your own ideas when self-voting is off, and the setting locks once ideas exist", async ({ page, openAsGuest }) => {
  const { guest } = await setUpPointsTopic(page, openAsGuest);
  await page.getByRole("switch", { name: "Vote on your own ideas" }).click();
  await expect(page.getByRole("switch", { name: "Vote on your own ideas" })).not.toBeChecked();

  await startIdeas(page);
  await suggestIdea(page, "Annecy");
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestIdea(guest, "Lyon");
  await expect(idea(page, "Lyon")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(stepper(page, "Annecy").getByRole("button", { name: "One point more" })).toBeDisabled();
  await addPoint(page, "Lyon", "1 point");

  await clickAndConfirm(page, "Edit the topics");
  await expect(page).toHaveURL(/\/themes$/, { timeout: LIVE_TIMEOUT });
  await page.getByRole("listitem").filter({ hasText: "Where to?" }).getByRole("button", { name: "Edit" }).click();
  await expect(page.getByText("Ideas have already been suggested: the voting can no longer change.")).toBeVisible();
  await expect(page.locator("li").getByRole("radio", { name: "For / against", exact: true })).toBeDisabled();
});
