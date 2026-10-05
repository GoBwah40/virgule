"use client";

import { useEffect, useSyncExternalStore } from "react";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

type Props = {
  /** App name, for the logo. */
  appName: string;
  /** Session name: the page heading, shown next to the logo. */
  title: string;
  /** False when the screen already shows the name in large (the heading stays for screen readers). */
  showTitle?: boolean;
  steps: { id: string; label: string }[];
  /** Index of the current step; `steps.length` once they are all done. */
  current: number;
  /** Name of the step list read by screen readers (e.g. "Session steps"). */
  stepsLabel: string;
  /** Shown until the window goes full screen, where the browser allows it. */
  fullscreenHint: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

const subscribeFullscreen = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
};
const noSubscription = () => () => {};

/** Keeps the screen on while the page is shown, where the browser allows it; a refusal is ignored. */
function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) next.release().catch(() => {});
        else lock = next;
      } catch {
        // Battery saver, permissions policy, unsupported: the screen may sleep, nothing else changes.
      }
    };
    acquire();
    // The browser releases the lock when the page is hidden: take it again on coming back.
    const onVisible = () => acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);
}

/** Full screen needs a gesture: the first click or key press anywhere asks for it. */
function useFullscreenOnGesture() {
  useEffect(() => {
    if (!document.fullscreenEnabled) return;
    const enter = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") return;
      if (document.fullscreenElement) return;
      document.documentElement.requestFullscreen().catch(() => {});
    };
    window.addEventListener("pointerdown", enter);
    window.addEventListener("keydown", enter);
    return () => {
      window.removeEventListener("pointerdown", enter);
      window.removeEventListener("keydown", enter);
    };
  }, []);
}

/**
 * Room screen (TV, projector): the whole window, always dark, text sized to be read from across
 * the room, and no controls. Stays awake and goes full screen where the browser allows it.
 */
export function PresentationScreen({
  appName,
  title,
  showTitle = true,
  steps,
  current,
  stepsLabel,
  fullscreenHint,
  footer,
  children,
}: Props) {
  useWakeLock();
  useFullscreenOnGesture();
  const fullscreen = useSyncExternalStore(subscribeFullscreen, () => !!document.fullscreenElement, () => false);
  // Server and first render: no hint, it only appears once the browser says it can go full screen.
  const canGoFullscreen = useSyncExternalStore(noSubscription, () => document.fullscreenEnabled, () => false);
  const hint = canGoFullscreen && !fullscreen;

  return (
    <div
      data-presentation
      data-theme="dark"
      className="flex min-h-dvh flex-col gap-[3vh] bg-background px-[max(1rem,4vw)] py-[max(1rem,3.5vh)] text-foreground lg:h-dvh lg:overflow-hidden"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-[2vw] gap-y-3">
        <div className="flex min-w-0 items-baseline gap-[1.2vw]">
          <Logo label={appName} className="stage-lg" />
          <h1 className={cn("min-w-0 truncate font-heading stage-md font-bold text-muted-foreground", !showTitle && "sr-only")}>
            {title}
          </h1>
        </div>
        <ol aria-label={stepsLabel} className="flex flex-wrap gap-[0.6vw]">
          {steps.map((step, i) => (
            <li
              key={step.id}
              aria-current={i === current ? "step" : undefined}
              className={cn(
                "rounded-full border-[1.5px] px-[1.1em] py-[0.45em] stage-xs font-semibold",
                i === current ? "border-brand bg-brand text-background" : "border-border text-muted-foreground",
              )}
            >
              {step.label}
            </li>
          ))}
        </ol>
      </header>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>

      {(footer || hint) && (
        <footer className="space-y-[1.5vh]">
          {footer && <div className="flex flex-wrap items-end justify-between gap-x-[2vw] gap-y-3 *:min-w-0">{footer}</div>}
          {hint && <p className="text-right stage-xs text-muted-foreground">{fullscreenHint}</p>}
        </footer>
      )}
    </div>
  );
}
