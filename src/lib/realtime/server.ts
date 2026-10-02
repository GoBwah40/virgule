import "server-only";

import Pusher from "pusher";

import { ROOM_EVENT, roomChannel } from "@/lib/realtime/shared";

// Pusher is optional: without environment variables, clients fall back to polling.
let pusher: Pusher | null | undefined;

// Next.js replaces `NEXT_PUBLIC_…` variables with their build-time value, even destructured or
// read by a computed name; Reflect.get escapes it. Pusher's settings are then read when the
// server runs, the same on both ends: a restart picks them up, no rebuild needed.
const read = (name: string): string | undefined => Reflect.get(process.env, name);

function getPusher(): Pusher | null {
  if (pusher !== undefined) return pusher;
  const config = pusherClientConfig();
  const appId = read("PUSHER_APP_ID");
  const secret = read("PUSHER_SECRET");
  pusher = config && appId && secret ? new Pusher({ ...config, appId, secret, useTLS: true }) : null;
  return pusher;
}

/** What the browser needs to listen (public values), read when the page is served. */
export function pusherClientConfig(): { key: string; cluster: string } | null {
  const key = read("NEXT_PUBLIC_PUSHER_KEY");
  const cluster = read("NEXT_PUBLIC_PUSHER_CLUSTER");
  return key && cluster ? { key, cluster } : null;
}

/**
 * Tells the other participants that the room state has changed.
 * The message carries no data: clients reload the state from the server,
 * which guarantees anonymity (nothing sensitive goes through Pusher).
 */
export async function notifyRoom(slug: string) {
  const client = getPusher();
  if (!client) return;
  try {
    await client.trigger(roomChannel(slug), ROOM_EVENT, {});
  } catch (error) {
    // A failed notification is not blocking: the fallback polling takes over.
    console.error("[realtime] notification failed", error);
  }
}
