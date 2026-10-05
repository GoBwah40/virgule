"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  slides: React.ReactNode[];
  /** Position of each slide, already formatted (e.g. "Topic 2 of 3"). */
  positions: string[];
  /** Name of the whole read by screen readers (e.g. "Results by topic"). */
  label: string;
  /** Time on each slide. */
  intervalMs?: number;
  className?: string;
};

/**
 * One slide at a time on the room screen, moving on by itself. No controls on screen: on the
 * device showing it, arrows and Page Up / Page Down (a presentation clicker) move between slides,
 * the space bar pauses.
 */
export function PresentationCarousel({ slides, positions, label, intervalMs = 12_000, className }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  // Fewer slides after an update (a topic deleted): stay within bounds.
  const current = Math.min(index, count - 1);

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (Math.min(i, count - 1) + 1) % count), intervalMs);
    return () => clearInterval(timer);
  }, [count, paused, intervalMs, index]);

  useEffect(() => {
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
  }, [count]);

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
        <div className="flex items-center gap-[0.8em] stage-xs text-muted-foreground">
          <span aria-live={paused ? "polite" : "off"}>{positions[current]}</span>
          <span className="flex gap-[0.4em]" aria-hidden>
            {slides.map((_, i) => (
              <span key={i} className={cn("size-[0.6em] rounded-full", i === current ? "bg-highlight" : "bg-muted")} />
            ))}
          </span>
        </div>
      )}
    </section>
  );
}
