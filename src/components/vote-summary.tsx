import { ArrowDown, ArrowUp, Coins } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  up: number;
  down: number;
  /**
   * Already formatted labels (e.g. "4 for", "1 against"). Without `down`, a points topic: only
   * the total (e.g. "12 points"), with no "against".
   */
  labels: { up: string; down?: string };
  /** Points topics: the bar's full length (the most points an idea of the topic got). */
  max?: number;
  className?: string;
};

/**
 * Vote breakdown: "for" on the left, "against" on the right, above a proportional bar. In a
 * points topic, the points alone, with a bar measured against the topic's leading idea.
 */
export function VoteSummary({ up, down, labels, max, className }: Props) {
  const points = labels.down === undefined;
  const total = points ? Math.max(max ?? up, up) : up + down;
  const upShare = total === 0 ? 0 : (up / total) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Each label sits above its color in the bar: for on the left, against on the right. */}
      <div className="flex items-center justify-between gap-4 text-sm font-semibold tabular-nums">
        <span className="inline-flex items-center gap-1 text-success">
          {points ? <Coins className="size-4" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}
          {labels.up}
        </span>
        {!points && (
          <span className="inline-flex items-center gap-1 text-destructive">
            <ArrowDown className="size-4" aria-hidden />
            {labels.down}
          </span>
        )}
      </div>
      {/* Decorative bar: the text above already carries the information. */}
      <div className="flex h-2 overflow-hidden rounded-full bg-border" aria-hidden>
        {total > 0 && (
          <>
            <span className="bg-success motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${upShare}%` }} />
            {!points && (
              <span className="bg-destructive motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${100 - upShare}%` }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
