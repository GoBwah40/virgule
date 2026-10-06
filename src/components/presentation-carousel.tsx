"use client";

import { ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  slides: React.ReactNode[];
  /** Position of each slide, already formatted (e.g. "Topic 2 of 3"). */
  positions: string[];
  /** Name of the whole read by screen readers (e.g. "Results by topic"). */
  label: string;
  /** Time on each slide. */
  intervalMs?: number;
  /**
   * On someone's own device: previous / next buttons instead of moving on by itself, and no
   * keyboard shortcuts across the page (its fields and buttons keep their keys).
   */
  controls?: { previous: string; next: string };
  /** Room screen: shown while the space bar holds the rotation, so a pause never goes unnoticed. */
  pausedLabel?: string;
  className?: string;
};

/**
 * One slide at a time. On the room screen, it moves on by itself, with no controls on screen: on
 * the device showing it, arrows and Page Up / Page Down (a presentation clicker) move between
 * slides, the space bar pauses. With `controls`, buttons instead, for someone's own device.
 */
export function PresentationCarousel({ slides, positions, label, intervalMs = 12_000, controls, pausedLabel, className }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  // Fewer slides after an update (a topic deleted): stay within bounds.
  const current = Math.min(index, count - 1);

  const stage = !controls;
  const step = (delta: number) => setIndex((i) => (Math.min(i, count - 1) + delta + count) % count);

  useEffect(() => {
    if (!stage || count < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (Math.min(i, count - 1) + 1) % count), intervalMs);
    return () => clearInterval(timer);
  }, [stage, count, paused, intervalMs, index]);

  useEffect(() => {
    if (!stage) return;
    const onKey = (event: KeyboardEvent) => {
      if (count < 2) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") setIndex((i) => (Math.min(i, count - 1) + 1) % count);
      else if (event.key === "ArrowLeft" || event.key === "PageUp") setIndex((i) => (Math.min(i, count - 1) - 1 + count) % count);
      else if (event.key === " ") setPaused((p) => !p);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, count]);

  if (count === 0) return null;

  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn("flex min-h-0 flex-1 flex-col gap-[3vh]", className)}>
      <div
        key={current}
        role="group"
        aria-roledescription="slide"
        aria-label={positions[current]}
        className="flex min-h-0 flex-1 flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
      >
        {slides[current]}
      </div>
      {count > 1 && (
        <div className={cn("flex items-center gap-[0.8em] text-muted-foreground", stage ? "stage-xs" : "justify-center text-sm")}>
          {controls && (
            <Button variant="outline" size="icon" aria-label={controls.previous} title={controls.previous} onClick={() => step(-1)}>
              <ChevronLeft />
            </Button>
          )}
          <span aria-live={paused || !stage ? "polite" : "off"}>{positions[current]}</span>
          {stage && paused && pausedLabel && (
            <span className="inline-flex items-center gap-[0.3em] text-foreground">
              <Pause className="size-[1em]" aria-hidden />
              {pausedLabel}
            </span>
          )}
          <span className="flex gap-[0.4em]" aria-hidden>
            {slides.map((_, i) => (
              <span
                key={i}
                // On a light page, muted would not show: a darker grey for the others.
                className={cn("size-[0.6em] rounded-full", i === current ? "bg-highlight" : stage ? "bg-muted" : "bg-muted-foreground/30")}
              />
            ))}
          </span>
          {controls && (
            <Button variant="outline" size="icon" aria-label={controls.next} title={controls.next} onClick={() => step(1)}>
              <ChevronRight />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
