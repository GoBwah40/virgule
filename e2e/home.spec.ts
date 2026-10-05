import { readFileSync } from "node:fs";
import path from "node:path";

import { choose, expect, test } from "./helpers";

// The home page's "What's new": the release notes of every version, in the reader's language,
// flagged until opened once.

const { version } = JSON.parse(readFileSync(path.join(__dirname, "../package.json"), "utf8")) as { version: string };

/** The first entry of the current version in release-notes/<lang>/, whichever category holds it. */
const latestEntry = (lang: "en" | "fr") => {
  for (const category of ["added", "improved", "fixed"]) {
    const notes = readFileSync(path.join(__dirname, `../release-notes/${lang}/${category}.md`), "utf8");
    const section = notes.split(`## ${version} `)[1]?.split("\n## ")[0];
    const entry = section?.split("\n").find((line) => line.startsWith("- "));
    if (entry) return entry.slice(2);
  }
  throw new Error(`No release note for ${version}`);
};

test("the release notes show the current version, flagged until opened once", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /What's new/ });
  // A new version for a first visit.
  await expect(trigger).toHaveAccessibleName(/New version/);

  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "What's new" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(version, { exact: false }).first()).toBeVisible();
  await expect(sheet.getByText("Latest")).toBeVisible();
  await expect(sheet.getByText(latestEntry("en"))).toBeVisible();
  await sheet.getByRole("button", { name: "Close" }).first().click();
  await expect(sheet).toHaveCount(0);

  // Seen: no longer flagged, after a reload too.
  await page.reload();
  await expect(page.getByRole("button", { name: /What's new/ })).not.toHaveAccessibleName(/New version/);
});

test("the release notes follow the language", async ({ page }) => {
  await page.goto("/");
  await choose(page, "Language", "Français");
  await page.getByRole("button", { name: /Nouveautés/ }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText(latestEntry("fr"))).toBeVisible();
  await expect(sheet.getByText(latestEntry("en"))).toHaveCount(0);
});
