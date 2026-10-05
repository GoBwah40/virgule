import { addTopic, expect, fillAndSubmit, idea, LIVE_TIMEOUT, pick, seeRecap, setUpSession, startIdeas, test, vote } from "./helpers";

// List or board, picked by each person from tablets up, once for every step: topics as cards,
// ideas in one column per topic, the recap topic by topic.

test.describe("on a computer", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test("the board, picked once on the topics, follows every step and the next visits", async ({ page, openAsGuest }) => {
    test.slow();
    const { guest } = await setUpSession(page, openAsGuest);
    await addTopic(page, "Drinks");

    // Topics: a list by default, cards on the board, with the host's actions still there.
    // "List" is also an answer kind in the topic form: the switch is the "Display" group.
    await expect(page.getByRole("group", { name: "Display" }).getByRole("radio", { name: "List" })).toBeChecked();
    await pick(page, "Board");
    const drinks = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Drinks" }) });
    await expect(drinks).toBeVisible();
    await drinks.getByRole("button", { name: "Move up" }).click();
    await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Drinks", "Dinner"]);
    // A choice of this browser only: Lea still has the list.
    await expect(guest.getByRole("group", { name: "Display" }).getByRole("radio", { name: "List" })).toBeChecked();
    await expect(guest.getByRole("heading", { name: "Dinner", level: 3 })).toHaveCount(0, { timeout: LIVE_TIMEOUT });

    // Ideas: still a board, the latest idea first, votes working.
    await startIdeas(page);
    await expect(page.getByRole("radio", { name: "Board" })).toBeChecked();
    const dinner = page.locator('[data-slot="card"]').filter({ has: page.getByText("Dinner", { exact: true }) });
    await fillAndSubmit([[dinner.getByLabel("Your idea…"), "Pizza"]], dinner.getByRole("button", { name: "Add", exact: true }));
    await expect(idea(page, "Pizza")).toBeVisible();
    await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
    await vote(guest, "Pizza", "For");
    await vote(page, "Pizza", "For");

    // Recap: topic by topic, with buttons to move.
    await seeRecap(page);
    await expect(page.getByRole("radio", { name: "Topic by topic" })).toBeChecked();
    const results = page.getByRole("region", { name: "Results by topic" });
    await expect(results.getByRole("group")).toHaveAccessibleName("Topic 1 of 2");
    await expect(results.getByRole("heading", { name: "Drinks" })).toBeVisible();
    await expect(results).toContainText("No idea kept on this topic");
    await results.getByRole("button", { name: "Next topic" }).click();
    await expect(results.getByRole("heading", { name: "Dinner" })).toBeVisible();
    await expect(results).toContainText("Kept by the group");
    await expect(results.getByRole("listitem").filter({ hasText: "Pizza" }).last()).toContainText("2 for, 0 against");

    // Next visit: as left.
    await page.reload();
    await expect(page.getByRole("radio", { name: "Topic by topic" })).toBeChecked();
    // The list is one tap away.
    await pick(page, "List");
    await expect(idea(page, "Pizza")).toBeVisible();
  });

  test("printed, the recap is the full list, even topic by topic", async ({ page, openAsGuest }) => {
    const { guest } = await setUpSession(page, openAsGuest);
    await addTopic(page, "Drinks");
    await pick(page, "Board");
    await startIdeas(page);
    await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
    await seeRecap(page);
    await expect(page.getByRole("radio", { name: "Topic by topic" })).toBeChecked();

    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("region", { name: "Results by topic" })).toBeHidden();
    await expect(page.getByRole("group", { name: "Display" })).toBeHidden();
    await expect(page.getByText("Dinner", { exact: true }).filter({ visible: true })).toHaveCount(1);
    await expect(page.getByText("Drinks", { exact: true }).filter({ visible: true })).toHaveCount(1);
  });
});

test("on a phone, there is no board to pick: one column only", async ({ page, openAsGuest }) => {
  await setUpSession(page, openAsGuest);
  await expect(page.getByRole("radio", { name: "Board" })).toBeHidden();
  await startIdeas(page);
  await expect(page.getByRole("radio", { name: "Board" })).toBeHidden();
});
