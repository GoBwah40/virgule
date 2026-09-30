"use client";

import { Hourglass, TimerOff } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type Props = {
  /** Fin du compte à rebours (ISO 8601). */
  endsAt: string;
  labels: { running: string; expired: string };
  className?: string;
};

// Horloge partagée : un seul intervalle, quel que soit le nombre de comptes à rebours.
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
// Arrondi à la seconde : l'instantané ne change qu'une fois par seconde.
const nowSeconds = () => Math.floor(Date.now() / 1000);

/** « 4:05 » ; au-delà d'une heure, « 1:02:05 ». */
export function formatRemaining(seconds: number) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/**
 * Compte à rebours discret : neutre, puis mangue pendant la dernière minute, puis
 * « Temps écoulé ». Lu une fois par minute seulement par les lecteurs d'écran.
 */
export function Countdown({ endsAt, labels, className }: Props) {
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
        "inline-flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-sm font-semibold transition-colors duration-300",
        expired
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : lastMinute
            ? "border-highlight bg-highlight-soft text-highlight-foreground"
            : "border-border bg-card",
        className,
      )}
    >
      <Icon className={cn("size-4", !expired && "motion-safe:animate-pulse")} aria-hidden />
      {expired ? (
        <span aria-live="polite">{labels.expired}</span>
      ) : (
        <>
          <span className="sr-only sm:not-sr-only sm:text-muted-foreground">{labels.running}</span>
          {/* Heure du serveur et du navigateur légèrement différentes : pas d'alerte d'hydratation. */}
          <span className="font-mono tabular-nums" suppressHydrationWarning>
            {formatRemaining(remaining)}
          </span>
        </>
      )}
    </div>
  );
}
