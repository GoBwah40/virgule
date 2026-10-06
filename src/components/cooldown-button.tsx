"use client";

import type { LucideIcon } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type Props = Omit<React.ComponentProps<typeof Button>, "children" | "disabled"> & {
  label: string;
  /** Shown instead of `label`, button disabled, until `availableAt`. */
  doneLabel: string;
  /** When the action can be done again (ISO 8601); null or past: right away. */
  availableAt: string | null;
  /** The action is running. */
  pending?: boolean;
  icon?: LucideIcon;
};

const isWaiting = (availableAt: string | null) => availableAt !== null && new Date(availableAt).getTime() > Date.now();

/**
 * Button for an action the server only accepts once in a while: after it, it says it is done
 * and stays disabled until it can be done again, then comes back by itself.
 */
export function CooldownButton({ label, doneLabel, availableAt, pending, icon: Icon, variant = "outline", ...props }: Props) {
  // Wakes up once, when the wait is over.
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!isWaiting(availableAt)) return () => {};
      const timer = setTimeout(onChange, new Date(availableAt!).getTime() - Date.now() + 50);
      return () => clearTimeout(timer);
    },
    [availableAt],
  );
  const waiting = useSyncExternalStore(
    subscribe,
    () => isWaiting(availableAt),
    () => isWaiting(availableAt),
  );

  return (
    <Button variant={variant} disabled={pending || waiting} {...props}>
      {Icon && <Icon data-icon="inline-start" />}
      {/* Read out when it changes: the feedback that the action went through. */}
      <span aria-live="polite">{waiting ? doneLabel : label}</span>
    </Button>
  );
}
