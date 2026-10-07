"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useTransition } from "react";

import type { Phase } from "@/generated/prisma/enums";
import { CATCH_UP_GAP_MS, POLL_INTERVAL_MS, SAFETY_POLL_INTERVAL_MS } from "@/lib/config";
import { phasePath } from "@/lib/phase-path";
import { reconnectWatch, throttle } from "@/lib/realtime/resync";
import { ROOM_EVENT, roomChannel } from "@/lib/realtime/shared";
import { measureOffset, recordClockSample, renderOffset } from "@/lib/server-clock";

// An update that has not landed after this long no longer holds the next ones back.
const MAX_UPDATE_MS = 30_000;

type Props = {
  slug: string;
  /** Pusher's public settings; without them, polling only. */
  pusher: { key: string; cluster: string } | null;
  /** Follow step changes (false on the "Join" screen, which stays in place). */
  followPhase?: boolean;
  /** The server's clock when it rendered the page (ms): a first estimate for the countdowns. */
  serverNow: number;
};

/**
 * Keeps the page in sync with the other participants.
 * - Pusher configured: updates on every notification (+ slow fallback polling).
 * - Otherwise: polling every few seconds.
 * - Back or forward in the history: an update straight away.
 * - Tab shown again, Pusher connection back after being lost: an update straight away too, at
 *   most once every couple of seconds (a connection that keeps dropping must not loop).
 * - Offline: no update until the device is back online, then one straight away. The step is
 *   always asked first, which also checks the server can be reached before refreshing.
 * On each update, the current step is checked first: if it has changed, we navigate
 * straight to its page (a single transition, no blank screen); otherwise we refresh
 * the Server Components of the current page.
 * One update at a time: Next.js only shows the latest refresh, so on a connection slower than
 * the polling interval each one would replace the previous before it landed, and the page would
 * never change. A round falling during an update is played once it has landed.
 * The step request also measures the server's clock, which the countdowns follow.
 */
export function RoomLive({ slug, pusher, followPhase = true, serverNow }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  // Strings rather than the object, which every refresh sends anew: the connection stays up.
  const pusherKey = pusher?.key;
  const pusherCluster = pusher?.cluster;

  const [updating, startUpdate] = useTransition();
  const busySince = useRef<number | null>(null);
  const again = useRef(false);
  const scheduleRef = useRef(() => {});

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Before the first paint: the countdowns show the server's time left from the start.
  useLayoutEffect(() => {
    recordClockSample(renderOffset(serverNow, Date.now()));
  }, [serverNow]);

  // The update under way has landed: play the round that came meanwhile, if any.
  useEffect(() => {
    if (updating) return;
    busySince.current = null;
    if (again.current) {
      again.current = false;
      scheduleRef.current();
    }
  }, [updating]);

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const sync = async () => {
      // Without network, a refresh would fail and Next.js would fall back to a full page load,
      // leaving the browser's own offline page for good. Offline: wait for the "online" event.
      if (!navigator.onLine) return;
      if (busySince.current !== null && Date.now() - busySince.current < MAX_UPDATE_MS) {
        again.current = true;
        return;
      }
      busySince.current = Date.now();
      let res: Response;
      const sentAt = Date.now();
      try {
        res = await fetch(`/r/${slug}/phase`, { cache: "no-store" });
      } catch {
        // Seen as online but unreachable (a phone waking up before its network): next round.
        busySince.current = null;
        return;
      }
      // Overloaded server: a refresh would get the same error and Next.js would replace the page
      // with it, for good. A 404 still refreshes: it shows a session expired or left.
      if (res.status >= 500) {
        busySince.current = null;
        return;
      }
      const receivedAt = Date.now();
      let target: string | undefined;
      if (res.ok) {
        const { phase, now } = (await res.json()) as { phase: Phase; now?: number };
        if (typeof now === "number") recordClockSample(measureOffset(now, sentAt, receivedAt));
        const path = phasePath(slug, phase);
        if (followPhase && path !== pathnameRef.current) target = path;
      }
      // Followed until it lands (`updating`), which frees the next round. The step's page
      // replaces the stale one in the history: going back then leaves past steps behind instead
      // of landing on them again and again.
      startUpdate(() => (target ? router.replace(target) : router.refresh()));
    };

    const schedule = () => {
      clearTimeout(debounce);
      debounce = setTimeout(sync, 150);
    };
    scheduleRef.current = schedule;
    // Catching up on what may have been missed: at once, but not in a loop.
    const catchUp = throttle(schedule, CATCH_UP_GAP_MS);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") schedule();
    }, pusherKey ? SAFETY_POLL_INTERVAL_MS : POLL_INTERVAL_MS);

    // Shown again (a phone waking up, back from another tab): Pusher may have missed updates.
    const onVisible = () => document.visibilityState === "visible" && catchUp.call();
    document.addEventListener("visibilitychange", onVisible);
    // Back online: catch up at once on what the others did meanwhile.
    window.addEventListener("online", catchUp.call);
    // Back or forward in the history, or a page restored from the browser's cache: it shows what
    // it showed then, possibly a past step.
    window.addEventListener("popstate", schedule);
    const onPageShow = (event: PageTransitionEvent) => event.persisted && catchUp.call();
    window.addEventListener("pageshow", onPageShow);

    let cancelled = false;
    let client: { disconnect: () => void } | undefined;
    if (pusherKey && pusherCluster) {
      import("pusher-js").then(({ default: Pusher }) => {
        if (cancelled) return;
        const connection = new Pusher(pusherKey, { cluster: pusherCluster });
        connection.subscribe(roomChannel(slug)).bind(ROOM_EVENT, schedule);
        // Notifications sent while the connection was down are lost: catch up on reconnecting.
        const isComeback = reconnectWatch();
        connection.connection.bind("state_change", ({ current }: { current: string }) => {
          if (isComeback(current)) catchUp.call();
        });
        client = connection;
      });
    }

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      catchUp.cancel();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", catchUp.call);
      window.removeEventListener("popstate", schedule);
      window.removeEventListener("pageshow", onPageShow);
      client?.disconnect();
    };
  }, [router, slug, pusherKey, pusherCluster, followPhase]);

  return null;
}
