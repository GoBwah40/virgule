import { Children, isValidElement } from "react";

import { cn } from "@/lib/utils";

type Props = {
  /** Blocks of any height, each with its `key`. */
  children: React.ReactNode;
  className?: string;
};

/**
 * Blocks of uneven heights, stacked without gaps: one column on phones, two from `md`.
 * Blocks alternate between the columns (1st left, 2nd right…), so a block that grows never
 * jumps to the other column. On phones, `order` restores the original sequence.
 */
export function MasonryColumns({ children, className }: Props) {
  const items = Children.toArray(children);
  const column = (parity: number) => (
    <div className="contents md:flex md:min-w-0 md:flex-col md:gap-6">
      {items.map((item, i) =>
        i % 2 === parity ? (
          <div key={isValidElement(item) && item.key !== null ? item.key : i} className="min-w-0" style={{ order: i }}>
            {item}
          </div>
        ) : null,
      )}
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start", className)}>
      {column(0)}
      {column(1)}
    </div>
  );
}
