"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions";

/** Runs a server action in a transition and shows any error as a toast. */
export function useAction() {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult | void>, onSuccess?: () => void) =>
    startTransition(async () => {
      const result = await action();
      // Actions that redirect return nothing.
      if (result && !result.ok) toast.error(t(result.error));
      else onSuccess?.();
    });

  return [pending, run] as const;
}
