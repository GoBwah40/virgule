"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions";

/** Exécute une server action dans une transition et affiche l'erreur éventuelle en toast. */
export function useAction() {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult | void>, onSuccess?: () => void) =>
    startTransition(async () => {
      const result = await action();
      // Les actions qui redirigent ne renvoient rien.
      if (result && !result.ok) toast.error(t(result.error));
      else onSuccess?.();
    });

  return [pending, run] as const;
}
