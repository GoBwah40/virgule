import {
  choose,
  clickAndConfirm,
  createRoom,
  downloadExport,
  expect,
  join,
  LIVE_TIMEOUT,
  seeRecap,
  setUpSession,
  startIdeas,
  suggestPizzaAndSushi,
  test,
  vote,
  voteAndSeeRecap,
} from "./helpers";

/** Date of the export in its file name: the day in Paris, like "Generated on" in the file. */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

test("the recap can be exported, but not while votes are open", async ({ page, openAsGuest }) => {
  const { link, guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  // Scores are secret until the recap: no export during the ideas phase.
  expect((await page.request.get(`${link}/export?format=md`)).status()).toBe(409);

  await vote(page, "Pizza", "For");
  await vote(page, "Sushi", "For");
  await vote(guest, "Pizza", "Against");
  await vote(guest, "Sushi", "For");
  await seeRecap(page);

  const markdown = await downloadExport(page, /Markdown/);
  expect(markdown.name).toBe(`virgule-friday-night-${today()}.md`);
  expect(markdown.content).toContain("# Recap — Friday night");
  expect(markdown.content).toContain("- **Participants**: Sam, Lea");
  expect(markdown.content).toContain("- **Qualification rule**: positive score (for > against)");
  expect(markdown.content).toContain("| Sushi | 2 | 0 | 2 | ✅ Kept |");
  expect(markdown.content).toContain("| Pizza | 1 | 1 | 0 | Dropped |");

  const csv = await downloadExport(page, /CSV/);
  expect(csv.name).toBe(`virgule-friday-night-${today()}.csv`);
  expect(csv.content).toContain("Round,Topic,Idea,For,Against,Score,Status");
  expect(csv.content).toContain("1,Dinner,Sushi,2,0,2,Kept");

  // Every participant can export; nobody else, and only in known formats.
  expect((await downloadExport(guest, /Markdown/)).content).toContain("| Sushi | 2 | 0 | 2 | ✅ Kept |");
  const stranger = await openAsGuest(link);
  expect((await stranger.request.get(`${link}/export?format=md`)).status()).toBe(403);
  expect((await page.request.get(`${link}/export?format=pdf`)).status()).toBe(400);
});

test("the file name is safe whatever the session name", async ({ page }) => {
  await createRoom(page, { name: "Soirée d'été / Q3 !", host: "Sam" });
  await page.getByRole("list", { name: "Topic ideas" }).getByRole("button", { name: "Goal" }).click();
  await startIdeas(page);
  await seeRecap(page);

  const { name } = await downloadExport(page, /Markdown/);
  // Accents dropped, everything else turned into dashes.
  expect(name).toBe(`virgule-soiree-d-ete-q3-${today()}.md`);
});

test("an export in French follows French conventions", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);
  await choose(guest, "Language", "Français");

  const csv = await downloadExport(guest, /CSV/, "Exporter");
  // Excel in French expects ";", and the BOM keeps accents readable.
  expect(csv.content.startsWith("﻿Tour;Sujet;Idée;Pour;Contre;Score;Statut")).toBe(true);
  expect(csv.content).toContain("1;Dinner;Sushi;2;0;2;Retenue");
  expect(csv.content).toContain("1;Dinner;Pizza;1;1;0;Écartée");

  const markdown = await downloadExport(guest, /Markdown/, "Exporter");
  expect(markdown.content).toContain("# Bilan — Friday night");
  expect(markdown.content).toContain("- **Participants** : Sam, Lea");
  expect(markdown.content).toContain("- **Règle de qualification** : score positif (pour > contre)");
});

test("the export follows the qualification rule and lists every round, latest first", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);
  await page.getByRole("switch", { name: "Require a positive score" }).click();
  await expect(page.getByText("2 of 2 ideas kept")).toBeVisible();

  await clickAndConfirm(page, "Go for another round");
  await expect(page).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
  await vote(page, "Sushi", "For");
  await seeRecap(page);

  const markdown = (await downloadExport(page, /Markdown/)).content;
  expect(markdown).toContain("- **Qualification rule**: at least one “for” vote");
  expect(markdown.indexOf("## Round 2")).toBeGreaterThan(-1);
  expect(markdown.indexOf("## Round 2")).toBeLessThan(markdown.indexOf("## Round 1"));
  // Round 1 under the rule in force: Pizza (1–1) kept too.
  expect(markdown).toContain("| Pizza | 1 | 1 | 0 | ✅ Kept |");

  const csv = (await downloadExport(page, /CSV/)).content;
  expect(csv).toContain("1,Dinner,Pizza,1,1,0,Kept");
  expect(csv).toContain("2,Dinner,Sushi,1,0,1,Kept");
});

test("period topics export their summary", async ({ page, openAsGuest }) => {
  const link = await createRoom(page, { name: "Holidays", host: "Sam" });
  const guest = await openAsGuest(link);
  await join(guest, "Lea");
  await page.getByRole("list", { name: "Topic ideas" }).getByRole("button", { name: "Dates" }).click();
  await startIdeas(page);

  const dates = page.locator('[data-slot="card"]').filter({ hasText: "Dates" });
  for (const [from, to] of [
    ["2027-06-10", "2027-06-20"],
    ["2027-06-15", "2027-06-25"],
  ]) {
    await dates.getByLabel("From").fill(from);
    await dates.getByLabel("To").fill(to);
    await dates.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dates.getByLabel("From")).toHaveValue("");
  }
  await vote(page, "June 10", "For");
  await vote(page, "June 15", "For");
  await seeRecap(page);

  const markdown = (await downloadExport(page, /Markdown/)).content;
  expect(markdown).toMatch(/\*\*Common slot: June 15\s–\s20, 2027\*\*\. Shared by all 2 periods kept\./);
  const csv = (await downloadExport(page, /CSV/)).content;
  expect(csv).toMatch(/1,Dates,"?Common slot: June 15\s–\s20, 2027\. Shared by all 2 periods kept\."?,,,,Summary/);
});

test("Print / PDF opens the browser's print dialog, with a clean page", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);

  // The dialog itself belongs to the browser: check that the menu asks for it.
  await page.evaluate(() => {
    window.print = () => document.documentElement.setAttribute("data-printed", "");
  });
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("menuitem", { name: /Print/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "");

  // On paper: the recap without its buttons.
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "The recap" })).toBeVisible();
  await expect(page.getByText("Sushi")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeHidden();
  await expect(page.getByText("What's next")).toBeHidden();

  // And the browser does turn it into a PDF.
  const pdf = await page.pdf();
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");

  await page.emulateMedia({ media: "screen" });
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();
});

test("a session that is over can still be exported and printed", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await voteAndSeeRecap(page, guest);
  await clickAndConfirm(page, "End the session");
  await expect(page.getByRole("heading", { name: "It's decided" })).toBeVisible();

  expect((await downloadExport(guest, /Markdown/)).content).toContain("| Sushi | 2 | 0 | 2 | ✅ Kept |");

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "It's decided" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start a new session" })).toBeHidden();
});
