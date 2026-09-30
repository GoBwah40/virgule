import { cn } from "@/lib/utils";

type Props = {
  /** Main sentence ("Common slot: June 12 – 14, 2027"). */
  summary: string;
  /** Detail ("Shared by all 3 periods kept."). */
  detail: string;
  /** True if the zone is shared by every proposal kept. */
  common: boolean;
  className?: string;
};

/** Recap summary box: green if everyone overlaps, mango otherwise. */
export function OverviewSummary({ summary, detail, common, className }: Props) {
  return (
    <div
      className={cn(
        "grid gap-0.5 rounded-2xl border-[1.5px] px-3.5 py-3",
        common ? "border-success/40 bg-success/10" : "border-highlight/60 bg-highlight-soft",
        className,
      )}
    >
      <p className="font-semibold">{summary}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
