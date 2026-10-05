import type { Page } from "@playwright/test";

import type { OpenAsGuest } from "./helpers";
import {
  expect,
  idea,
  join,
  LIVE_TIMEOUT,
  participantSecrets,
  setUpSession,
  startIdeas,
  suggestIdea,
  test,
} from "./helpers";

// Several people doing the same thing at the same instant: each check of the app passes before
// the other one has written. The database must still end up right, and each person must be told.

/** Fills the join form without sending it, once the page reacts. */
async function readyToJoin(page: Page, pseudo: string) {
  const submit = page.getByRole("button", { name: "Join the session" });
  await expect(async () => {
    await page.getByLabel("What's your first name?").fill(pseudo);
    await expect(submit).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: LIVE_TIMEOUT });
  return submit;
}

/** Sam's session with Lea and three more: one seat left. */
async function oneSeatLeft(page: Page, openAsGuest: OpenAsGuest) {
  const { link } = await setUpSession(page, openAsGuest);
  for (const pseudo of ["Ana", "Bob", "Cy"]) await join(await openAsGuest(link), pseudo);
  return link;
}

const isIn = (page: Page) => page.getByRole("button", { name: "Leave the session" });

test("two people taking the last seat at once: one gets it, the other is told", async ({ page, openAsGuest }) => {
  const link = await oneSeatLeft(page, openAsGuest);
  const [noe, zoe] = [await openAsGuest(link), await openAsGuest(link)];
  const buttons = [await readyToJoin(noe, "Noe"), await readyToJoin(zoe, "Zoe")];
  await Promise.all(buttons.map((button) => button.click()));

  await expect.poll(async () => (await participantSecrets(link)).length).toBe(6);
  const joined = [];
  for (const p of [noe, zoe]) {
    await expect(isIn(p).or(p.getByText("All the seats are taken."))).toBeVisible({ timeout: LIVE_TIMEOUT });
    joined.push(await isIn(p).isVisible());
  }
  expect(joined.filter(Boolean)).toHaveLength(1);
});

test("two people picking the same first name at once: one gets it, the other is told", async ({
  page,
  openAsGuest,
}) => {
  const { link } = await setUpSession(page, openAsGuest);
  const [first, second] = [await openAsGuest(link), await openAsGuest(link)];
  // Same name, different case: the app treats them as one.
  const buttons = [await readyToJoin(first, "Noe"), await readyToJoin(second, "noe")];
  await Promise.all(buttons.map((button) => button.click()));

  for (const p of [first, second]) {
    await expect(
      isIn(p).or(p.getByText("This first name is already taken in the group. Add an initial, for example “Lea M.”.")),
    ).toBeVisible({ timeout: LIVE_TIMEOUT });
  }
  const names = (await participantSecrets(link)).map((p) => p.pseudo.toLowerCase());
  expect(names.filter((name) => name === "noe")).toHaveLength(1);
});

test("the same idea suggested by two people at once is kept once", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: LIVE_TIMEOUT });

  const ready = async (p: Page) => {
    const add = p.getByRole("button", { name: "Add", exact: true });
    await expect(async () => {
      await p.getByLabel("Your idea…").fill("Pizza");
      await expect(add).toBeEnabled({ timeout: 1000 });
    }).toPass({ timeout: LIVE_TIMEOUT });
    return add;
  };
  const buttons = [await ready(page), await ready(guest)];
  await Promise.all(buttons.map((button) => button.click()));

  await expect(idea(page, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(idea(guest, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });
  await page.reload();
  await expect(idea(page, "Pizza")).toHaveCount(1);
});

test("the host closing the vote from two tabs at once moves everyone once", async ({ page, openAsGuest }) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  const other = await page.context().newPage();
  await other.goto(page.url());

  const openConfirm = async (p: Page) => {
    await p.getByRole("button", { name: "See the recap" }).click();
    return p.getByRole("alertdialog").getByRole("button", { name: "See the recap" });
  };
  const confirms = [await openConfirm(page), await openConfirm(other)];
  await Promise.all(confirms.map((confirm) => confirm.click()));

  for (const p of [page, other, guest]) {
    await expect(p).toHaveURL(/\/recap$/, { timeout: LIVE_TIMEOUT });
    await expect(p.getByRole("heading", { name: "The recap" })).toBeVisible();
  }
  // A single round: the second request found the vote already closed.
  await expect(page.getByRole("tab")).toHaveCount(0);
});

test("votes from several people at once are all counted", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  const others = [];
  for (const pseudo of ["Ana", "Bob", "Cy"]) {
    const p = await openAsGuest(link);
    await join(p, pseudo);
    others.push(p);
  }
  await startIdeas(page);
  await suggestIdea(page, "Pizza");
  for (const p of others) await expect(idea(p, "Pizza")).toBeVisible({ timeout: LIVE_TIMEOUT });

  await Promise.all(others.map((p) => idea(p, "Pizza").getByRole("button", { name: "For" }).click()));
  for (const p of others) await expect(idea(p, "Pizza").getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");

  // Sam sees every vote counted in the progress.
  await expect(page.getByRole("progressbar", { name: "Participants who voted" })).toContainText("3 people out of", {
    timeout: LIVE_TIMEOUT,
  });
});
