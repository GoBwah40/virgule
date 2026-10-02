import { expect, seeRecap, setUpSession, suggestPizzaAndSushi, test, vote } from "./helpers";

test("the printed recap keeps the session and who took part, without the screen-only controls", async ({
  page,
  openAsGuest,
}) => {
  const { guest } = await setUpSession(page, openAsGuest);
  await suggestPizzaAndSushi(page, guest);
  await vote(page, "Sushi", "For");
  await seeRecap(page);

  const invite = page.getByRole("button", { name: "Invite with a QR code" });
  const copyLink = page.getByRole("button", { name: "Copy the invite link" });
  const footer = page.getByRole("contentinfo");
  await expect(invite).toBeVisible();
  await expect(footer).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Friday night" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The recap" })).toBeVisible();
  await expect(page.getByRole("list", { name: /participants out of 6/ })).toBeVisible();
  await expect(page.getByLabel(/^Sam/)).toBeVisible();
  await expect(page.getByLabel(/^Lea/)).toBeVisible();
  // Hidden elements leave the accessibility tree: include them to check each one.
  const freeSeats = page.getByRole("button", { name: /^Free seat/, includeHidden: true });
  await expect(freeSeats).toHaveCount(4);
  for (const freeSeat of await freeSeats.all()) await expect(freeSeat).toBeHidden();
  await expect(invite).toBeHidden();
  await expect(copyLink).toBeHidden();
  await expect(footer).toBeHidden();
  await expect(page.getByRole("button", { name: /^Language/ })).toBeHidden();
  await expect(page.getByRole("button", { name: /^Theme/ })).toBeHidden();

  await page.emulateMedia({ media: "screen" });
  await expect(invite).toBeVisible();
  await expect(footer).toBeVisible();
});
