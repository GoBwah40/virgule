import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max: number;
  /** Text next to the bar (e.g. "4 people out of 6 have voted"). */
  label: string;
  /** Text once the goal is reached (e.g. "Everyone has voted"). */
  completeLabel: string;
  /** Name read by screen readers (e.g. "Participants who voted"). */
  ariaLabel: string;
  className?: string;
};

/** Progress on the room screen: a wide bar in mango, green once complete. A total, nothing more. */
export function PresentationProgress({ value, max, label, completeLabel, ariaLabel, className }: Props) {
  const complete = max > 0 && value >= max;
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={complete ? completeLabel : label}
      className={cn("flex flex-wrap items-center gap-x-[0.8em] gap-y-2 stage-sm font-semibold", complete && "text-success", className)}
    >
      <span className="h-[0.65em] w-[clamp(6rem,18vw,24rem)] overflow-hidden rounded-full bg-muted" aria-hidden>
        <span
          className={cn(
            "block h-full rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-300",
            complete ? "bg-success" : "bg-highlight",
          )}
          style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }}
        />
      </span>
      <span className="inline-flex items-center gap-[0.4em]">
        {complete && <Check className="size-[1.1em] motion-safe:animate-pop" aria-hidden />}
        <span aria-live="polite">{complete ? completeLabel : label}</span>
      </span>
    </div>
  );
}
