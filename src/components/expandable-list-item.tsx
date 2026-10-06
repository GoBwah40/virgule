"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { LIST_ITEM_TONES } from "@/components/list-item";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  meta?: React.ReactNode;
  /** Items shown on the right (not interactive: the whole row is already a button). */
  aside?: React.ReactNode;
  /** Content revealed under the row on tap (e.g. vote details). */
  details: React.ReactNode;
  tone?: keyof typeof LIST_ITEM_TONES;
  defaultOpen?: boolean;
  className?: string;
};

/**
 * List row that expands on tap, click or keyboard: same look as ListItem,
 * with a chevron hinting that there are details to see.
 */
export function ExpandableListItem({ children, meta, aside, details, tone = "neutral", defaultOpen = false, className }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const detailsId = useId();

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border-[1.5px] transition-colors duration-300",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
        LIST_ITEM_TONES[tone],
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer flex-col gap-2.5 px-3.5 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:ring-inset sm:flex-row sm:items-center sm:justify-between sm:gap-3"
      >
        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="block text-[15px] font-medium wrap-anywhere whitespace-pre-wrap">{children}</span>
          {meta && <span className="flex flex-wrap items-center gap-1.5">{meta}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          {aside}
          <ChevronDown
            className={cn("size-5 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200", open && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>
      {/* `hidden` removes the details from the accessibility tree when collapsed; they fade in. */}
      <div
        id={detailsId}
        hidden={!open}
        className="px-3.5 pb-3.5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1"
      >
        {details}
      </div>
    </li>
  );
}
