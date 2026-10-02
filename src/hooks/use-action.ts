"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions";
import { isNetworkError } from "@/lib/network-error";

/** Runs a server action in a transition and shows any error as a toast. */
export function useAction() {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult | void>, onSuccess?: () => void) =>
    startTransition(async () => {
      let result: ActionResult | void;
      try {
        result = await action();
      } catch (error) {
        // Anything else than a lost request goes through as before (a redirect also cancels the
        // request in flight, and must not show an error).
        if (navigator.onLine && !isNetworkError(error)) throw error;
        // The request never reached the server: an optimistic update reverts on its own. Online
        // but lost: the connection dropped or switched (Wi-Fi to mobile data).
        toast.error(t(navigator.onLine ? "network" : "offline"));
        return;
      }
      // Actions that redirect return nothing.
      if (result && !result.ok) toast.error(t(result.error));
      else onSuccess?.();
    });

  return [pending, run] as const;
}
