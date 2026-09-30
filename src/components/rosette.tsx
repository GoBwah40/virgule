import { COMMA_PATH } from "@/components/logo";
import { cn } from "@/lib/utils";

// Six virgules, une par place d'une séance, aux couleurs de la marque (jamais celles des votes).
const FILLS = ["fill-brand", "fill-highlight", "fill-primary"] as const;

/** Décor de la page d'accueil : six virgules tournées de 60° autour d'un centre. */
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
