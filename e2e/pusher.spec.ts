import type { Page, WebSocketRoute } from "@playwright/test";

import type { OpenAsGuest } from "./helpers";
import { addTopic, expect, setUpSession, startIdeas, test } from "./helpers";

// Runs on the second server (playwright.config.ts), where the browser gets a Pusher key. The test
// plays the Pusher server: the app's server sends nothing, so each test sends the notification
// Pusher would have relayed. Polling only runs every 30 s there: anything faster comes from Pusher.

// Well below the 30 s safety polling.
const AT_ONCE = 5_000;

/** A Pusher server for one page, speaking just enough of its protocol for pusher-js. */
class FakePusher {
  connections = 0;
  private open = new Set<WebSocketRoute>();
  private subscribed = new Map<WebSocketRoute, string>();
  private held: WebSocketRoute[] | undefined;

  static async on(page: Page) {
    const fake = new FakePusher();
    await page.routeWebSocket(/\.pusher\.com\//, (ws) => fake.accept(ws));
    return fake;
  }

  private accept(ws: WebSocketRoute) {
    this.connections++;
    this.open.add(ws);
    ws.onClose(() => this.forget(ws));
    ws.onMessage((message) => {
      const { event, data } = JSON.parse(String(message));
      if (event === "pusher:subscribe") {
        this.subscribed.set(ws, data.channel);
        ws.send(JSON.stringify({ event: "pusher_internal:subscription_succeeded", channel: data.channel, data: "{}" }));
      }
      if (event === "pusher:ping") ws.send(JSON.stringify({ event: "pusher:pong", data: "{}" }));
    });
    if (this.held) this.held.push(ws);
    else this.establish(ws);
  }

  private establish(ws: WebSocketRoute) {
    const data = JSON.stringify({ socket_id: `${this.connections}.1`, activity_timeout: 120 });
    ws.send(JSON.stringify({ event: "pusher:connection_established", data }));
  }

  private forget(ws: WebSocketRoute) {
    this.open.delete(ws);
    this.subscribed.delete(ws);
  }

  /** What the app's server triggers after a change; lost for a page not connected right now. */
  notify() {
    for (const [ws, channel] of this.subscribed) {
      ws.send(JSON.stringify({ event: "room-updated", channel, data: "{}" }));
    }
  }

  /**
   * Cuts the connection; pusher-js reconnects, but the new connection stays pending (not yet
   * established, nothing received) until `reconnect()`.
   */
  async drop() {
    this.held = [];
    for (const ws of this.open) {
      this.forget(ws);
      // 4200: "reconnect immediately" in Pusher's protocol, so the test does not wait.
      await ws.close({ code: 4200, reason: "Connection lost" });
    }
    await expect.poll(() => this.held?.length, { message: "pusher-js reconnects" }).toBe(1);
  }

  reconnect() {
    const held = this.held ?? [];
    this.held = undefined;
    held.forEach((ws) => this.establish(ws));
  }
}

/** Sam hosts "Friday night" with Lea; both pages talk to their own fake Pusher. */
async function withPusher(page: Page, openAsGuest: OpenAsGuest) {
  await FakePusher.on(page);
  const { guest } = await setUpSession(page, openAsGuest);
  const pusher = await FakePusher.on(guest);
  // Reloaded so the guest's connection goes through the fake server from the start.
  await guest.reload();
  await expect.poll(() => pusher.connections).toBe(1);
  return { guest, pusher };
}

const topic = (page: Page, title: string) => page.getByRole("listitem").filter({ hasText: title });

test("a Pusher notification updates the page at once", async ({ page, openAsGuest }) => {
  const { guest, pusher } = await withPusher(page, openAsGuest);
  await addTopic(page, "Drinks");
  // No notification yet: with Pusher on, the page does not poll every few seconds.
  await guest.waitForTimeout(3000);
  await expect(topic(guest, "Drinks")).toHaveCount(0);

  pusher.notify();
  await expect(topic(guest, "Drinks")).toBeVisible({ timeout: AT_ONCE });
});

test("after a dropped connection, the page catches up on what it missed", async ({ page, openAsGuest }) => {
  const { guest, pusher } = await withPusher(page, openAsGuest);
  await pusher.drop();
  await addTopic(page, "Drinks");
  // Sent while Lea's connection is down: lost, as with the real Pusher.
  pusher.notify();

  pusher.reconnect();
  await expect(topic(guest, "Drinks")).toBeVisible({ timeout: AT_ONCE });
});

test("a step change missed while disconnected is followed on reconnecting", async ({ page, openAsGuest }) => {
  const { guest, pusher } = await withPusher(page, openAsGuest);
  await pusher.drop();
  await startIdeas(page);
  pusher.notify();

  pusher.reconnect();
  await expect(guest).toHaveURL(/\/ideas$/, { timeout: AT_ONCE });
});

test("page updates keep the same Pusher connection", async ({ page, openAsGuest }) => {
  const { guest, pusher } = await withPusher(page, openAsGuest);
  for (const title of ["Drinks", "Music", "Games"]) {
    await addTopic(page, title);
    pusher.notify();
    await expect(topic(guest, title)).toBeVisible({ timeout: AT_ONCE });
  }
  // Each update refreshes the page: none of them may open a new connection.
  expect(pusher.connections).toBe(1);
});
