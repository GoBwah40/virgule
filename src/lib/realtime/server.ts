import "server-only";

import Pusher from "pusher";

import { ROOM_EVENT, roomChannel } from "@/lib/realtime/shared";

// Pusher is optional: without environment variables, clients fall back to polling.
let pusher: Pusher | null | undefined;

function getPusher(): Pusher | null {
  if (pusher !== undefined) return pusher;
  const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER } = process.env;
  pusher =
    PUSHER_APP_ID && NEXT_PUBLIC_PUSHER_KEY && PUSHER_SECRET && NEXT_PUBLIC_PUSHER_CLUSTER
      ? new Pusher({
          appId: PUSHER_APP_ID,
          key: NEXT_PUBLIC_PUSHER_KEY,
          secret: PUSHER_SECRET,
          cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
          useTLS: true,
        })
      : null;
  return pusher;
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
