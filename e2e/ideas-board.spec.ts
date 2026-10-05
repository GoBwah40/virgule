import { expect, idea, LIVE_TIMEOUT, pick, setUpSession, startIdeas, suggestIdea, test, vote } from "./helpers";

// The ideas page as a board: one column per topic, like the room screen, with everyone's own
// controls. Each person picks, from tablets up, and finds the page as they left it.

test.describe("on a computer", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test("the ideas page switches to a board, keeps working, and stays a board", async ({ page, openAsGuest }) => {
    const { guest } = await setUpSession(page, openAsGuest);
    await startIdeas(page);
    await suggestIdea(page, "Pizza");
    await suggestIdea(page, "Sushi");

    // A list by default: oldest idea first, input at the bottom.
    await expect(page.getByRole("radio", { name: "List" })).toBeChecked();
    await expect(page.getByRole("listitem").filter({ hasText: /Pizza|Sushi/ })).toHaveText([/Pizza/, /Sushi/]);

    await pick(page, "Board");
    // Latest idea first, under the input: what was just suggested shows at the top.
    await expect(page.getByRole("listitem").filter({ hasText: /Pizza|Sushi/ })).toHaveText([/Sushi/, /Pizza/]);
    await vote(page, "Pizza", "For");
    await suggestIdea(page, "Tacos");
    await expect(page.getByRole("listitem").filter({ hasText: /Pizza|Sushi|Tacos/ }).first()).toContainText("Tacos");

    await page.reload();
    await expect(page.getByRole("radio", { name: "Board" })).toBeChecked();
    await expect(idea(page, "Pizza").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");

    // A choice of this browser only: Lea still has the list.
    await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });
    await expect(guest.getByRole("radio", { name: "List" })).toBeAttached();
  });
});

test("on a phone, there is no board to pick: one column only", async ({ page, openAsGuest }) => {
  await setUpSession(page, openAsGuest);
  await pick(page, "5 min");
  await startIdeas(page);
  await expect(page.getByRole("radio", { name: "Board" })).toBeHidden();
});
