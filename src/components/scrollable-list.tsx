"use client";

import { Children, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  /** List rows (`<li>`), each with its `key`. */
  children: React.ReactNode;
  /** Name read by screen readers for the scrolling area (e.g. "Ideas"). */
  label: string;
  className?: string;
};

/** Distance from an edge under which we consider the list scrolled to that edge. */
const EDGE_PX = 8;

/**
 * List with a maximum height and its own scroll, so a long list does not stretch its card.
 * A fade at the top or bottom hints that there is more to see. When a row is added while
 * the list is scrolled to the bottom, it stays at the bottom so the new row shows.
 */
export function ScrollableList({ children, label, className }: Props) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ overflows: false, top: true, bottom: true });
  const atBottom = useRef(true);
  const count = Children.count(children);
  const previousCount = useRef(count);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE_PX;
    atBottom.current = bottom;
    const next = { overflows: el.scrollHeight > el.clientHeight, top: el.scrollTop <= EDGE_PX, bottom };
    // Scroll events fire continuously: only re-render when an edge changes.
    setEdges((prev) =>
      prev.overflows === next.overflows && prev.top === next.top && prev.bottom === next.bottom ? prev : next,
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // New row while at the bottom: follow it (before paint, to avoid a visible jump).
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && count > previousCount.current && atBottom.current) el.scrollTop = el.scrollHeight;
    previousCount.current = count;
    measure();
  }, [count, measure]);

  return (
    <div className="relative">
      <ul
        ref={ref}
        onScroll={measure}
        // Focusable only when it scrolls, so keyboard users can scroll it too.
        tabIndex={edges.overflows ? 0 : undefined}
        aria-label={label}
        className={cn(
          // The padding leaves room for focus rings, which the scroll would otherwise clip, and
          // for a row sliding in from below, which would otherwise flash a scrollbar.
          "-mx-1 -mt-1 -mb-3 max-h-[min(26rem,60svh)] space-y-2 overflow-y-auto overscroll-contain rounded-xl px-1 pt-1 pb-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
      >
        {children}
      </ul>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 -top-1 h-6 bg-linear-to-b from-card to-transparent transition-opacity duration-200",
          edges.overflows && !edges.top ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 -bottom-3 h-8 bg-linear-to-t from-card to-transparent transition-opacity duration-200",
          edges.overflows && !edges.bottom ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
