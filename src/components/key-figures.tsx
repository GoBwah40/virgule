import { cn } from "@/lib/utils";

type Props = {
  items: { value: number | string; label: string }[];
  className?: string;
};

/** Rangée de repères chiffrés (« 6 places », « 7 jours en ligne »), le chiffre en DM Mono. */
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
