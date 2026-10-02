"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import type { Phase } from "@/generated/prisma/enums";
import { POLL_INTERVAL_MS, SAFETY_POLL_INTERVAL_MS } from "@/lib/config";
import { phasePath } from "@/lib/phase-path";
import { ROOM_EVENT, roomChannel } from "@/lib/realtime/shared";

type Props = {
  slug: string;
  /** Pusher's public settings; without them, polling only. */
  pusher: { key: string; cluster: string } | null;
  /** Follow step changes (false on the "Join" screen, which stays in place). */
  followPhase?: boolean;
};

/**
 * Keeps the page in sync with the other participants.
 * - Pusher configured: updates on every notification (+ slow fallback polling).
 * - Otherwise: polling every few seconds.
 * - Offline: no update until the device is back online, then one straight away. The step is
 *   always asked first, which also checks the server can be reached before refreshing.
 * On each update, the current step is checked first: if it has changed, we navigate
 * straight to its page (a single transition, no blank screen); otherwise we refresh
 * the Server Components of the current page.
 */
export function RoomLive({ slug, pusher, followPhase = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  // Strings rather than the object, which every refresh sends anew: the connection stays up.
  const pusherKey = pusher?.key;
  const pusherCluster = pusher?.cluster;

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const sync = async () => {
      // Without network, a refresh would fail and Next.js would fall back to a full page load,
      // leaving the browser's own offline page for good. Offline: wait for the "online" event.
      if (!navigator.onLine) return;
      let res: Response;
      try {
        res = await fetch(`/r/${slug}/phase`, { cache: "no-store" });
      } catch {
        // Seen as online but unreachable (a phone waking up before its network): next round.
        return;
      }
      if (followPhase && res.ok) {
        const { phase } = (await res.json()) as { phase: Phase };
        const target = phasePath(slug, phase);
        if (target !== pathnameRef.current) {
          router.push(target);
          return;
        }
      }
      router.refresh();
    };

    const schedule = () => {
      clearTimeout(debounce);
      debounce = setTimeout(sync, 150);
    };

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") schedule();
    }, pusherKey ? SAFETY_POLL_INTERVAL_MS : POLL_INTERVAL_MS);

    const onVisible = () => document.visibilityState === "visible" && schedule();
    document.addEventListener("visibilitychange", onVisible);
    // Back online: catch up at once on what the others did meanwhile.
    window.addEventListener("online", schedule);

    let cancelled = false;
    let client: { disconnect: () => void } | undefined;
    if (pusherKey && pusherCluster) {
      import("pusher-js").then(({ default: Pusher }) => {
        if (cancelled) return;
        const connection = new Pusher(pusherKey, { cluster: pusherCluster });
        connection.subscribe(roomChannel(slug)).bind(ROOM_EVENT, schedule);
        // Notifications sent while the connection was down are lost: catch up on reconnecting.
        let connectedBefore = false;
        connection.connection.bind("connected", () => {
          if (connectedBefore) schedule();
          connectedBefore = true;
        });
        client = connection;
      });
    }

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", schedule);
      client?.disconnect();
    };
  }, [router, slug, pusherKey, pusherCluster, followPhase]);

  return null;
}
