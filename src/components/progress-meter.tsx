import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max: number;
  /** Text shown next to the dots (e.g. "3 people out of 5 have voted"). */
  label: string;
  /** Text shown once the goal is reached (e.g. "Everyone has voted"). */
  completeLabel: string;
  /** Name read by screen readers (e.g. "Participants who voted"). */
  ariaLabel: string;
  className?: string;
};

/** Above this, dots become unreadable: switch to a bar. */
const MAX_DOTS = 10;

/**
 * Progress: one dot per unit (up to 10, a bar above that), filled in mango, then
 * everything turns green when complete.
 */
export function ProgressMeter({ value, max, label, completeLabel, ariaLabel, className }: Props) {
  const complete = max > 0 && value >= max;

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={complete ? completeLabel : label}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border-[1.5px] px-3 py-1.5 text-sm font-semibold transition-colors duration-300",
        complete ? "border-success/40 bg-success/10 text-success" : "border-border bg-card",
        className,
      )}
    >
      {max > MAX_DOTS ? (
        <span className="h-2.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span
            className={cn("block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300", complete ? "bg-success" : "bg-highlight")}
            style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          />
        </span>
      ) : (
        <span className="flex gap-1" aria-hidden>
          {Array.from({ length: max }, (_, i) => (
            <span
              key={i}
              className={cn(
                "size-2.5 rounded-full transition-colors duration-300",
                complete ? "bg-success" : i < value ? "bg-highlight" : "bg-muted",
              )}
            />
          ))}
        </span>
      )}
      {complete && <Check className="size-4 motion-safe:animate-pop" aria-hidden />}
      <span aria-live="polite">{complete ? completeLabel : label}</span>
    </div>
  );
}
