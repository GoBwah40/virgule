import type { Page } from "@playwright/test";

import { ageNudge, expect, idea, join, LIVE_TIMEOUT, setUpSession, startIdeas, suggestIdea, test, vote } from "./helpers";

// The host's reminder reaches every page; each page shows it only if its own participant still
// has ideas left without their vote. Nobody, the host included, learns who saw it.

const REMINDER = "Sam reminds the group: you still have ideas to vote on.";
const toast = (page: Page, text: string) => page.getByRole("region", { name: /Notifications/ }).getByText(text);
const remind = (page: Page) => page.getByRole("button", { name: "Remind the group to vote" });
const sent = (page: Page) => page.getByRole("button", { name: "Reminder sent" });

/** Sam hosts, Lea and Max have joined; "Pizza" and "Sushi" to vote on; Max has voted on both. */
async function setUp(page: Page, openAsGuest: (link: string) => Promise<Page>) {
  const { link, guest: lea } = await setUpSession(page, openAsGuest);
  const max = await openAsGuest(link);
  await join(max, "Max");
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  await suggestIdea(page, "Sushi");
  for (const p of [lea, max]) {
    await expect(p).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
    await expect(idea(p, "Sushi")).toBeVisible({ timeout: LIVE_TIMEOUT });
  }
  await vote(max, "Pizza", "For");
  await vote(max, "Sushi", "Against");
  await expect(max.getByText("You voted on every idea")).toBeVisible();
  return { link, lea, max };
}

test("only the people with votes left are reminded, and the host only learns it was sent", async ({ page, openAsGuest }) => {
  const { lea, max } = await setUp(page, openAsGuest);
  await expect(lea.getByRole("button", { name: "Remind the group to vote" })).toHaveCount(0);

  await remind(page).click();
  await expect(sent(page)).toBeDisabled();
  await expect(toast(lea, REMINDER)).toBeVisible({ timeout: LIVE_TIMEOUT });

  // Max has voted on everything: even once their page has the reminder, it shows nothing.
  await max.reload();
  await expect(max.getByText("You voted on every idea")).toBeVisible();
  await expect(toast(max, REMINDER)).toHaveCount(0);
  await expect(toast(page, REMINDER)).toHaveCount(0);

  // Shown once: coming back to the page does not remind Lea again.
  await lea.reload();
  await expect(idea(lea, "Pizza")).toBeVisible();
  await expect(toast(lea, REMINDER)).toHaveCount(0);
});

test("the host waits a minute between two reminders, even from another tab", async ({ page, openAsGuest }) => {
  const { link, lea } = await setUp(page, openAsGuest);
  // A second tab of the host, opened before the reminder and kept from updating: its button
  // stays enabled, as on a page that has not caught up yet.
  const other = await page.context().newPage();
  await other.goto(page.url());
  await other.route("**/phase", (route) => route.abort());
  await expect(remind(other)).toBeEnabled();

  await remind(page).click();
  await expect(sent(page)).toBeDisabled();
  await expect(toast(lea, REMINDER)).toBeVisible({ timeout: LIVE_TIMEOUT });

  // The server refuses it, wherever it comes from.
  await expect(remind(other)).toBeEnabled();
  await remind(other).click();
  await expect(toast(other, "A reminder was just sent: wait a minute before sending another.")).toBeVisible();

  // A minute later, the reminder can go again, and Lea, who still has votes left, sees it again.
  await vote(lea, "Pizza", "For");
  await lea.reload();
  await expect(idea(lea, "Pizza")).toBeVisible();
  await expect(toast(lea, REMINDER)).toHaveCount(0);
  await ageNudge(link);
  await page.reload();
  await expect(remind(page)).toBeEnabled();
  await remind(page).click();
  await expect(sent(page)).toBeDisabled();
  await expect(toast(lea, REMINDER)).toBeVisible({ timeout: LIVE_TIMEOUT });
});
