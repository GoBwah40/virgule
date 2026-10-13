"use client";

import { CircleHelp } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TourStep = {
  /** Value of the `data-tour` attribute of the element to point at. */
  target: string;
  title: string;
  body: string;
};

type Labels = {
  offerTitle: string;
  offerBody: string;
  start: string;
  dismiss: string;
  next: string;
  back: string;
  done: string;
  /** Text button that leaves the tour at any step. */
  quit: string;
  /** "Step 2 of 5". */
  progress: (current: number, total: number) => string;
  /** Button that starts the tour again, once the offer is answered. */
  replay: string;
};

type Props = {
  steps: TourStep[];
  /** Remembers, on this device, that the offer was answered: it is made only once. */
  storageKey: string;
  labels: Labels;
  className?: string;
};

function readSeen(key: string) {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    // Storage blocked (private mode…): no offer rather than one on every visit.
    return true;
  }
}

function writeSeen(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Storage blocked: nothing to remember.
  }
}

const subscribe = () => () => {};

/** Present and laid out: a step whose element is missing or hidden is skipped. */
const isShown = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/** The step's element on display: several may share a target (one per screen size), only one is shown. */
const findTarget = (target: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)].find(isShown) ?? null;

/** Room the step card needs above or below the ringed element; otherwise it floats at the bottom. */
const CARD_ROOM = 230;
const GAP = 12;
const MARGIN = 16;
const CARD_WIDTH = 384;

/** Where the step card goes: next to the ringed element, pointing at it, or at the bottom of the screen. */
function placeCard(rect: DOMRect) {
  const width = Math.min(CARD_WIDTH, window.innerWidth - 2 * MARGIN);
  const left = Math.min(Math.max(rect.left, MARGIN), window.innerWidth - width - MARGIN);
  const arrow = Math.min(Math.max(rect.left + rect.width / 2 - left, 20), width - 20);
  const below = window.innerHeight - rect.bottom - GAP;
  const above = rect.top - GAP;
  if (below >= CARD_ROOM) return { side: "below" as const, style: { top: rect.bottom + GAP, left, width }, arrow };
  if (above >= CARD_ROOM) return { side: "above" as const, style: { bottom: window.innerHeight - rect.top + GAP, left, width }, arrow };
  return { side: "floating" as const, style: { bottom: MARGIN, left, width }, arrow };
}

/**
 * Optional guided tour of a page. The first time, a small card offers it; accepted, each step
 * rings an element of the page (marked with `data-tour`) and explains it in a bubble pointing at
 * it, with buttons to go on, go back or leave the tour; the rest of the page is dimmed, but stays
 * usable during the tour.
 * Once the offer is answered, a button starts the tour again.
 */
export function GuidedTour({ steps, storageKey, labels, className }: Props) {
  // Server and first render: as if already seen, so the offer only ever appears in the browser.
  const seen = useSyncExternalStore(subscribe, () => readSeen(storageKey), () => true);
  const [answered, setAnswered] = useState(false);
  const [active, setActive] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const step = active?.[index];

  const answer = () => {
    writeSeen(storageKey);
    setAnswered(true);
  };

  const start = () => {
    answer();
    const shown = steps.filter((s) => findTarget(s.target));
    if (shown.length === 0) return;
    setIndex(0);
    setRect(null);
    setActive(shown);
  };

  const close = () => {
    setActive(null);
    setRect(null);
  };

  // Brings the step's element into view, then follows it while the page scrolls or resizes.
  useEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    };
    update();
    window.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [step]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Focus follows the steps, once the card is laid out next to its element.
  const placed = !!rect;
  useEffect(() => {
    if (placed) cardRef.current?.focus({ preventScroll: true });
  }, [index, placed]);

  const offering = !seen && !answered && !active;
  const placement = rect && placeCard(rect);

  return (
    <>
      <Button variant="ghost" className={cn("w-full", className)} onClick={start}>
        <CircleHelp data-icon="inline-start" />
        {labels.replay}
      </Button>

      {offering &&
        createPortal(
          <div
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className={cn(
              "fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0 sm:w-sm",
              "space-y-3 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 sm:bottom-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4",
            )}
          >
            <p id={titleId} className="font-heading text-base font-bold">
              {labels.offerTitle}
            </p>
            <p id={bodyId} className="text-muted-foreground">
              {labels.offerBody}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={answer}>
                {labels.dismiss}
              </Button>
              <Button onClick={start}>{labels.start}</Button>
            </div>
          </div>,
          document.body,
        )}

      {active &&
        step &&
        createPortal(
          <>
            {/* The ring's huge shadow dims the rest of the page (black, like the dialogs' backdrop),
                leaving the element of the step lit. */}
            {rect && (
              <div
                aria-hidden
                data-testid="tour-ring"
                className="pointer-events-none fixed z-40 rounded-xl shadow-[0_0_0_100vmax_rgb(0_0_0/0.6)] ring-4 ring-highlight motion-safe:transition-[top,left,width,height] motion-safe:duration-300"
                style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
              />
            )}
            {placement && (
              <div
                ref={cardRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="false"
                aria-labelledby={titleId}
                aria-describedby={bodyId}
                className="fixed z-50 space-y-3 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:transition-[top,bottom,left] motion-safe:duration-300"
                style={placement.style}
              >
                {/* Arrow pointing at the ringed element (none when the card floats at the bottom). */}
                {placement.side !== "floating" && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute size-3 -translate-x-1/2 rotate-45 border-foreground/10 bg-popover",
                      placement.side === "below" ? "-top-1.5 border-t border-l" : "-bottom-1.5 border-r border-b",
                    )}
                    style={{ left: placement.arrow }}
                  />
                )}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{labels.progress(index + 1, active.length)}</p>
                  <p id={titleId} className="font-heading text-base font-bold">
                    {step.title}
                  </p>
                </div>
                <p id={bodyId} className="text-muted-foreground">
                  {step.body}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button variant="ghost" className="-ml-2 text-muted-foreground" onClick={close}>
                    {labels.quit}
                  </Button>
                  <div className="flex gap-2">
                    {index > 0 && (
                      <Button variant="outline" onClick={() => setIndex(index - 1)}>
                        {labels.back}
                      </Button>
                    )}
                    {index < active.length - 1 ? (
                      <Button onClick={() => setIndex(index + 1)}>{labels.next}</Button>
                    ) : (
                      <Button onClick={close}>{labels.done}</Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </>
  );
}
