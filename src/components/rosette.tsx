import { COMMA_PATH } from "@/components/logo";
import { cn } from "@/lib/utils";

// Six commas, one per session seat, in brand colors (never the vote colors).
const FILLS = ["fill-brand", "fill-highlight", "fill-primary"] as const;

/** Home page decoration: six commas rotated 60° around a center. */
export function Rosette({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={cn("pointer-events-none", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <g key={i} transform={`rotate(${(i * 360) / count})`}>
          <path d={COMMA_PATH} transform="translate(-14 -52) scale(0.56)" className={FILLS[i % FILLS.length]} />
        </g>
      ))}
    </svg>
  );
}
