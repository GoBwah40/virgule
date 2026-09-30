"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import type { Phase } from "@/generated/prisma/enums";
import { POLL_INTERVAL_MS, SAFETY_POLL_INTERVAL_MS } from "@/lib/config";
import { phasePath } from "@/lib/phase-path";
import { ROOM_EVENT, roomChannel } from "@/lib/realtime/shared";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

type Props = {
  slug: string;
  /** Follow step changes (false on the "Join" screen, which stays in place). */
  followPhase?: boolean;
};

/**
 * Keeps the page in sync with the other participants.
 * - Pusher configured: updates on every notification (+ slow fallback polling).
 * - Otherwise: polling every few seconds.
 * On each update, the current step is checked first: if it has changed, we navigate
 * straight to its page (a single transition, no blank screen); otherwise we refresh
 * the Server Components of the current page.
 */
export function RoomLive({ slug, followPhase = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const sync = async () => {
      if (followPhase) {
        try {
          const res = await fetch(`/r/${slug}/phase`, { cache: "no-store" });
          if (res.ok) {
            const { phase } = (await res.json()) as { phase: Phase };
            const target = phasePath(slug, phase);
            if (target !== pathnameRef.current) {
              router.push(target);
              return;
            }
          }
        } catch {
          // Network unavailable: fall back to a plain refresh.
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
    }, PUSHER_KEY ? SAFETY_POLL_INTERVAL_MS : POLL_INTERVAL_MS);

    const onVisible = () => document.visibilityState === "visible" && schedule();
    document.addEventListener("visibilitychange", onVisible);

    let cancelled = false;
    let pusher: { disconnect: () => void } | undefined;
    if (PUSHER_KEY && PUSHER_CLUSTER) {
      import("pusher-js").then(({ default: Pusher }) => {
        if (cancelled) return;
        const client = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
        client.subscribe(roomChannel(slug)).bind(ROOM_EVENT, schedule);
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
  }, [router, slug, followPhase]);

  return null;
}
