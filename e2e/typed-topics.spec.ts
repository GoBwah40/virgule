import { readFile } from "node:fs/promises";

import type { Page } from "@playwright/test";

import {
  createRoom,
  expect,
  idea,
  join,
  LIVE_TIMEOUT,
  pick,
  seeRecap,
  startIdeas,
  test,
  vote,
} from "./helpers";

// Dates and amounts are formatted with `Intl` in English: "June 20 – 25, 2027" (thin spaces
// around the dash, hence `\s`), "€1,200".

/** Sam hosts "Holidays" and Lea has joined. */
async function setUp(page: Page, openAsGuest: (link: string) => Promise<Page>) {
  const link = await createRoom(page, { name: "Holidays", host: "Sam" });
  const guest = await openAsGuest(link);
  await join(guest, "Lea");
  return guest;
}

/** Adds one of the suggested topics ("Dates" is a period, "Budget" a range). */
async function addSuggestedTopic(page: Page, name: "Dates" | "Budget") {
  await page.getByRole("list", { name: "Topic ideas" }).getByRole("button", { name }).click();
  await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();
}

/** A topic card on the ideas page, holding its ideas and its composer. */
const card = (page: Page, title: string) => page.locator('[data-slot="card"]').filter({ hasText: title });

async function suggestPeriod(page: Page, from: string, to: string) {
  const dates = card(page, "Dates");
  await dates.getByLabel("From").fill(from);
  await dates.getByLabel("To").fill(to);
  await dates.getByRole("button", { name: "Add", exact: true }).click();
  // Emptied once added: typing the next one earlier would be wiped out.
  await expect(dates.getByLabel("From")).toHaveValue("");
}

async function suggestRange(page: Page, min: string, max: string) {
  const budget = card(page, "Budget");
  await budget.getByLabel(/^Between/).fill(min);
  await budget.getByLabel(/^And/).fill(max);
  await budget.getByRole("button", { name: "Add", exact: true }).click();
  await expect(budget.getByLabel(/^Between/)).toHaveValue("");
}

test("a period is suggested from… to…, never ending before it starts", async ({ page, openAsGuest }) => {
  const guest = await setUp(page, openAsGuest);
  await addSuggestedTopic(page, "Dates");
  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });

  const dates = card(guest, "Dates");
  const add = dates.getByRole("button", { name: "Add", exact: true });
  await dates.getByLabel("From").fill("2027-06-20");
  await dates.getByLabel("To").fill("2027-06-10");
  await expect(add).toBeDisabled();
  await dates.getByLabel("To").fill("2027-06-25");
  await add.click();

  await expect(idea(guest, "Your idea")).toHaveText(/June 20\s–\s25, 2027/);
  await expect(idea(page, "2027")).toHaveText(/June 20\s–\s25, 2027/, { timeout: LIVE_TIMEOUT });
  // The fields are emptied for the next idea.
  await expect(dates.getByLabel("From")).toHaveValue("");

  // The same period twice is a duplicate (and the fields keep it, to fix it).
  const hostDates = card(page, "Dates");
  await hostDates.getByLabel("From").fill("2027-06-20");
  await hostDates.getByLabel("To").fill("2027-06-25");
  await hostDates.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("This idea is already suggested in this topic: you can vote for it.")).toBeVisible();
});

test("a budget range is in whole euros, the second amount at least the first", async ({ page, openAsGuest }) => {
  const guest = await setUp(page, openAsGuest);
  await addSuggestedTopic(page, "Budget");
  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });

  const budget = card(guest, "Budget");
  const add = budget.getByRole("button", { name: "Add", exact: true });
  // Digits only: no sign, no decimals.
  await budget.getByLabel(/^Between/).fill("5a0.0");
  await expect(budget.getByLabel(/^Between/)).toHaveValue("500");
  await budget.getByLabel(/^And/).fill("100");
  await expect(add).toBeDisabled();
  // Said, not only shown by a disabled button.
  await expect(budget.getByLabel(/^And/)).toHaveAccessibleDescription("The second amount must be greater than or equal to the first.");
  await budget.getByLabel(/^And/).fill("1200");
  await expect(budget.getByText("The second amount must be greater than or equal to the first.")).toHaveCount(0);
  await add.click();

  await expect(idea(guest, "From €500 to €1,200")).toBeVisible();
  await expect(idea(page, "From €500 to €1,200")).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("a single date or amount is shown in full", async ({ page, openAsGuest }) => {
  const guest = await setUp(page, openAsGuest);
  for (const [title, kind] of [
    ["Party day", "Date"],
    ["Ticket price", "Amount"],
  ]) {
    await page.getByLabel("Topic", { exact: true }).fill(title);
    await pick(page, kind);
    await page.getByRole("button", { name: "Add the topic" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: title })).toBeVisible();
  }
  await startIdeas(page);

  await card(page, "Party day").getByLabel("Date").fill("2027-06-12");
  await card(page, "Party day").getByRole("button", { name: "Add", exact: true }).click();
  await card(page, "Ticket price").getByLabel(/^Amount/).fill("35");
  await card(page, "Ticket price").getByRole("button", { name: "Add", exact: true }).click();

  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await expect(card(guest, "Party day").getByText("June 12, 2027")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(card(guest, "Ticket price").getByText("€35")).toBeVisible();
});

