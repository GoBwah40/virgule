import { cn } from "@/lib/utils";

type Props = {
  items: { value: number | string; label: string }[];
  className?: string;
};

/** Row of key figures ("6 seats", "7 days online"), the number in DM Mono. */
export function KeyFigures({ items, className }: Props) {
  return (
    <ul className={cn("flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground", className)}>
      {items.map(({ value, label }) => (
        <li key={label} className="flex items-baseline gap-1.5">
          <span className="font-mono text-foreground tabular-nums">{value}</span>
          {label}
        </li>
      ))}
    </ul>
  );
}
