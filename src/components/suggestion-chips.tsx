"use client";

import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  items: { id: string; label: string }[];
  onSelect: (id: string) => void;
  /** Group label, read by screen readers. */
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Suggestions added in one tap (dashed pills). */
export function SuggestionChips({ items, onSelect, label, disabled, className }: Props) {
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.id)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-border bg-card dark:border-muted-foreground/45 px-3.5 text-sm font-semibold transition-colors outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 hover:border-primary/50 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="size-4 text-primary" aria-hidden />
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