test("the recap finds the common slot and the compatible budget", async ({ page, openAsGuest }) => {
  const guest = await setUp(page, openAsGuest);
  await addSuggestedTopic(page, "Dates");
  await addSuggestedTopic(page, "Budget");
  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });

  await suggestPeriod(page, "2027-06-10", "2027-06-20");
  await suggestRange(page, "500", "1000");
  await suggestPeriod(guest, "2027-06-15", "2027-06-25");
  await suggestRange(guest, "800", "1500");
  await expect(card(page, "Budget").getByRole("listitem")).toHaveCount(2, { timeout: LIVE_TIMEOUT });
  await expect(card(guest, "Dates").getByRole("listitem")).toHaveCount(2, { timeout: LIVE_TIMEOUT });

  // Everyone is for every idea: all four are kept.
  for (const p of [page, guest]) {
    for (const content of ["June 10", "June 15", "€500", "€800"]) await vote(p, content, "For");
  }
  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });

  for (const p of [page, guest]) {
    await expect(p.getByText("4 of 4 ideas kept")).toBeVisible();
    await expect(card(p, "Dates").getByText(/Common slot: June 15\s–\s20, 2027/)).toBeVisible();
    await expect(card(p, "Dates").getByText("Shared by all 2 periods kept.")).toBeVisible();
    await expect(card(p, "Budget").getByText("Compatible budget: €800 to €1,000")).toBeVisible();
    await expect(card(p, "Budget").getByText("Shared by all 2 ranges kept.")).toBeVisible();
  }
});

test("each person reads dates and amounts in their own language", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Holidays", host: "Sam" });
  await addSuggestedTopic(page, "Dates");
  await addSuggestedTopic(page, "Budget");
  await startIdeas(page);
  await suggestPeriod(page, "2027-06-01", "2027-06-14");
  await suggestPeriod(page, "2027-05-30", "2027-06-02");
  await suggestRange(page, "500", "1200");

  // Lea's browser is in French: the whole session follows, values included.
  const guest = await openAsGuest(link, { locale: "fr-FR" });
  await guest.getByLabel("C'est quoi ton prénom ?").fill("Lea");
  await guest.getByRole("button", { name: "Rejoindre la séance" }).click();
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });

  // French is built by hand: "1er", and the month only once when it is shared.
  await expect(idea(guest, "Du 1er au 14 juin 2027")).toBeVisible();
  await expect(idea(guest, "Du 30 mai au 2 juin 2027")).toBeVisible();
  await expect(idea(guest, "De 500")).toHaveText(/De 500\s€ à 1\s200\s€/);
  // Sam still reads English.
  await expect(idea(page, "June 1")).toHaveText(/June 1\s–\s14, 2027/);
});

test("the common slot goes into a calendar, from the session and from the shared recap", async ({ page, openAsGuest }) => {
  const guest = await setUp(page, openAsGuest);
  await addSuggestedTopic(page, "Dates");
  await addSuggestedTopic(page, "Budget");
  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await suggestPeriod(page, "2027-06-10", "2027-06-20");
  await suggestPeriod(guest, "2027-06-15", "2027-06-25");
  await suggestRange(page, "500", "1000");
  await expect(card(page, "Dates").getByRole("listitem")).toHaveCount(2, { timeout: LIVE_TIMEOUT });
  for (const content of ["June 10", "June 15", "€500"]) await vote(page, content, "For");
  await seeRecap(page);
  await expect(guest).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });

  // Only the topic with dates offers it.
  await expect(card(page, "Budget").getByRole("link", { name: "Add to calendar" })).toHaveCount(0);
  const download = async (p: Page) => {
    const [file] = await Promise.all([p.waitForEvent("download"), card(p, "Dates").getByRole("link", { name: "Add to calendar" }).click()]);
    expect(file.suggestedFilename()).toMatch(/^virgule-holidays-\d{4}-\d{2}-\d{2}\.ics$/);
    return readFile(await file.path(), "utf8");
  };
  // The common slot, June 15 to 20: an all-day event ends the day after.
  const ics = await download(guest);
  expect(ics).toContain("DTSTART;VALUE=DATE:20270615\r\n");
  expect(ics).toContain("DTEND;VALUE=DATE:20270621\r\n");
  expect(ics).toContain("SUMMARY:Holidays: Dates\r\n");

  // Someone who was not there gets the same, from the link Sam shares.
  await page.getByRole("button", { name: "Share the recap" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Create the link" }).click();
  const shared = page.getByRole("dialog").getByText(/\/recap\/[\w-]+$/);
  await expect(shared).toBeVisible();
  const visitor = await openAsGuest((await shared.innerText()).trim());
  expect(await download(visitor)).toContain("DTSTART;VALUE=DATE:20270615\r\n");
});
