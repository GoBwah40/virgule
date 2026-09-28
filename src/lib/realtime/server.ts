import "server-only";

import Pusher from "pusher";

import { ROOM_EVENT, roomChannel } from "@/lib/realtime/shared";

// Pusher est optionnel : sans variables d'environnement, les clients passent en polling.
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
 * Signale aux autres participants que l'état de la room a changé.
 * Le message ne contient aucune donnée : les clients re-chargent l'état côté serveur,
 * ce qui garantit l'anonymat (rien de sensible ne transite par Pusher).
 */
export async function notifyRoom(slug: string) {
  const client = getPusher();
  if (!client) return;
  try {
    await client.trigger(roomChannel(slug), ROOM_EVENT, {});
  } catch (error) {
    // Une notification ratée n'est pas bloquante : le polling de secours prend le relais.
    console.error("[realtime] échec de notification", error);
  }
}
