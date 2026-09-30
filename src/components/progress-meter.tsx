import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max: number;
  /** Texte affiché à côté des pastilles (ex. « 3 personnes sur 5 ont voté »). */
  label: string;
  /** Texte affiché une fois l'objectif atteint (ex. « Tout le monde a voté »). */
  completeLabel: string;
  /** Nom lu par les lecteurs d'écran (ex. « Participants ayant voté »). */
  ariaLabel: string;
  className?: string;
};

/** Au-delà, les pastilles deviennent illisibles : on passe à une barre. */
const MAX_DOTS = 10;

/**
 * Avancement : une pastille par unité (jusqu'à 10, une barre au-delà), remplie en
 * mangue, puis tout passe en vert quand c'est complet.
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
            className={cn("block h-full rounded-full transition-all duration-300", complete ? "bg-success" : "bg-highlight")}
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
