import type { Page } from "@playwright/test";

import { choose, createRoom, expect, join, LIVE_TIMEOUT, test } from "./helpers";

const LIGHT_BACKGROUND = "rgb(255, 247, 240)"; // --background, #fff7f0
const DARK_BACKGROUND = "rgb(28, 18, 22)"; // --background in dark, #1c1216

const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const colorScheme = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
const html = (page: Page) => page.locator("html");

test.describe("theme", () => {
  test("follows the device until someone picks one", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Theme, Same as device" })).toBeVisible();
    await expect(html(page)).not.toHaveAttribute("data-theme");
    expect(await background(page)).toBe(DARK_BACKGROUND);
    // Native fields (date picker…) follow too.
    expect(await colorScheme(page)).toBe("dark");

    await page.emulateMedia({ colorScheme: "light" });
    expect(await background(page)).toBe(LIGHT_BACKGROUND);
    expect(await colorScheme(page)).toBe("light");
  });

  test("dark mode chosen on a light device applies at once and is remembered", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    await choose(page, "Theme", "Dark");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => background(page)).toBe(DARK_BACKGROUND);
    await expect(page.getByRole("button", { name: "Theme, Dark" })).toBeVisible();

    // Rendered dark by the server from the first paint, on every page.
    const link = await createRoom(page, { name: "Night owls", host: "Sam" });
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    const response = await page.request.get(link);
    expect(await response.text()).toContain('data-theme="dark"');
    await page.reload();
    expect(await background(page)).toBe(DARK_BACKGROUND);
  });

  test("light mode wins over a dark device, and the device setting can come back", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    await choose(page, "Theme", "Light");
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await expect.poll(() => background(page)).toBe(LIGHT_BACKGROUND);

    await choose(page, "Theme", "Same as device");
    await expect(html(page)).not.toHaveAttribute("data-theme");
    await expect.poll(() => background(page)).toBe(DARK_BACKGROUND);
    await page.reload();
    await expect(html(page)).not.toHaveAttribute("data-theme");
    expect((await page.context().cookies()).some((cookie) => cookie.name === "virgule_theme")).toBe(false);
  });
});

test.describe("language", () => {
  test("follows the browser language, English otherwise", async ({ openAsGuest }) => {
    const french = await openAsGuest("/", { locale: "fr-FR" });
    await expect(french.getByRole("button", { name: "Créer la séance" })).toBeVisible();
    await expect(html(french)).toHaveAttribute("lang", "fr");
    await expect(french.getByRole("button", { name: "Langue, Français" })).toBeVisible();

    // Unsupported language: English.
    const german = await openAsGuest("/", { locale: "de-DE" });
    await expect(german.getByRole("button", { name: "Create the session" })).toBeVisible();
    await expect(html(german)).toHaveAttribute("lang", "en");
  });

  test("the language picked in the footer wins over the browser's and is remembered", async ({ page }) => {
    await page.goto("/");
    await choose(page, "Language", "Français");

    await expect(page.getByRole("button", { name: "Créer la séance" })).toBeVisible();
    await expect(html(page)).toHaveAttribute("lang", "fr");
    await page.reload();
    await expect(page.getByLabel("Nom de la séance")).toBeVisible();

    await choose(page, "Langue", "English");
    await expect(page.getByRole("button", { name: "Create the session" })).toBeVisible();
    await expect(html(page)).toHaveAttribute("lang", "en");
  });

  test("everyone in a session reads it in their own language", async ({ page, openAsGuest }) => {
    const link = await createRoom(page, { name: "Friday night", host: "Sam" });
    const guest = await openAsGuest(link);
    await join(guest, "Lea");

    await choose(page, "Language", "Français");
    await expect(page.getByRole("heading", { name: "Sur quoi faut-il trancher ?" })).toBeVisible();
    await expect(page.getByText("Ajoute les sujets à décider ensemble, puis lance les idées.")).toBeVisible();
    // The session name is not translated.
    await expect(page.getByRole("heading", { level: 1, name: "Friday night" })).toBeVisible();

    // Lea's page keeps refreshing, in English.
    await page.getByLabel("Sujet", { exact: true }).fill("Dinner");
    await page.getByRole("button", { name: "Ajouter le sujet" }).click();
    await expect(guest.getByText("Dinner")).toBeVisible({ timeout: LIVE_TIMEOUT });
    await expect(guest.getByRole("heading", { name: "What do we need to decide?" })).toBeVisible();
  });
});
