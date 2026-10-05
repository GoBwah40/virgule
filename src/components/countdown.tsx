"use client";

import { Hourglass, TimerOff } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type Props = {
  /** End of the countdown (ISO 8601). */
  endsAt: string;
  labels: { running: string; expired: string };
  /** `lg`: the room screen, read from across the room. */
  size?: "md" | "lg";
  className?: string;
};

// Shared clock: a single interval, however many countdowns there are.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
// Rounded to the second: the snapshot only changes once per second.
const nowSeconds = () => Math.floor(Date.now() / 1000);

/** "4:05"; beyond an hour, "1:02:05". */
export function formatRemaining(seconds: number) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/**
 * Discreet countdown: neutral, then mango during the last minute, then the
 * expired label. Screen readers only read it once a minute.
 */
export function Countdown({ endsAt, labels, size = "md", className }: Props) {
  const now = useSyncExternalStore(subscribe, nowSeconds, nowSeconds);
  const remaining = Math.ceil(new Date(endsAt).getTime() / 1000) - now;
  const expired = remaining <= 0;
  const lastMinute = !expired && remaining <= 60;
  const Icon = expired ? TimerOff : Hourglass;

  return (
    <div
      role="timer"
      aria-label={labels.running}
      className={cn(
        "inline-flex items-center rounded-full border-[1.5px] font-semibold transition-colors duration-300",
        size === "lg" ? "gap-[0.5em] px-[0.9em] py-[0.35em] stage-md" : "gap-2 px-3 py-1.5 text-sm",
        expired
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : lastMinute
            ? "border-highlight bg-highlight-soft text-highlight-foreground"
            : "border-border bg-card",
        className,
      )}
    >
      <Icon className={cn(size === "lg" ? "size-[1em]" : "size-4", !expired && "motion-safe:animate-pulse")} aria-hidden />
      {expired ? (
        <span aria-live="polite">{labels.expired}</span>
      ) : (
        <>
          <span className="sr-only sm:not-sr-only sm:text-muted-foreground">{labels.running}</span>
          {/* Server and browser clocks differ slightly: no hydration warning. */}
          <span className="font-mono tabular-nums" suppressHydrationWarning>
            {formatRemaining(remaining)}
          </span>
        </>
      )}
    </div>
  );
}
