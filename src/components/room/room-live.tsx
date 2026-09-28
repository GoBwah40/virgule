"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { POLL_INTERVAL_MS, SAFETY_POLL_INTERVAL_MS } from "@/lib/config";
import { ROOM_EVENT, roomChannel } from "@/lib/realtime/shared";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

/**
 * Garde la page synchronisée avec les autres participants.
 * - Pusher configuré : rafraîchit à chaque notification (+ polling lent de secours).
 * - Sinon : polling toutes les quelques secondes.
 * Le rafraîchissement re-rend les Server Components ; un changement de phase
 * déclenche donc la redirection vers la bonne page pour tout le monde.
 */
export function RoomLive({ slug }: { slug: string }) {
  const router = useRouter();

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => router.refresh(), 150);
    };

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, PUSHER_KEY ? SAFETY_POLL_INTERVAL_MS : POLL_INTERVAL_MS);

    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);

    let cancelled = false;
    let pusher: { disconnect: () => void } | undefined;
    if (PUSHER_KEY && PUSHER_CLUSTER) {
      import("pusher-js").then(({ default: Pusher }) => {
        if (cancelled) return;
        const client = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
        client.subscribe(roomChannel(slug)).bind(ROOM_EVENT, refresh);
        pusher = client;
      });
    }

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      pusher?.disconnect();
    };
  }, [router, slug]);

  return null;
}
