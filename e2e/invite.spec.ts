import type { Page } from "@playwright/test";
import jsQR from "jsqr";

import { choose, expect, join, LIVE_TIMEOUT, setUpSession, test } from "./helpers";

/** What the invite dialog's QR code encodes: rasterised in the page, decoded here like a phone would. */
async function scanQrCode(page: Page) {
  const svg = page.getByRole("dialog").getByRole("img", { name: "QR code for the invite link" });
  await expect(svg).toBeVisible();
  // The guests opened after the host take the front: Chromium can hold image loading in a page
  // left behind, so the host's page comes back to the front before drawing.
  await page.bringToFront();
  const image = await svg.evaluate(async (element) => {
    const size = 400;
    const source = new Image();
    source.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(element))}`;
    await source.decode();
    const canvas = Object.assign(document.createElement("canvas"), { width: size, height: size });
    const context = canvas.getContext("2d")!;
    // Quiet zone around the code, as on paper.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, size, size);
    context.drawImage(source, 40, 40, size - 80, size - 80);
    return { size, data: Array.from(context.getImageData(0, 0, size, size).data) };
  });
  return jsQR(Uint8ClampedArray.from(image.data), image.size, image.size)?.data;
}

const openInvite = (page: Page) => page.getByRole("button", { name: "Invite with a QR code" }).click();

test("the QR code opens the session's join screen", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  await openInvite(page);
  await expect(page.getByRole("dialog", { name: "Invite the group" })).toBeVisible();

  const scanned = await scanQrCode(page);
  expect(scanned).toBe(link);

  // Whoever scans it lands on the join form of this session.
  const newcomer = await openAsGuest(scanned!);
  await expect(newcomer.getByRole("heading", { level: 1, name: "Sam invites you to “Friday night”" })).toBeVisible();
  await join(newcomer, "Noe");
  // The modal dialog hides the rest of the page from assistive tech: close it to read the seats.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("list", { name: "3 participants out of 6" })).toBeVisible({ timeout: LIVE_TIMEOUT });
});

test("the QR code stays dark on white in dark mode, so it still scans", async ({ page, openAsGuest }) => {
  const { link } = await setUpSession(page, openAsGuest);
  await choose(page, "Theme", "Dark");
  await openInvite(page);

  const frame = page.getByRole("dialog").getByRole("img", { name: "QR code for the invite link" }).locator("..");
  expect(await frame.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");
  expect(await scanQrCode(page)).toBe(link);
});

test("the invite dialog counts the seats left", async ({ page, openAsGuest }) => {
  await setUpSession(page, openAsGuest);
  await openInvite(page);
  await expect(page.getByRole("dialog").getByText("4 seats left. Scan the QR code or send the link.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test.describe("on a phone that can share", () => {
  // Chromium has no share sheet here: stand in for it and record what it is given.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const shared: ShareData[] = [];
      Object.assign(window, { shared });
      navigator.share = async (data?: ShareData) => {
        shared.push(data ?? {});
        if (document.documentElement.dataset.cancelShare !== undefined) {
          throw new DOMException("Share canceled", "AbortError");
        }
      };
    });
  });

  const sharedData = (page: Page) => page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared);

  test("Share hands the invite link and a message to the share sheet", async ({ page, openAsGuest }) => {
    const { link } = await setUpSession(page, openAsGuest);
    await openInvite(page);
    await page.getByRole("dialog").getByRole("button", { name: "Share" }).click();

    await expect.poll(() => sharedData(page)).toEqual([
      { title: "Friday night", text: "Join the session “Friday night” on Virgule", url: link },
    ]);
  });

  test("the message follows the language, and cancelling says nothing", async ({ page, openAsGuest }) => {
    const { link } = await setUpSession(page, openAsGuest);
    await choose(page, "Language", "Français");
    await page.evaluate(() => document.documentElement.setAttribute("data-cancel-share", ""));
    await page.getByRole("button", { name: "Inviter avec un QR code" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Partager" }).click();

    await expect.poll(() => sharedData(page)).toEqual([
      { title: "Friday night", text: "Rejoins la séance « Friday night » sur Virgule", url: link },
    ]);
    // Cancelled by the person: no error shown, the dialog stays open.
    await expect(page.getByRole("region", { name: /Notifications/ }).getByRole("listitem")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test("without a share sheet, only the link copy is offered", async ({ page, openAsGuest }) => {
  await setUpSession(page, openAsGuest);
  await openInvite(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Copy the invite link" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Share" })).toHaveCount(0);
});
