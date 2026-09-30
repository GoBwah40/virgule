import { cn } from "@/lib/utils";

type Props = {
  /** Fourchettes retenues, en euros entiers. */
  ranges: { min: number; max: number }[];
  /** Zone mise en avant (la plus partagée). */
  best: { start: number; end: number };
  locale: string;
  labels: { range: string; zone: string; amounts: string };
  className?: string;
};

/** Pas de graduation « rond » (1, 2 ou 5 × 10ⁿ) pour environ 4 intervalles. */
function niceStep(max: number) {
  const raw = max / 4;
  const power = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 5, 10].map((n) => n * power).find((s) => s >= raw) ?? power * 10;
}

/** Fourchettes retenues sur une même échelle, zone compatible encadrée. */
export function AmountOverview({ ranges, best, locale, labels, className }: Props) {
  const top = Math.max(...ranges.map((r) => r.max));
  const step = niceStep(top);
  const scaleMax = Math.ceil(top / step) * step || step;
  const pc = (v: number) => (v / scaleMax) * 100;
  const euro = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const ticks = Array.from({ length: Math.round(scaleMax / step) + 1 }, (_, i) => i * step);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative grid gap-1.5 py-1.5" role="img" aria-label={labels.amounts}>
        {ranges.map((r, i) => (
          <div key={i} className="relative h-5">
            <span
              className="absolute inset-y-0 rounded-md bg-success/50"
              style={{ left: `${pc(r.min)}%`, width: `max(0.25rem, ${pc(r.max) - pc(r.min)}%)` }}
            />
          </div>
        ))}
        <span
          className="pointer-events-none absolute inset-y-0 rounded-lg border-2 border-foreground bg-highlight/35 motion-safe:animate-in motion-safe:fade-in"
          style={{ left: `${pc(best.start)}%`, width: `max(0.25rem, ${pc(best.end) - pc(best.start)}%)` }}
        />
      </div>
      <div className="relative h-4 font-mono text-[10px] text-muted-foreground tabular-nums" aria-hidden>
        {ticks.map((v, i) => (
          <span
            key={v}
            className={cn(
              "absolute whitespace-nowrap",
              i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
            )}
            style={{ left: `${pc(v)}%` }}
          >
            {euro.format(v)}
          </span>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-success/50" aria-hidden />
          {labels.range}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-foreground bg-highlight/35" aria-hidden />
          {labels.zone}
        </li>
      </ul>
    </div>
  );
}
